import { NextRequest, NextResponse } from 'next/server';
import { checkRouterHealth } from '@/lib/routerClient';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const baseUrl = searchParams.get('baseUrl') || undefined;
    const apiKey = searchParams.get('apiKey') || undefined;

    const result = await checkRouterHealth(baseUrl, apiKey, 6000);

    return NextResponse.json(result, {
      status: result.ok ? 200 : 200, // keep 200 with ok: false so frontend can read error details cleanly
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json(
      {
        ok: false,
        status: 'offline',
        error: message,
      },
      { status: 200 }
    );
  }
}
