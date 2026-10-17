import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";

import prisma from "@/app/lib/prisma";

export async function POST(request: Request) {
  try {
    const { name, email, password } = await request.json();

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 },
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร" },
        { status: 400 },
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: {
        email,
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "อีเมลนี้ถูกใช้งานแล้ว" },
        { status: 400 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);

    await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: "USER",
      },
    });

    return NextResponse.json(
      { message: "สมัครสมาชิกสำเร็จ" },
      { status: 201 },
    );
  } catch {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสมัครสมาชิก" },
      { status: 500 },
    );
  }
}