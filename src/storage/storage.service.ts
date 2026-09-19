import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { randomUUID } from 'crypto';

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly client: S3Client | null;
  private readonly bucket: string;
  private readonly publicBaseUrl: string;
  private readonly accountId: string;
  private readonly configured: boolean;

  constructor() {
    this.accountId = process.env.R2_ACCOUNT_ID || '';
    this.bucket = process.env.R2_BUCKET || '';
    this.publicBaseUrl = (process.env.R2_PUBLIC_BASE_URL || '').replace(
      /\/+$/,
      '',
    );

    const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

    this.configured = !!(
      this.accountId &&
      this.bucket &&
      accessKeyId &&
      secretAccessKey
    );

    if (!this.configured) {
      this.logger.warn(
        'R2 storage is not fully configured (R2_ACCOUNT_ID / R2_BUCKET / R2_ACCESS_KEY_ID / R2_SECRET_ACCESS_KEY). Uploads will fail.',
      );
      this.client = null;
      return;
    }

    this.client = new S3Client({
      region: 'auto',
      endpoint: `https://${this.accountId}.r2.cloudflarestorage.com`,
      credentials: { accessKeyId, secretAccessKey },
    });
  }

  private buildPublicUrl(key: string): string {
    if (this.publicBaseUrl) return `${this.publicBaseUrl}/${key}`;
    return `https://pub-${this.accountId}.r2.dev/${key}`;
  }

  private ensureReady() {
    if (!this.configured || !this.client) {
      throw new BadRequestException(
        'Storage no configurado. Define R2_ACCOUNT_ID, R2_BUCKET, R2_ACCESS_KEY_ID y R2_SECRET_ACCESS_KEY.',
      );
    }
  }

  async upload(
    folder: string,
    body: Buffer,
    contentType: string,
    originalName?: string,
  ): Promise<string> {
    this.ensureReady();

    const ext = originalName?.match(/\.[a-z0-9]+$/i)?.[0] || '';
    const key = `${folder.replace(/\/+$/, '')}/${randomUUID()}${ext}`;

    await this.client!.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: body,
        ContentType: contentType,
      }),
    );

    return this.buildPublicUrl(key);
  }

  async deleteByUrl(url: string): Promise<void> {
    if (!url) return;
    this.ensureReady();
    const key = new URL(url).pathname.replace(/^\/+/, '');
    if (!key) return;
    try {
      await this.client!.send(
        new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
      );
    } catch (err) {
      this.logger.warn(
        `No se pudo eliminar ${key} de R2: ${(err as Error).message}`,
      );
    }
  }
}
