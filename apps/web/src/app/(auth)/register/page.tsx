"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useRegister } from "@/lib/api/queries";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const schema = z.object({
  display_name: z.string().min(2, "Nome muito curto"),
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
  lgpd: z.literal(true, { errorMap: () => ({ message: "Obrigatório" }) }),
});

type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const { setTokens, setUser } = useAuthStore();
  const register_ = useRegister();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await register_.mutateAsync({
        email: data.email,
        password: data.password,
        display_name: data.display_name,
      });
      setTokens(res.access_token, res.refresh_token);
      setUser({
        id: "",
        role: "student",
        displayName: data.display_name,
        ejaLevel: null,
        xpTotal: 0,
        level: 1,
        streakDays: 0,
      });
      router.push("/diagnostic");
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      setServerError(
        msg.includes("409") || msg.includes("já cadastrado")
          ? "Este email já está em uso"
          : "Erro ao criar conta. Tente novamente."
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-5 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl animate-bob inline-block">📚</span>
          <h1 className="font-display font-800 text-[26px] text-ink mt-3 text-balance">
            Comece sua jornada de aprendizado!
          </h1>
          <p className="text-ink-soft mt-1">Grátis, sempre.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div>
            <label className="block text-ink font-600 text-sm mb-1.5">Como você quer ser chamado?</label>
            <input
              type="text"
              autoComplete="name"
              placeholder="Seu nome"
              {...register("display_name")}
              className={cn(
                "w-full h-12 px-4 bg-surface border rounded-inner text-ink placeholder:text-ink-muted text-[16px] outline-none transition-colors",
                errors.display_name ? "border-[#E5484D]" : "border-line-2 focus:border-green"
              )}
            />
            {errors.display_name && (
              <p className="text-[#E5484D] text-xs mt-1">{errors.display_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-ink font-600 text-sm mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              placeholder="seu@email.com"
              {...register("email")}
              className={cn(
                "w-full h-12 px-4 bg-surface border rounded-inner text-ink placeholder:text-ink-muted text-[16px] outline-none transition-colors",
                errors.email ? "border-[#E5484D]" : "border-line-2 focus:border-green"
              )}
            />
            {errors.email && (
              <p className="text-[#E5484D] text-xs mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-ink font-600 text-sm mb-1.5">Senha</label>
            <input
              type="password"
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              {...register("password")}
              className={cn(
                "w-full h-12 px-4 bg-surface border rounded-inner text-ink placeholder:text-ink-muted text-[16px] outline-none transition-colors",
                errors.password ? "border-[#E5484D]" : "border-line-2 focus:border-green"
              )}
            />
            {errors.password && (
              <p className="text-[#E5484D] text-xs mt-1">{errors.password.message}</p>
            )}
          </div>

          {/* LGPD consent */}
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              {...register("lgpd")}
              className="mt-0.5 h-5 w-5 rounded accent-green flex-shrink-0"
            />
            <span className="text-sm text-ink-soft leading-snug">
              Concordo com a{" "}
              <span className="text-green font-600">Política de Privacidade</span> e autorizo o
              uso dos meus dados para personalizar minha trilha de aprendizado.
            </span>
          </label>
          {errors.lgpd && (
            <p className="text-[#E5484D] text-xs -mt-2">{errors.lgpd.message}</p>
          )}

          {serverError && (
            <div className="bg-[#FDE7E7] border border-[#E5484D]/20 rounded-inner px-4 py-3 text-[#C5292E] text-sm">
              {serverError}
            </div>
          )}

          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-14 text-[18px] mt-2 shadow-green-cta"
          >
            {isSubmitting ? "Criando conta…" : "Criar conta grátis 🚀"}
          </Button>
        </form>

        <p className="text-center text-ink-soft mt-6">
          Já tem conta?{" "}
          <Link href="/login" className="text-green font-700 hover:underline min-h-0">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
