
import { auth } from "@/app/auth";
import { NextResponse } from "next/server";

export async function requireLogin() {
  const session = await auth();

  if (!session?.user) {
    return {
      session: null,
      response: NextResponse.json(
        { message: "กรุณาเข้าสู่ระบบก่อนใช้งาน" },
        { status: 401 },
      ),
    };
  }

  return {
    session,
    response: null,
  };
}

export async function requireAdmin() {
  const result = await requireLogin();

  if (result.response) {
    return result;
  }

  if (result.session?.user?.role !== "ADMIN") {
    return {
      session: result.session,
      response: NextResponse.json(
        { message: "คุณไม่มีสิทธิ์ดำเนินการนี้" },
        { status: 403 },
      ),
    };
  }

  return result;
}

