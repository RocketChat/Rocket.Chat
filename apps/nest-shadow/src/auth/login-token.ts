import { createHash } from 'node:crypto';

export const hashLoginToken = (loginToken: string): string =>
  createHash('sha256').update(loginToken).digest('base64');
