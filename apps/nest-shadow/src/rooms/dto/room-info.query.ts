import { IsOptional, IsString } from 'class-validator';
import { AcceptsUnknownParams } from '../../common/rest-v1-validation.pipe.js';

@AcceptsUnknownParams()
export class RoomInfoQuery {
  @IsOptional()
  @IsString()
  roomId?: string;

  @IsOptional()
  @IsString()
  roomName?: string;
}
