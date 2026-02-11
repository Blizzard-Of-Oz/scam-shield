import { NextRequest, NextResponse } from 'next/server';
import { insertReport } from '@/lib/db';
import { validateReportInput } from '@/lib/reporting';

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  try {
    const validInput = validateReportInput(payload);
    const id = insertReport(validInput);

    return NextResponse.json({ ok: true, id }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid request body.';

    return NextResponse.json({ error: message }, { status: 400 });
  }
}
