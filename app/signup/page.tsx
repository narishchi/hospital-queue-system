
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }

    if (password !== confirmPassword) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "สมัครสมาชิกไม่สำเร็จ");
        return;
      }

      setSuccess("สมัครสมาชิกสำเร็จ กำลังไปหน้าเข้าสู่ระบบ...");
      setTimeout(() => router.push("/login"), 1000);
    } catch {
      setError("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้ กรุณาลองใหม่");
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10";

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#F4F8FC] px-4 py-10">
      <div className="pointer-events-none absolute -left-32 -top-32 h-80 w-80 rounded-full bg-sky-200/40 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl" />

      <section className="relative w-full max-w-md">
        <div className="mb-7 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600 text-white shadow-lg shadow-blue-600/20">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M12 3v18M3 12h18" strokeLinecap="round" />
              <rect x="3" y="3" width="18" height="18" rx="5" />
            </svg>
          </div>

          <p className="mt-5 text-xs font-bold tracking-[0.22em] text-blue-600">
            HOSPITAL MANAGEMENT SYSTEM
          </p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
            สร้างบัญชีใหม่
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            กรอกข้อมูลเพื่อเริ่มต้นใช้งานระบบ
          </p>
        </div>

        <div className="rounded-3xl border border-slate-200/80 bg-white p-6 shadow-[0_20px_60px_-25px_rgba(30,64,175,0.18)] sm:p-9">
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="name"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ชื่อ-นามสกุล
              </label>
              <input
                id="name"
                type="text"
                autoComplete="name"
                placeholder="กรอกชื่อ-นามสกุล"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                อีเมล
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                รหัสผ่าน
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="อย่างน้อย 8 ตัวอักษร"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                className={inputClass}
              />
              <p className="mt-2 text-xs text-slate-400">
                ใช้รหัสผ่านอย่างน้อย 8 ตัวอักษร
              </p>
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                ยืนยันรหัสผ่าน
              </label>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="กรอกรหัสผ่านอีกครั้ง"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />

              <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm text-slate-500">
                <input
                  type="checkbox"
                  checked={showPassword}
                  onChange={(e) => setShowPassword(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 accent-blue-600"
                />
                แสดงรหัสผ่าน
              </label>
            </div>

            {error && (
              <div
                role="alert"
                className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
              >
                {error}
              </div>
            )}

            {success && (
              <div
                role="status"
                className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700"
              >
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3.5 text-sm font-semibold text-white shadow-md shadow-blue-600/15 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  กำลังสมัครสมาชิก...
                </>
              ) : (
                "สร้างบัญชี"
              )}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-100" />
            <span className="text-xs text-slate-400">หรือ</span>
            <div className="h-px flex-1 bg-slate-100" />
          </div>

          <p className="text-center text-sm text-slate-500">
            มีบัญชีอยู่แล้ว?{" "}
            <Link
              href="/login"
              className="font-semibold text-blue-600 transition hover:text-blue-700 hover:underline"
            >
              เข้าสู่ระบบ
            </Link>
          </p>

          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            บัญชีใหม่จะได้รับสิทธิ์ผู้ใช้งานทั่วไป
          </p>
        </div>

        <p className="mt-6 text-center text-xs text-slate-400">
          ระบบจัดการคิวโรงพยาบาล · Secure access
        </p>
      </section>
    </main>
  );
}
