import { Body, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RestV1Controller } from '../common/rest-v1-controller.decorator.js';
import { DeleteMessageDto } from './dto/delete-message.dto.js';
import { GetMessageQuery } from './dto/get-message.query.js';
import { ReactToMessageDto } from './dto/react-to-message.dto.js';
import { SendMessageDto } from './dto/send-message.dto.js';
import { UpdateMessageDto } from './dto/update-message.dto.js';
import { MessagesService } from './messages.service.js';

@RestV1Controller()
export class ChatController {
  constructor(private readonly messagesService: MessagesService) {}

  @Get('chat.getMessage')
  getMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { msgId }: GetMessageQuery,
  ) {
    return this.messagesService.getMessage(user, msgId);
  }

  @Post('chat.sendMessage')
  @HttpCode(HttpStatus.OK)
  sendMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SendMessageDto,
  ) {
    return this.messagesService.sendMessage(user, dto);
  }

  @Post('chat.update')
  @HttpCode(HttpStatus.OK)
  updateMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateMessageDto,
  ) {
    return this.messagesService.updateMessage(user, dto);
  }

  @Post('chat.delete')
  @HttpCode(HttpStatus.OK)
  deleteMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: DeleteMessageDto,
  ) {
    return this.messagesService.deleteMessage(user, dto);
  }

  @Post('chat.react')
  @HttpCode(HttpStatus.OK)
  reactToMessage(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ReactToMessageDto,
  ) {
    return this.messagesService.reactToMessage(user, dto);
  }
}
