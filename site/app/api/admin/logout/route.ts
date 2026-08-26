import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { logout, COOKIE_NAME } from "@/lib/admin";

export async function POST() {
  const jar = await cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  if (token) await logout(token);

  const res = NextResponse.json({ status: "ok" });
  res.cookies.delete(COOKIE_NAME);
  return res;
}
