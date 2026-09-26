import type { MeteorError } from '@rocket.chat/core-services';
import { IsOptional, IsString } from 'class-validator';

export class UpdatedSinceQuery {
  @IsOptional()
  @IsString()
  updatedSince?: string;
}

export function parseUpdatedSince(
  updatedSince: string | undefined,
  invalidDateError: MeteorError,
): Date | undefined {
  if (!updatedSince) {
    return undefined;
  }

  if (Number.isNaN(Date.parse(updatedSince))) {
    throw invalidDateError;
  }

  return new Date(updatedSince);
}
