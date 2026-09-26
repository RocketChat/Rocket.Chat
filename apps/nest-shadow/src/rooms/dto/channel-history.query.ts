import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';

const booleanStrings = ['true', 'false'] as const;
type BooleanString = (typeof booleanStrings)[number];

export class ChannelHistoryQuery {
  @ValidateIf((query: ChannelHistoryQuery) => query.roomName === undefined)
  @IsString()
  @MinLength(1)
  roomId?: string;

  @ValidateIf((query: ChannelHistoryQuery) => query.roomId === undefined)
  @IsString()
  @MinLength(1)
  roomName?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  latest?: string;

  @IsOptional()
  @IsString()
  @MinLength(1)
  oldest?: string;

  @IsOptional()
  @IsIn(booleanStrings)
  inclusive?: BooleanString;

  @IsOptional()
  @IsIn(booleanStrings)
  unreads?: BooleanString;

  @IsOptional()
  @IsIn(booleanStrings)
  showThreadMessages?: BooleanString;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  count?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  offset?: number;

  @IsOptional()
  @IsString()
  sort?: string;
}
