import { IsArray, IsObject, IsOptional, IsString } from 'class-validator';

export class UpdateMessageDto {
  @IsString()
  roomId: string;

  @IsString()
  msgId: string;

  @IsString()
  text: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  previewUrls?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
