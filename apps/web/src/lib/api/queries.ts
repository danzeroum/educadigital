import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";

// ─── Auth ────────────────────────────────────────────────────────────────────

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

interface LoginPayload {
  email?: string;
  phone?: string;
  password: string;
}

export function useLogin() {
  return useMutation({
    mutationFn: (body: LoginPayload) => api.post<TokenResponse>("/auth/login", body),
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: (body: LoginPayload & { display_name: string }) =>
      api.post<TokenResponse>("/auth/register", body),
  });
}

// ─── Gamification ────────────────────────────────────────────────────────────

interface GamificationProfile {
  xp_total: number;
  level: number;
  streak_days: number;
  xp_to_next_level: number;
}

export function useGamificationProfile(userId: string | null) {
  return useQuery<GamificationProfile>({
    queryKey: ["gamification", "profile", userId],
    queryFn: () => api.get<GamificationProfile>(`/gamification/profile?user_id=${userId}`),
    enabled: !!userId,
    staleTime: 60_000,
  });
}

interface Achievement {
  id: string;
  slug: string;
  name: string;
  description: string;
  icon_url: string | null;
  xp_reward: number;
  earned_at: string | null;
}

export function useAchievements(userId: string | null) {
  return useQuery<Achievement[]>({
    queryKey: ["gamification", "achievements", userId],
    queryFn: () => api.get<Achievement[]>(`/gamification/achievements?user_id=${userId}`),
    enabled: !!userId,
  });
}

interface Certificate {
  id: string;
  certificate_type: string;
  title: string;
  issued_at: string;
  pdf_url: string | null;
  verification_code: string;
}

export function useCertificates(userId: string | null) {
  return useQuery<Certificate[]>({
    queryKey: ["gamification", "certificates", userId],
    queryFn: () => api.get<Certificate[]>(`/gamification/certificates?user_id=${userId}`),
    enabled: !!userId,
  });
}

// ─── Learning path ────────────────────────────────────────────────────────────

interface PathItem {
  id: string;
  resource_id: string;
  item_order: number;
  is_required: boolean;
  status: string;
}

interface LearningPath {
  id: string;
  title: string;
  eja_level: string;
  status: string;
  total_resources: number;
  completed_resources: number;
  items: PathItem[];
}

export function useLearningPath(userId: string | null) {
  return useQuery<LearningPath>({
    queryKey: ["learning", "path", userId],
    queryFn: () => api.get<LearningPath>(`/learning/path?user_id=${userId}`),
    enabled: !!userId,
  });
}

interface SrsCard {
  id: string;
  concept_label: string;
  due_date: string;
  resource_id: string | null;
  exercise_id: string | null;
}

export function useDueSrsCards(userId: string | null) {
  return useQuery<SrsCard[]>({
    queryKey: ["srs", "due", userId],
    queryFn: () => api.get<SrsCard[]>(`/srs/due-cards?user_id=${userId}`),
    enabled: !!userId,
    staleTime: 30_000,
  });
}

export function useReviewSrsCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ cardId, rating }: { cardId: string; rating: number }) =>
      api.post(`/srs/cards/${cardId}/review`, { rating }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["srs", "due"] });
    },
  });
}

// ─── Content ──────────────────────────────────────────────────────────────────

interface Resource {
  id: string;
  title: string;
  media_type: string;
  original_url: string | null;
  cdn_url: string | null;
  duration_min: number | null;
  eja_level: string | null;
  thumbnail_url: string | null;
  status: string;
  difficulty_score: number | null;
  summary_basic: string | null;
  summary_intermediate: string | null;
  transcript: string | null;
  source_name: string | null;
  tags: string[];
  bncc_codes: string[];
}

export function useResources(params?: {
  level?: string;
  media_type?: string;
  page?: number;
}) {
  const qs = new URLSearchParams();
  if (params?.level) qs.set("level", params.level);
  if (params?.media_type) qs.set("media_type", params.media_type);
  if (params?.page) qs.set("page", String(params.page));

  return useQuery<Resource[]>({
    queryKey: ["content", "resources", params],
    queryFn: () => api.get<Resource[]>(`/content/resources?${qs}`),
    staleTime: 120_000,
  });
}

export function useResource(id: string | null) {
  return useQuery<Resource>({
    queryKey: ["content", "resource", id],
    queryFn: () => api.get<Resource>(`/content/resources/${id}`),
    enabled: !!id,
    staleTime: 300_000,
  });
}

export function useUpdateProgress() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      resourceId,
      completionPct,
      lastPositionSeconds,
    }: {
      resourceId: string;
      completionPct: number;
      lastPositionSeconds?: number;
    }) =>
      api.post(`/content/resources/${resourceId}/progress`, {
        completion_pct: completionPct,
        last_position_seconds: lastPositionSeconds,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["learning"] }),
  });
}

// ─── Resource checkpoints & exercises ────────────────────────────────────────

interface Checkpoint {
  id: string;
  timestamp_seconds: number;
  concept_key: string;
  checkpoint_order: number;
}

export function useResourceCheckpoints(resourceId: string | null) {
  return useQuery<Checkpoint[]>({
    queryKey: ["content", "checkpoints", resourceId],
    queryFn: () => api.get<Checkpoint[]>(`/content/resources/${resourceId}/checkpoints`),
    enabled: !!resourceId,
    staleTime: 300_000,
  });
}

export interface Exercise {
  id: string;
  exercise_type: string;
  content: {
    question: string;
    options?: string[];
    correct_index?: number;
    explanation?: string;
  };
  difficulty_level: number;
}

export function useResourceExercises(resourceId: string | null) {
  return useQuery<Exercise[]>({
    queryKey: ["content", "exercises", resourceId],
    queryFn: () => api.get<Exercise[]>(`/content/resources/${resourceId}/exercises`),
    enabled: !!resourceId,
    staleTime: 300_000,
  });
}

// ─── Diagnostic ───────────────────────────────────────────────────────────────

export interface DiagnosticResult {
  id: string;
  eja_level: string;
  learning_style: string;
  preferred_media: string;
  oral_fluency_score: number | null;
  writing_score: number | null;
  numeracy_score: number | null;
  reading_score: number | null;
  gaps: string[];
  strengths: string[];
  recommended_daily_minutes: number | null;
  llm_analysis: string | null;
}

export function useDiagnosticResult(sessionId: string | null) {
  return useQuery<DiagnosticResult>({
    queryKey: ["diagnostic", "result", sessionId],
    queryFn: () => api.get<DiagnosticResult>(`/diagnostic/result/${sessionId}`),
    enabled: !!sessionId,
    refetchInterval: (data) => (data ? false : 3000),
  });
}

export function useStartDiagnostic() {
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<{ session_id: string }>("/diagnostic/start", { user_id: userId }),
  });
}

// ─── Tutor / Dashboard ────────────────────────────────────────────────────────

interface StudentSummary {
  user_id: string;
  display_name: string;
  eja_level: string | null;
  streak_days: number;
  risk_level: string | null;
  risk_probability: number | null;
}

export function useTutorStudents(tutorId: string | null) {
  return useQuery<StudentSummary[]>({
    queryKey: ["dashboard", "students", tutorId],
    queryFn: () => api.get<StudentSummary[]>(`/dashboard/students?tutor_id=${tutorId}`),
    enabled: !!tutorId,
  });
}

interface RiskAlert {
  id: string;
  user_id: string;
  risk_level: string;
  risk_probability: number;
  contributing_factors: string[];
  suggested_action: string;
  suggested_message: string | null;
  generated_at: string;
  tutor_action: string | null;
}

export function useRiskAlerts(tutorId: string | null, level?: string) {
  return useQuery<RiskAlert[]>({
    queryKey: ["dashboard", "risk-alerts", tutorId, level],
    queryFn: () => {
      const qs = new URLSearchParams({ tutor_id: tutorId! });
      if (level) qs.set("level", level);
      return api.get<RiskAlert[]>(`/dashboard/risk-alerts?${qs}`);
    },
    enabled: !!tutorId,
  });
}

export function useActOnAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ alertId, action }: { alertId: string; action: "dismissed" | "acted" }) =>
      api.post(`/dashboard/risk-alerts/${alertId}/act`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard", "risk-alerts"] }),
  });
}

// ─── Tutor chat ───────────────────────────────────────────────────────────────

export function useCreateConversation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      resourceId,
    }: {
      userId: string;
      resourceId?: string;
    }) =>
      api.post<{ id: string; resource_id: string | null }>("/tutor/conversations", {
        user_id: userId,
        resource_id: resourceId ?? null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tutor", "conversations"] }),
  });
}
