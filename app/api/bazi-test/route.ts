import { NextResponse } from "next/server";

import { testSwissConnection } from "@/lib/bazi/engine";

export const GET = async () => {
  const result = await testSwissConnection();
  return NextResponse.json(result);
};
