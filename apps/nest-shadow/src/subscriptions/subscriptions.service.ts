import { Injectable } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import type { ISubscription } from '@rocket.chat/core-typings';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { parseUpdatedSince } from '../common/updated-since.js';
import { InjectModel, type Models } from '../database/models.js';
import { subscriptionFields } from './subscription-fields.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    @InjectCoreService('Room')
    private readonly roomService: CoreServices['Room'],
    @InjectModel('Rooms') private readonly rooms: Models['Rooms'],
    @InjectModel('Subscriptions')
    private readonly subscriptions: Models['Subscriptions'],
  ) {}

  async listSubscriptions(
    uid: string,
    updatedSince?: string,
  ): Promise<{
    update: ISubscription[];
    remove: { _id: string; _deletedAt: Date }[];
  }> {
    const since = parseUpdatedSince(
      updatedSince,
      new MeteorError(
        'error-roomId-param-invalid',
        'The "lastUpdate" query parameter must be a valid date.',
      ),
    );

    const records = await this.subscriptions
      .findByUserId(uid, { projection: subscriptionFields })
      .toArray();

    if (!since) {
      return { update: records, remove: [] };
    }

    const removed = await this.subscriptions
      .trashFindDeletedAfter(
        since,
        { 'u._id': uid },
        { projection: { _id: 1, _deletedAt: 1 } },
      )
      .toArray();

    return {
      update: records.filter((record) => record._updatedAt > since),
      remove: removed,
    };
  }

  async markAsRead(
    uid: string,
    rid: string,
    readThreads = false,
  ): Promise<void> {
    const room = await this.rooms.findOneById(rid);
    if (!room) {
      throw new Error('error-invalid-subscription');
    }

    await this.roomService.markAsRead(room, uid, readThreads);
  }
}
