import {
  IsBoolean,
  IsOptional,
  IsString,
  MinLength,
  ValidateIf,
} from 'class-validator';

// The emoji arrives as `emoji`, or as `reaction` from older clients.
export class ReactToMessageDto {
  @IsString()
  @MinLength(1)
  messageId: string;

  @ValidateIf((dto: ReactToMessageDto) => dto.reaction === undefined)
  @IsString()
  emoji?: string;

  @ValidateIf((dto: ReactToMessageDto) => dto.emoji === undefined)
  @IsString()
  reaction?: string;

  @IsOptional()
  @IsBoolean()
  shouldReact?: boolean;
}
