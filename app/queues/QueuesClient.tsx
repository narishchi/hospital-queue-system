"use client";
import LogoutButton from "@/app/components/LogoutButton";
import { useCallback, useEffect, useState } from "react";

type Department = {
  id: number;
  name: string;
  code: string;
};

type Queue = {
  id: number;
  queueNumber: string;
  patientName: string;
  departmentId: number;
  department: Department;
  status:
    | "WAITING"
    | "CALLING"
    | "SERVING"
    | "COMPLETED"
    | "CANCELLED"
    | "SKIPPED";
  queueDate: string;
};

type QueuesClientProps = {
  role: "ADMIN" | "USER";
};

const statuses: { value: Queue["status"]; label: string }[] = [
  { value: "WAITING", label: "รอเรียก" },
  { value: "CALLING", label: "กำลังเรียก" },
  { value: "SERVING", label: "กำลังรับบริการ" },
  { value: "COMPLETED", label: "เสร็จสิ้น" },
  { value: "CANCELLED", label: "ยกเลิก" },
  { value: "SKIPPED", label: "ข้ามคิว" },
];

export default function QueuesClient({ role }: QueuesClientProps) {
  const isAdmin = role === "ADMIN";

  const [queues, setQueues] = useState<Queue[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [patientName, setPatientName] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [search, setSearch] = useState("");
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editingQueueId, setEditingQueueId] = useState<number | null>(null);
  const [editPatientName, setEditPatientName] = useState("");
  const [editDepartmentId, setEditDepartmentId] = useState("");

  const loadData = useCallback(async () => {
    setLoading(true);

    try {
      const [queueResponse, departmentResponse] = await Promise.all([
        fetch("/api/queues"),
        fetch("/api/departments"),
      ]);

      if (queueResponse.status === 401 || departmentResponse.status === 401) {
        window.location.href = "/login";
        return;
      }

      if (!queueResponse.ok || !departmentResponse.ok) {
        throw new Error("โหลดข้อมูลไม่สำเร็จ");
      }

      const queueData: Queue[] = await queueResponse.json();
      const departmentData: Department[] = await departmentResponse.json();

      setQueues(queueData);
      setDepartments(departmentData);
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "ไม่สามารถโหลดข้อมูลได้",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  async function createQueue(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    if (!isAdmin) {
      setMessage("คุณไม่มีสิทธิ์เพิ่มคิว");
      return;
    }

    if (!patientName.trim() || !departmentId) {
      setMessage("กรุณากรอกชื่อผู้ป่วยและเลือกแผนก");
      return;
    }

    setSaving(true);

    try {
      const response = await fetch("/api/queues", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patientName: patientName.trim(),
          departmentId: Number(departmentId),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "เพิ่มคิวไม่สำเร็จ");
      }

      setPatientName("");
      setDepartmentId("");
      setMessage(`เพิ่มคิว ${data.queueNumber} สำเร็จ`);
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      );
    } finally {
      setSaving(false);
    }
  }
    async function saveQueueEdit(queueId: number) {
      const patientName = editPatientName.trim();
      const departmentId = Number(editDepartmentId);

      if (!patientName || !departmentId) {
        alert("กรุณากรอกชื่อผู้ป่วยและเลือกแผนก");
        return;
      }

      try {
        const response = await fetch(`/api/queues/${queueId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            patientName,
            departmentId,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          alert(result.message ?? "แก้ไขข้อมูลไม่สำเร็จ");
          return;
        }

        setEditingQueueId(null);
        setMessage("แก้ไขข้อมูลคิวสำเร็จ");
        await loadData();
      } catch {
        alert("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      }
    }
  async function updateStatus(id: number, status: Queue["status"]) {
    if (!isAdmin) return;

    setMessage("");

    try {
      const response = await fetch(`/api/queues/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "แก้ไขสถานะไม่สำเร็จ");
      }

      setMessage("อัปเดตสถานะคิวเรียบร้อยแล้ว");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      );
    }
  }

  async function deleteQueue(id: number, queueNumber: string) {
    if (!isAdmin) return;

    const confirmed = window.confirm(
      `ต้องการลบคิว ${queueNumber} ใช่หรือไม่?`,
    );

    if (!confirmed) return;

    setMessage("");

    try {
      const response = await fetch(`/api/queues/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "ลบคิวไม่สำเร็จ");
      }

      setMessage("ลบคิวเรียบร้อยแล้ว");
      await loadData();
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "เกิดข้อผิดพลาด",
      );
    }
  }

  const filteredQueues = queues.filter((queue) => {
    const searchText = search.toLowerCase();

    const matchesSearch =
      queue.patientName.toLowerCase().includes(searchText) ||
      queue.queueNumber.toLowerCase().includes(searchText);

    const matchesDepartment =
      !filterDepartment ||
      String(queue.departmentId) === filterDepartment;

    const matchesStatus =
      !filterStatus || queue.status === filterStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const statusLabel = (status: Queue["status"]) =>
    statuses.find((item) => item.value === status)?.label ?? status;

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 text-slate-800 sm:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        
      <header className="rounded-2xl bg-gradient-to-r from-blue-900 to-cyan-700 p-6 text-white shadow-lg sm:p-8">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-medium text-blue-100">
              HOSPITAL MANAGEMENT SYSTEM
            </p>

            <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
              ระบบจัดการคิวผู้ป่วย
            </h1>

            <p className="mt-2 text-blue-100">
              จัดการคิวและติดตามสถานะผู้ป่วยแยกตามแผนก
            </p>

            <p className="mt-3 text-sm text-blue-100">
              สิทธิ์ผู้ใช้งาน:{" "}
              {isAdmin ? "ผู้ดูแลระบบ (ADMIN)" : "ผู้ใช้งาน (USER)"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <a
              href="/dashboard"
              className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
            >
              กลับหน้า Dashboard
            </a>

            <LogoutButton />
          </div>
        </div>
      </header>


        {message && (
          <div
            role="status"
            className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-blue-800"
          >
            {message}
          </div>
        )}

        {isAdmin && (
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
            <h2 className="text-xl font-bold">ลงทะเบียนคิวใหม่</h2>

            <form
              onSubmit={createQueue}
              className="mt-4 grid gap-4 sm:grid-cols-[1fr_1fr_auto]"
            >
              <div>
                <label
                  htmlFor="patientName"
                  className="mb-2 block text-sm font-medium"
                >
                  ชื่อผู้ป่วย
                </label>
                <input
                  id="patientName"
                  value={patientName}
                  onChange={(event) => setPatientName(event.target.value)}
                  maxLength={100}
                  required
                  placeholder="กรอกชื่อผู้ป่วย"
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                />
              </div>

              <div>
                <label
                  htmlFor="departmentId"
                  className="mb-2 block text-sm font-medium"
                >
                  แผนก
                </label>
                <select
                  id="departmentId"
                  value={departmentId}
                  onChange={(event) => setDepartmentId(event.target.value)}
                  required
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 outline-none focus:border-blue-600"
                >
                  <option value="">เลือกแผนก</option>
                  {departments.map((department) => (
                    <option key={department.id} value={department.id}>
                      {department.name} ({department.code})
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="self-end rounded-xl bg-blue-700 px-6 py-3 font-semibold text-white transition hover:bg-blue-800 disabled:opacity-50"
              >
                {saving ? "กำลังบันทึก..." : "+ เพิ่มคิว"}
              </button>
            </form>
          </section>
        )}

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">คิวทั้งหมด</p>
            <p className="mt-2 text-3xl font-bold">{queues.length}</p>
          </div>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
            <p className="text-sm text-amber-800">รอเรียก</p>
            <p className="mt-2 text-3xl font-bold text-amber-900">
              {queues.filter((queue) => queue.status === "WAITING").length}
            </p>
          </div>
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm text-emerald-800">เสร็จสิ้น</p>
            <p className="mt-2 text-3xl font-bold text-emerald-900">
              {queues.filter((queue) => queue.status === "COMPLETED").length}
            </p>
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
          <h2 className="text-xl font-bold">รายการคิวผู้ป่วย</h2>

          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="ค้นหาชื่อหรือหมายเลขคิว..."
              className="rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-blue-600"
            />

            <select
              value={filterDepartment}
              onChange={(event) => setFilterDepartment(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">ทุกแผนก</option>
              {departments.map((department) => (
                <option key={department.id} value={department.id}>
                  {department.name}
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(event) => setFilterStatus(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3"
            >
              <option value="">ทุกสถานะ</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p className="py-10 text-center text-slate-500">
              กำลังโหลดข้อมูล...
            </p>
          ) : filteredQueues.length === 0 ? (
            <p className="py-10 text-center text-slate-500">
              ไม่พบรายการคิวผู้ป่วย
            </p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[750px] text-left text-sm">
                <thead className="bg-slate-100 text-slate-600">
                  <tr>
                    <th className="rounded-l-lg px-4 py-3">หมายเลขคิว</th>
                    <th className="px-4 py-3">ชื่อผู้ป่วย</th>
                    <th className="px-4 py-3">แผนก</th>
                    <th className="px-4 py-3">สถานะ</th>
                    {isAdmin && (
                      <>
                        <th className="px-4 py-3">เปลี่ยนสถานะ</th>
                        <th className="rounded-r-lg px-4 py-3">จัดการ</th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredQueues.map((queue) => (
                    <tr key={queue.id} className="border-b border-slate-100">
                      <td className="px-4 py-4 font-bold text-blue-800">
                        {queue.queueNumber}
                      </td>
                      <td className="px-4 py-4">
                        {editingQueueId === queue.id ? (
                          <input
                            value={editPatientName}
                            onChange={(event) => setEditPatientName(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 px-3 py-2"
                            aria-label="ชื่อผู้ป่วย"
                          />
                        ) : (
                          queue.patientName
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {editingQueueId === queue.id ? (
                          <select
                            value={editDepartmentId}
                            onChange={(event) => setEditDepartmentId(event.target.value)}
                            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2"
                            aria-label="แผนก"
                          >
                            {departments.map((department) => (
                              <option key={department.id} value={department.id}>
                                {department.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          queue.department.name
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium">
                          {statusLabel(queue.status)}
                        </span>
                      </td>

                      {isAdmin && (
                        <>
                          <td className="px-4 py-4">
                            <select
                              aria-label={`เปลี่ยนสถานะคิว ${queue.queueNumber}`}
                              value={queue.status}
                              onChange={(event) =>
                                updateStatus(
                                  queue.id,
                                  event.target.value as Queue["status"],
                                )
                              }
                              className="rounded-lg border border-slate-300 bg-white px-2 py-2"
                            >
                              {statuses.map((status) => (
                                <option
                                  key={status.value}
                                  value={status.value}
                                >
                                  {status.label}
                                </option>
                              ))}
                            </select>
                          </td> 
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              {editingQueueId === queue.id ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => saveQueueEdit(queue.id)}
                                    className="rounded-lg bg-blue-600 px-3 py-2 text-white hover:bg-blue-700"
                                  >
                                    บันทึก
                                  </button>

                                  <button
                                    type="button"
                                    onClick={() => setEditingQueueId(null)}
                                    className="rounded-lg border border-slate-300 px-3 py-2 hover:bg-slate-50"
                                  >
                                    ยกเลิก
                                  </button>
                                </>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingQueueId(queue.id);
                                    setEditPatientName(queue.patientName);
                                    setEditDepartmentId(String(queue.departmentId));
                                  }}
                                  className="rounded-lg border border-amber-200 px-3 py-2 text-amber-700 hover:bg-amber-50"
                                >
                                  แก้ไข
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => deleteQueue(queue.id, queue.queueNumber)}
                                className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                              >
                                ลบ
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}