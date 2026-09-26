import { Get, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RestV1Controller } from '../common/rest-v1-controller.decorator.js';
import { ChannelHistoryService } from './channel-history.service.js';
import { ChannelHistoryQuery } from './dto/channel-history.query.js';
import { RoomInfoQuery } from './dto/room-info.query.js';
import { RoomsGetQuery } from './dto/rooms-get.query.js';
import { RoomsService } from './rooms.service.js';

@RestV1Controller()
export class RoomsController {
  constructor(
    private readonly roomsService: RoomsService,
    private readonly channelHistoryService: ChannelHistoryService,
  ) {}

  @Get('rooms.get')
  listRooms(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { updatedSince }: RoomsGetQuery,
  ) {
    return this.roomsService.listRooms(user._id, updatedSince);
  }

  @Get('rooms.info')
  getRoomInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: RoomInfoQuery,
  ) {
    return this.roomsService.getRoomInfo(user._id, query);
  }

  @Get('channels.history')
  getChannelHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ChannelHistoryQuery,
  ) {
    return this.channelHistoryService.getHistory(user._id, query);
  }
}
