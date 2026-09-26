import { IsBoolean, IsOptional, IsString, ValidateIf } from 'class-validator';

// The room arrives as `rid`, or as `roomId`.
export class ReadSubscriptionDto {
  @ValidateIf((dto: ReadSubscriptionDto) => dto.roomId === undefined)
  @IsString()
  rid?: string;

  @ValidateIf((dto: ReadSubscriptionDto) => dto.rid === undefined)
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsBoolean()
  readThreads?: boolean;
}
