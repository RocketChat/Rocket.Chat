import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

// Either `msgId` with `roomId`, or `fileId` of an uploaded file.
export class DeleteMessageDto {
  @ValidateIf((dto: DeleteMessageDto) => dto.fileId === undefined)
  @IsString()
  msgId?: string;

  @ValidateIf((dto: DeleteMessageDto) => dto.fileId === undefined)
  @IsString()
  roomId?: string;

  @ValidateIf((dto: DeleteMessageDto) => dto.msgId === undefined)
  @IsString()
  fileId?: string;

  @IsOptional()
  @IsBoolean()
  asUser?: boolean;
}
