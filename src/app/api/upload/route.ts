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
    const mimeType = file.type || 'image/png';
    const base64Data = buffer.toString('base64');
    const dataUrl = `data:${mimeType};base64,${base64Data}`;

    // If running on Vercel (serverless cloud), immediately use persistent Base64 Data URL to avoid read-only filesystem errors
    let fileUrl = dataUrl;
    if (!process.env.VERCEL) {
      try {
        const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
        if (!fs.existsSync(uploadsDir)) {
          fs.mkdirSync(uploadsDir, { recursive: true });
        }

        const originalExt = path.extname(file.name) || '.png';
        const cleanExt = originalExt.toLowerCase();
        const safeName = `upload_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${cleanExt}`;
        const filePath = path.join(uploadsDir, safeName);

        fs.writeFileSync(filePath, buffer);
        fileUrl = dataUrl; 
      } catch (fsError) {
        // Fallback gracefully
        fileUrl = dataUrl;
      }
    }

    return NextResponse.json({
      success: true,
      url: fileUrl,
      fileName: file.name,
    });
  } catch (error: any) {
    console.error('File upload error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to process upload' },
      { status: 500 }
    );
  }
}
