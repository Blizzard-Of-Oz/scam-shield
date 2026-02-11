import { NextRequest, NextResponse } from 'next/server';
import { getRecentReports } from '@/lib/db';

export async function GET(request: NextRequest) {
  const rawLimit = request.nextUrl.searchParams.get('limit');
  const parsedLimit = rawLimit ? Number.parseInt(rawLimit, 10) : 20;
  const limit = Number.isNaN(parsedLimit) ? 20 : parsedLimit;

  const reports = getRecentReports(limit).map((report) => ({
    id: report.id,
    createdAt: report.createdAt,
    verdict: report.verdict,
    score: report.score,
    scamType: report.scamType,
    note: report.note,
    urls: report.urls,
  }));

  return NextResponse.json({ reports }, { status: 200 });
}
