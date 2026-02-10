import { NextRequest, NextResponse } from 'next/server';
import { analyzeText } from '@/lib/analyzer';

export async function POST(request: NextRequest) {
  let payload: unknown;

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }

  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('text' in payload) ||
    typeof payload.text !== 'string'
  ) {
    return NextResponse.json({ error: 'Body must be JSON in the form: { "text": string }' }, { status: 400 });
  }

  const result = analyzeText(payload.text);

  return NextResponse.json(result, { status: 200 });
}
