/**
 * File Storage Service
 * Supports local filesystem (dev) and S3-compatible (production)
 */

import { writeFile, mkdir, unlink, readFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import crypto from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), ".uploads");

// Storage provider configuration
const STORAGE_PROVIDER = process.env.STORAGE_PROVIDER || "local";
const S3_BUCKET = process.env.S3_BUCKET;
const S3_REGION = process.env.AWS_REGION || "us-east-1";
const S3_ENDPOINT = process.env.S3_ENDPOINT; // For R2, MinIO

export interface StoredFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  sha256: string;
  storedAt: string;
  url?: string;
}

/**
 * Ensure upload directory exists (local mode)
 */
async function ensureUploadDir() {
  if (!existsSync(UPLOAD_DIR)) {
    await mkdir(UPLOAD_DIR, { recursive: true });
  }
}

/**
 * Generate SHA256 hash of file content
 */
function hashBuffer(buffer: Buffer): string {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

/**
 * Store a file
 */
export async function storeFile(file: File): Promise<StoredFile> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const sha256 = hashBuffer(buffer);
  const id = crypto.randomUUID();
  const ext = path.extname(file.name) || "";
  const filename = `${id}${ext}`;

  if (STORAGE_PROVIDER === "s3" && S3_BUCKET) {
    return storeFileS3(buffer, filename, file.name, file.type, sha256);
  }

  return storeFileLocal(buffer, filename, file.name, file.type, sha256);
}

/**
 * Store file locally
 */
async function storeFileLocal(
  buffer: Buffer,
  filename: string,
  originalName: string,
  mimeType: string,
  sha256: string
): Promise<StoredFile> {
  await ensureUploadDir();
  const filepath = path.join(UPLOAD_DIR, filename);
  await writeFile(filepath, buffer);

  return {
    id: filename.split(".")[0],
    filename,
    originalName,
    mimeType: mimeType || "application/octet-stream",
    size: buffer.length,
    sha256,
    storedAt: new Date().toISOString(),
  };
}

/**
 * Store file in S3
 */
async function storeFileS3(
  buffer: Buffer,
  filename: string,
  originalName: string,
  mimeType: string,
  sha256: string
): Promise<StoredFile> {
  // Dynamic import to avoid bundling AWS SDK when not needed
  const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  });

  const key = `evidence/${filename}`;

  await client.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
      Body: buffer,
      ContentType: mimeType || "application/octet-stream",
      Metadata: {
        "original-name": encodeURIComponent(originalName),
        "sha256": sha256,
      },
    })
  );

  return {
    id: filename.split(".")[0],
    filename: key,
    originalName,
    mimeType: mimeType || "application/octet-stream",
    size: buffer.length,
    sha256,
    storedAt: new Date().toISOString(),
    url: S3_ENDPOINT
      ? `${S3_ENDPOINT}/${S3_BUCKET}/${key}`
      : `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`,
  };
}

/**
 * Delete a stored file
 */
export async function deleteFile(filename: string): Promise<void> {
  if (STORAGE_PROVIDER === "s3" && S3_BUCKET) {
    return deleteFileS3(filename);
  }
  return deleteFileLocal(filename);
}

async function deleteFileLocal(filename: string): Promise<void> {
  const filepath = path.join(UPLOAD_DIR, filename);
  if (existsSync(filepath)) {
    await unlink(filepath);
  }
}

async function deleteFileS3(key: string): Promise<void> {
  const { S3Client, DeleteObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  });

  await client.send(
    new DeleteObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    })
  );
}

/**
 * Get file content
 */
export async function getFile(filename: string): Promise<Buffer | null> {
  if (STORAGE_PROVIDER === "s3" && S3_BUCKET) {
    return getFileS3(filename);
  }
  return getFileLocal(filename);
}

async function getFileLocal(filename: string): Promise<Buffer | null> {
  const filepath = path.join(UPLOAD_DIR, filename);
  if (!existsSync(filepath)) {
    return null;
  }
  return readFile(filepath);
}

async function getFileS3(key: string): Promise<Buffer | null> {
  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");

  const client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  });

  try {
    const response = await client.send(
      new GetObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      })
    );

    const stream = response.Body;
    if (!stream) return null;

    // Convert stream to buffer
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Buffer>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  } catch {
    return null;
  }
}

/**
 * Get signed URL for file download (S3 mode)
 */
export async function getSignedUrl(key: string, expiresIn = 3600): Promise<string> {
  if (STORAGE_PROVIDER !== "s3" || !S3_BUCKET) {
    // Local mode - return API route
    return `/api/files/${encodeURIComponent(key)}`;
  }

  const { S3Client, GetObjectCommand } = await import("@aws-sdk/client-s3");
  const { getSignedUrl: s3GetSignedUrl } = await import("@aws-sdk/s3-request-presigner");

  const client = new S3Client({
    region: S3_REGION,
    ...(S3_ENDPOINT && { endpoint: S3_ENDPOINT }),
  });

  return s3GetSignedUrl(
    client,
    new GetObjectCommand({
      Bucket: S3_BUCKET,
      Key: key,
    }),
    { expiresIn }
  );
}

/**
 * Get file path for streaming (local mode only)
 */
export function getFilePath(filename: string): string {
  return path.join(UPLOAD_DIR, filename);
}

/**
 * Get current storage provider
 */
export function getStorageProvider(): string {
  return STORAGE_PROVIDER === "s3" && S3_BUCKET ? "S3" : "Local";
}
