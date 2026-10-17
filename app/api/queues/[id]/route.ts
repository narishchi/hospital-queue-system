
import { requireAdmin } from "@/app/lib/authorization";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import prisma from "@/app/lib/prisma";

type RouteContext = {
  params: Promise<{ id: string }>;
};

const updateQueueSchema = z
  .object({
    patientName: z.string().trim().min(1).max(100).optional(),
    departmentId: z.coerce.number().int().positive().optional(),
    status: z
      .enum([
        "WAITING",
        "CALLING",
        "SERVING",
        "COMPLETED",
        "CANCELLED",
        "SKIPPED",
      ])
      .optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "กรุณาระบุข้อมูลที่ต้องการแก้ไข",
  });

const departmentPrefixes: Record<string, string> = {
  ทันตกรรม: "D",
  อายุรกรรม: "M",
  จิตเวช: "PS",
  กุมารเวชกรรม: "PE",
};

async function getNextQueueNumber(
  departmentId: number,
  departmentName: string,
  excludeQueueId?: number,
) {
  const prefix = departmentPrefixes[departmentName];

  if (!prefix) {
    throw new Error(`ยังไม่ได้กำหนดตัวอักษรย่อให้แผนก "${departmentName}"`);
  }

  const now = new Date();
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);

  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const queues = await prisma.queue.findMany({
    where: {
      departmentId,
      queueDate: {
        gte: startOfDay,
        lte: endOfDay,
      },
      ...(excludeQueueId !== undefined
        ? { id: { not: excludeQueueId } }
        : {}),
    },
    select: {
      queueNumber: true,
    },
  });

  const maxNumber = queues.reduce((max, queue) => {
    const digits = queue.queueNumber.replace(/^[A-Za-z]+/, "");
    const number = Number(digits);

    if (!Number.isInteger(number) || number < 0) {
      return max;
    }

    return Math.max(max, number);
  }, 0);

  return `${prefix}${String(maxNumber + 1).padStart(3, "0")}`;
}

export async function PUT(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const access = await requireAdmin();

    if (access.response) {
      return access.response;
    }

    const { id } = await context.params;
    const queueId = Number(id);

    if (!Number.isInteger(queueId) || queueId <= 0) {
      return NextResponse.json(
        { message: "รหัสคิวไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const parsed = updateQueueSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          message: "ข้อมูลไม่ถูกต้อง",
          errors: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const existing = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "ไม่พบคิวผู้ป่วย" },
        { status: 404 },
      );
    }

    const data = parsed.data;
    let newQueueNumber: string | undefined;

    // สร้างเลขคิวใหม่เฉพาะเมื่อเปลี่ยนแผนกจริง
    if (
      data.departmentId !== undefined &&
      data.departmentId !== existing.departmentId
    ) {
      const department = await prisma.department.findUnique({
        where: { id: data.departmentId },
      });

      if (!department || !department.isActive) {
        return NextResponse.json(
          { message: "ไม่พบแผนกหรือแผนกปิดให้บริการ" },
          { status: 400 },
        );
      }

      try {
        newQueueNumber = await getNextQueueNumber(
          department.id,
          department.name,
          queueId,
        );
      } catch (error) {
        return NextResponse.json(
          {
            message:
              error instanceof Error
                ? error.message
                : "ไม่สามารถสร้างเลขคิวใหม่ได้",
          },
          { status: 400 },
        );
      }
    }

    const queue = await prisma.queue.update({
      where: { id: queueId },
      data: {
        ...(data.patientName !== undefined
          ? { patientName: data.patientName }
          : {}),
        ...(data.departmentId !== undefined
          ? { departmentId: data.departmentId }
          : {}),
        ...(data.status !== undefined ? { status: data.status } : {}),
        ...(newQueueNumber !== undefined
          ? { queueNumber: newQueueNumber }
          : {}),
      },
      include: {
        department: true,
      },
    });

    return NextResponse.json(queue);
  } catch (error) {
    console.error("PUT queue error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถแก้ไขคิวได้" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext,
) {
  try {
    const access = await requireAdmin();

    if (access.response) {
      return access.response;
    }

    const { id } = await context.params;
    const queueId = Number(id);

    if (!Number.isInteger(queueId) || queueId <= 0) {
      return NextResponse.json(
        { message: "รหัสคิวไม่ถูกต้อง" },
        { status: 400 },
      );
    }

    const existing = await prisma.queue.findUnique({
      where: { id: queueId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "ไม่พบคิวผู้ป่วย" },
        { status: 404 },
      );
    }

    await prisma.queue.delete({
      where: { id: queueId },
    });

    return NextResponse.json({
      message: "ลบคิวผู้ป่วยเรียบร้อยแล้ว",
    });
  } catch (error) {
    console.error("DELETE queue error:", error);

    return NextResponse.json(
      { message: "ไม่สามารถลบคิวได้" },
      { status: 500 },
    );
  }
}
