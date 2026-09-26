import type { IMessage } from '@rocket.chat/core-typings';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDefined,
  IsIn,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class OutgoingMessageDto {
  @IsOptional()
  @IsString()
  _id?: string;

  @IsOptional()
  @IsString()
  rid?: string;

  @IsOptional()
  @IsString()
  tmid?: string;

  @IsOptional()
  @IsString()
  msg?: string;

  @IsOptional()
  @IsString()
  alias?: string;

  @IsOptional()
  @IsString()
  emoji?: string;

  @IsOptional()
  @IsBoolean()
  tshow?: boolean;

  @IsOptional()
  @IsString()
  avatar?: string;

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  attachments?: IMessage['attachments'];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  blocks?: IMessage['blocks'];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;

  @IsOptional()
  @IsIn(['e2e'])
  t?: 'e2e';

  @IsOptional()
  @IsObject()
  content?: IMessage['content'];

  @IsOptional()
  @IsObject()
  e2eMentions?: IMessage['e2eMentions'];
}

export class SendMessageDto {
  @IsDefined()
  @IsObject()
  @ValidateNested()
  @Type(() => OutgoingMessageDto)
  message: OutgoingMessageDto;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previewUrls?: string[];
}
