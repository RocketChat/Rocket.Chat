import { IsString, MinLength } from 'class-validator';

export class GetMessageQuery {
  @IsString()
  @MinLength(1)
  msgId: string;
}
