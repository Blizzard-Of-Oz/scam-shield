import { NextResponse } from 'next/server';

export async function GET() {
  const missing: string[] = [];

  if (!process.env.STRIPE_PRICE_ID) {
    missing.push('STRIPE_PRICE_ID');
  }

  if (!process.env.STRIPE_SECRET_KEY) {
    missing.push('STRIPE_SECRET_KEY');
  }

  return NextResponse.json(
    {
      configured: missing.length === 0,
      missing,
    },
    { status: 200 },
  );
}
