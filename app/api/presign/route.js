import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REGION = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME || "uploader-briefly";

const s3Client = new S3Client({ region: REGION });

function safeFileName(fileName) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { fileName, fileType } = body || {};

    if (!fileName || !fileType) {
      return Response.json(
        { error: "fileName and fileType are required" },
        { status: 400 }
      );
    }

    const key = `uploads/${Date.now()}-${safeFileName(fileName)}`;
    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: fileType,
    });

    const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 300 });

    return Response.json({
      uploadUrl,
      key,
      bucket: BUCKET_NAME,
      region: REGION,
    });
  } catch (error) {
    console.error("Failed to generate pre-signed URL:", error);
    return Response.json(
      { error: "Unable to generate upload URL" },
      { status: 500 }
    );
  }
}
