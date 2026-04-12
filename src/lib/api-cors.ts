import { NextResponse } from "next/server";

const BASE = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

export function corsHeaders(methods: string): Record<string, string> {
  return {
    ...BASE,
    "Access-Control-Allow-Methods": methods,
  };
}

export function jsonWithCors(
  data: unknown,
  status: number,
  methods: string,
): NextResponse {
  return NextResponse.json(data, { status, headers: corsHeaders(methods) });
}

export function emptyWithCors(status: number, methods: string): NextResponse {
  return new NextResponse(null, { status, headers: corsHeaders(methods) });
}
