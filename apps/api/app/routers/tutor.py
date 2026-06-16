import uuid

import anthropic
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.config import settings
from app.core.database import get_db
from app.models.content import Resource
from app.models.tutor import TutorConversation, TutorMessage
from app.models.user import StudentProfile

router = APIRouter()

_anthropic_client = anthropic.AsyncAnthropic(api_key=settings.ANTHROPIC_API_KEY)

TUTOR_SYSTEM_PROMPT = """
Você é um tutor educacional especializado em EJA (Educação de Jovens e Adultos), chamado "Edu".

Princípios de interação:
- Use linguagem simples, acolhedora e sem julgamento
- Nunca dê a resposta diretamente — guie o aluno com perguntas e analogias
- Use analogias do cotidiano: trabalho, casa, família, compras, cozinha
- Se o aluno errar, reforce: "Errar faz parte de aprender, vamos tentar juntos"
- Responda sempre em pt-BR, máximo 3 parágrafos curtos
- Nunca use jargão técnico sem explicar primeiro

Contexto do recurso:
{resource_context}

Perfil do aluno:
- Nível EJA: {eja_level}
- Estilo de aprendizagem: {learning_style}
"""


class CreateConversationRequest(BaseModel):
    user_id: uuid.UUID
    resource_id: uuid.UUID | None = None
    learning_path_item_id: uuid.UUID | None = None


class ConversationOut(BaseModel):
    id: uuid.UUID
    resource_id: uuid.UUID | None
    model_config = {"from_attributes": True}


class SendMessageRequest(BaseModel):
    user_id: uuid.UUID
    message: str


@router.post("/conversations", response_model=ConversationOut, status_code=201)
async def create_conversation(
    body: CreateConversationRequest,
    db: AsyncSession = Depends(get_db),
):
    conversation = TutorConversation(
        user_id=body.user_id,
        resource_id=body.resource_id,
        learning_path_item_id=body.learning_path_item_id,
    )
    db.add(conversation)
    await db.commit()
    await db.refresh(conversation)
    return conversation


@router.post("/conversations/{conversation_id}/messages")
async def send_message(
    conversation_id: uuid.UUID,
    body: SendMessageRequest,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(TutorConversation)
        .options(selectinload(TutorConversation.messages))
        .where(TutorConversation.id == conversation_id, TutorConversation.user_id == body.user_id)
    )
    conversation = result.scalar_one_or_none()
    if not conversation:
        raise HTTPException(status_code=404, detail="Conversa não encontrada")

    resource_context = ""
    if conversation.resource_id:
        res_result = await db.execute(
            select(Resource)
            .options(selectinload(Resource.enrichment))
            .where(Resource.id == conversation.resource_id)
        )
        resource = res_result.scalar_one_or_none()
        if resource:
            enrichment = resource.enrichment
            transcript_excerpt = (enrichment.transcript or "")[:2000] if enrichment else ""
            resource_context = f'Recurso: "{resource.title}"\nTranscrição: {transcript_excerpt}'

    student_result = await db.execute(
        select(StudentProfile).where(StudentProfile.user_id == body.user_id)
    )
    student = student_result.scalar_one_or_none()

    system = TUTOR_SYSTEM_PROMPT.format(
        resource_context=resource_context or "Conversa geral",
        eja_level=student.eja_level if student else "não definido",
        learning_style=student.learning_style if student else "não definido",
    )

    messages_history = [{"role": m.role, "content": m.content} for m in conversation.messages[-10:]]
    messages_history.append({"role": "user", "content": body.message})

    user_msg = TutorMessage(
        conversation_id=conversation_id,
        role="user",
        content=body.message,
    )
    db.add(user_msg)
    await db.flush()

    async def stream_response():
        full_response = ""
        async with _anthropic_client.messages.stream(
            model="claude-sonnet-4-6",
            system=system,
            messages=messages_history,  # type: ignore[arg-type]
            max_tokens=500,
        ) as stream:
            async for chunk in stream.text_stream:
                full_response += chunk
                yield f"data: {chunk}\n\n"

        assistant_msg = TutorMessage(
            conversation_id=conversation_id,
            role="assistant",
            content=full_response,
        )
        db.add(assistant_msg)
        await db.commit()
        yield "data: [DONE]\n\n"

    return StreamingResponse(stream_response(), media_type="text/event-stream")
