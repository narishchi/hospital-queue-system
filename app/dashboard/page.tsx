
import { auth } from "@/app/auth";
import prisma from "@/app/lib/prisma";
import { redirect } from "next/navigation";
import LogoutButton from "@/app/components/LogoutButton";

export const dynamic = "force-dynamic";

const statusLabels: Record<string, string> = {
  WAITING: "รอเรียกคิว",
  CALLING: "กำลังเรียก",
  SERVING: "กำลังรับบริการ",
  COMPLETED: "เสร็จสิ้น",
  CANCELLED: "ยกเลิก",
  SKIPPED: "ข้ามคิว",
};

const statusStyles: Record<string, string> = {
  WAITING: "bg-amber-50 text-amber-700",
  CALLING: "bg-blue-50 text-blue-700",
  SERVING: "bg-indigo-50 text-indigo-700",
  COMPLETED: "bg-emerald-50 text-emerald-700",
  CANCELLED: "bg-red-50 text-red-700",
  SKIPPED: "bg-gray-100 text-gray-600",
};

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const isAdmin = session.user.role === "ADMIN";

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const startOfTomorrow = new Date(startOfDay);
  startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);

  const todayFilter = {
    queueDate: {
      gte: startOfDay,
      lt: startOfTomorrow,
    },
  };

  const [queues, departments] = await Promise.all([
    prisma.queue.findMany({
      where: todayFilter,
      include: { department: true },
      orderBy: { createdAt: "desc" },
    }),
    prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const total = queues.length;
  const waiting = queues.filter(
    (q) => q.status === "WAITING",
  ).length;
  const calling = queues.filter(
    (q) => q.status === "CALLING",
  ).length;
  const serving = queues.filter(
    (q) => q.status === "SERVING",
  ).length;
  const completed = queues.filter(
    (q) => q.status === "COMPLETED",
  ).length;

  const summary = [
    {
      label: "คิวทั้งหมดวันนี้",
      value: total,
      color: "border-sky-500",
      icon: "▤",
    },
    {
      label: "รอเรียกคิว",
      value: waiting,
      color: "border-amber-500",
      icon: "◷",
    },
    {
      label: "กำลังให้บริการ",
      value: calling + serving,
      color: "border-indigo-500",
      icon: "♧",
    },
    {
      label: "เสร็จสิ้น",
      value: completed,
      color: "border-emerald-500",
      icon: "✓",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto max-w-7xl space-y-8">
        
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-sky-700">
            Hospital Management System
          </p>
          <h1 className="mt-2 text-3xl font-bold text-slate-800">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            ระบบจัดการโรงพยาบาล
          </p>
          <p className="mt-2 text-sm font-medium text-slate-600">
            สิทธิ์ผู้ใช้งาน:{" "}
            {isAdmin ? "ผู้ดูแลระบบ (ADMIN)" : "ผู้ใช้งาน (USER)"}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          <LogoutButton />

          <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 shadow-sm">
            <p className="text-xs text-slate-500">วันที่</p>
            <p className="mt-1 font-semibold text-slate-800">
              {now.toLocaleDateString("th-TH", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>


        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {summary.map((item) => (
            <div
              key={item.label}
              className={`rounded-2xl border border-slate-200 border-l-4 ${item.color} bg-white p-6 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-slate-500">
                  {item.label}
                </p>
                <span className="text-2xl text-slate-400">
                  {item.icon}
                </span>
              </div>
              <p className="mt-4 text-4xl font-bold text-slate-800">
                {item.value}
              </p>
              <p className="mt-2 text-xs text-slate-400">
                รายการของวันนี้
              </p>
            </div>
          ))}
        </section>

        <section className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-800">
                  คิวล่าสุด
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  รายการคิวที่สร้างล่าสุดของวันนี้
                </p>
              </div>

              {isAdmin && (
                <a
                  href="/queues"
                  className="inline-flex items-center justify-center rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700"
                >
                  จัดการคิว
                </a>
              )}
            </div>

            {queues.length === 0 ? (
              <div className="rounded-xl bg-slate-50 p-8 text-center text-sm text-slate-500">
                ยังไม่มีคิวผู้ป่วยในวันนี้
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-500">
                      <th className="px-3 py-3 font-medium">เลขคิว</th>
                      <th className="px-3 py-3 font-medium">ชื่อผู้ป่วย</th>
                      <th className="px-3 py-3 font-medium">แผนก</th>
                      <th className="px-3 py-3 font-medium">สถานะ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {queues.slice(0, 8).map((queue) => (
                      <tr
                        key={queue.id}
                        className="border-b border-slate-50 last:border-0 hover:bg-slate-50"
                      >
                        <td className="whitespace-nowrap px-3 py-4 font-bold text-sky-700">
                          {queue.queueNumber}
                        </td>
                        <td className="px-3 py-4 text-slate-700">
                          {queue.patientName}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4 text-slate-600">
                          {queue.department.name}
                        </td>
                        <td className="whitespace-nowrap px-3 py-4">
                          <span
                            className={`rounded-full px-3 py-1 text-xs font-semibold ${
                              statusStyles[queue.status] ??
                              "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {statusLabels[queue.status] ??
                              queue.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800">
              สรุปตามแผนก
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              จำนวนคิวของวันนี้
            </p>

            <div className="mt-5 space-y-3">
              {departments.map((department) => {
                const count = queues.filter(
                  (q) => q.departmentId === department.id,
                ).length;

                return (
                  <div
                    key={department.id}
                    className="flex items-center justify-between rounded-xl bg-slate-50 p-4"
                  >
                    <div>
                      <p className="font-semibold text-slate-700">
                        {department.name}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {count} คิว
                      </p>
                    </div>
                    <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 font-bold text-sky-700">
                      {count}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <footer className="text-center text-xs text-slate-400">
          Hospital Queue System · Dashboard
        </footer>
      </div>
    </main>
  );
}
