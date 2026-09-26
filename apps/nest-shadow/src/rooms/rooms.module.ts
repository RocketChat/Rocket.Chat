import { Module } from '@nestjs/common';
import { PaginationService } from '../common/pagination.service.js';
import { MessagesModule } from '../messages/messages.module.js';
import { ChannelHistoryService } from './channel-history.service.js';
import { RoomsController } from './rooms.controller.js';
import { RoomsService } from './rooms.service.js';

@Module({
  imports: [MessagesModule],
  controllers: [RoomsController],
  providers: [RoomsService, ChannelHistoryService, PaginationService],
})
export class RoomsModule {}
