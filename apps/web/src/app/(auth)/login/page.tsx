"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { useLogin } from "@/lib/api/queries";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const schema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Mínimo 6 caracteres"),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const { setTokens } = useAuthStore();
  const login = useLogin();
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: FormData) => {
    setServerError("");
    try {
      const res = await login.mutateAsync({ email: data.email, password: data.password });
      setTokens(res.access_token, res.refresh_token);
      router.push("/dashboard");
    } catch (e: unknown) {
      const msg = (e as { message?: string })?.message ?? "";
      setServerError(
        msg.includes("401") || msg.includes("Credenciais")
          ? "Email ou senha incorretos"
          : "Erro ao fazer login. Tente novamente."
      );
    }
  };

  return (
    <div className="min-h-screen bg-paper flex flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <span className="text-5xl animate-bob inline-block">🌱</span>
          <h1 className="font-display font-800 text-[28px] text-ink mt-3">Bem-vindo de volta!</h1>
          <p className="text-ink-soft mt-1">Entre para continuar sua trilha</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
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
              autoComplete="current-password"
              placeholder="••••••••"
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
            {isSubmitting ? "Entrando…" : "Entrar 🚀"}
          </Button>
        </form>

        <p className="text-center text-ink-soft mt-6">
          Ainda não tem conta?{" "}
          <Link href="/register" className="text-green font-700 hover:underline min-h-0">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  );
}
