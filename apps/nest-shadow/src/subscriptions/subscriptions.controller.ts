import { Body, Get, HttpCode, HttpStatus, Post, Query } from '@nestjs/common';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { RestV1Controller } from '../common/rest-v1-controller.decorator.js';
import { UpdatedSinceQuery } from '../common/updated-since.js';
import { ReadSubscriptionDto } from './dto/read-subscription.dto.js';
import { SubscriptionsService } from './subscriptions.service.js';

@RestV1Controller()
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('subscriptions.get')
  listSubscriptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() { updatedSince }: UpdatedSinceQuery,
  ) {
    return this.subscriptionsService.listSubscriptions(user._id, updatedSince);
  }

  @Post('subscriptions.read')
  @HttpCode(HttpStatus.OK)
  markAsRead(
    @CurrentUser() user: AuthenticatedUser,
    @Body() { rid, roomId, readThreads }: ReadSubscriptionDto,
  ) {
    return this.subscriptionsService.markAsRead(
      user._id,
      (rid ?? roomId) as string,
      readThreads,
    );
  }
}
