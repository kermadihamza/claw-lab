import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const settings = await prisma.settings.findUnique({
    where: { id: "singleton" },
    select: { tarifsImage: true, tarifsImageMimeType: true },
  });

  if (!settings?.tarifsImage || !settings.tarifsImageMimeType) {
    return NextResponse.json({ error: "Aucune image" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(settings.tarifsImage), {
    headers: {
      "Content-Type": settings.tarifsImageMimeType,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
