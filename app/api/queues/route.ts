
import { requireAdmin, requireLogin } from "@/app/lib/authorization";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";

const createQueueSchema = z.object({
  patientName: z.string().min(1, "กรุณากรอกชื่อผู้ป่วย"),
  departmentId: z.number().int().positive(),
});

export async function GET(request: NextRequest) {
  try {
    await requireLogin();

    const { searchParams } = new URL(request.url);

    const search = searchParams.get("search") ?? "";
    const status = searchParams.get("status");
    const departmentId = searchParams.get("departmentId");

    const queues = await prisma.queue.findMany({
      where: {
        ...(search
          ? {
              OR: [
                {
                  patientName: {
                    contains: search,
                  },
                },
                {
                  queueNumber: {
                    contains: search,
                  },
                },
              ],
            }
          : {}),
        ...(status ? { status: status as never } : {}),
        ...(departmentId
          ? { departmentId: Number(departmentId) }
          : {}),
      },
      include: {
        department: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(queues);
  } catch (error) {
    console.error("GET queues error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลคิวได้" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const parsed = createQueueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const { patientName, departmentId } = parsed.data;

    const department = await prisma.department.findUnique({
      where: {
        id: departmentId,
      },
    });

    if (!department || !department.isActive) {
      return NextResponse.json(
        { message: "ไม่พบแผนกหรือแผนกถูกปิดใช้งาน" },
        { status: 400 },
      );
    }

    // กำหนดตัวอักษรย่อตามชื่อแผนก
    const departmentPrefixes: Record<string, string> = {
      ทันตกรรม: "D",
      อายุรกรรม: "M",
      จิตเวช: "PS",
      กุมารเวชกรรม: "PE",
    };

    const prefix = departmentPrefixes[department.name];

    if (!prefix) {
      return NextResponse.json(
        {
          message:
            `ยังไม่ได้กำหนดตัวอักษรย่อให้แผนก "${department.name}"`,
        },
        { status: 400 },
      );
    }

    // กำหนดช่วงเวลาของวันนี้
    const now = new Date();

    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // ดึงเลขคิวทั้งหมดของแผนกนี้ในวันนี้
    const existingQueues = await prisma.queue.findMany({
      where: {
        departmentId: department.id,
        queueDate: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        queueNumber: true,
      },
    });

    // หาเลขมากที่สุด รองรับทั้งเลขเก่า เช่น 001
    // และเลขใหม่ เช่น D001
    const maxNumber = existingQueues.reduce((max, queue) => {
      const number = queue.queueNumber.replace(/^[A-Za-z]+/, "");
      const parsedNumber = Number(number);

      if (!Number.isInteger(parsedNumber) || parsedNumber < 0) {
        return max;
      }

      return Math.max(max, parsedNumber);
    }, 0);

    const nextNumber = maxNumber + 1;

    const queue = await prisma.queue.create({
      data: {
        patientName,
        departmentId: department.id,
        queueNumber: `${prefix}${String(nextNumber).padStart(3, "0")}`,
        status: "WAITING",
        queueDate: now,
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(queue, { status: 201 });
  } catch (error) {
    console.error("POST queues error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถสร้างคิวได้" },
      { status: 500 },
    );
  }
}