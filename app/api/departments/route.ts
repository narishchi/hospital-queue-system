
import { requireLogin } from "@/app/lib/authorization";
import { NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

export async function GET() {
  try {
 const access = await requireLogin();

    if (access.response) {
      return access.response;
    }
    const departments = await prisma.department.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    return NextResponse.json(departments);
  } catch (error) {
    console.error("GET departments error:", error);
    return NextResponse.json(
      { message: "ไม่สามารถดึงข้อมูลแผนกได้" },
      { status: 500 },
    );
  }
}
