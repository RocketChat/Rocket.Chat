import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller.js';
import { MessageNormalizerService } from './message-normalizer.service.js';
import { MessagePermissionsService } from './message-permissions.service.js';
import { MessagesService } from './messages.service.js';

@Module({
  controllers: [ChatController],
  providers: [
    MessagesService,
    MessagePermissionsService,
    MessageNormalizerService,
  ],
  exports: [MessageNormalizerService],
})
export class MessagesModule {}
