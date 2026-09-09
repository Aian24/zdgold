import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure public/uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    // Generate unique safe filename
    const originalExt = path.extname(file.name) || '.png';
    const cleanExt = originalExt.toLowerCase();
    const safeName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
    const filePath = path.join(uploadsDir, safeName);

    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/uploads/${safeName}`;

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: safeName,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload file' },
      { status: 500 }
    );
  }
}
