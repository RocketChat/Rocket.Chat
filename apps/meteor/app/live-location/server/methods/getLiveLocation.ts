import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

Meteor.methods({
  /**
   * Get live location data for a message
   */
  async 'liveLocation.get'(rid: string, msgId: string) {
    check(rid, String);
    check(msgId, String);

    const uid = Meteor.userId();
    if (!uid) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'liveLocation.get' });
    }

    if (!(await canAccessRoomIdAsync(rid, uid))) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'liveLocation.get' });
    }

    const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
    if (!sub) {
      throw new Meteor.Error('error-not-in-room', 'User is not in the room', { method: 'liveLocation.get' });
    }
    const msg = await Messages.findOne({
      _id: msgId,
      rid,
      attachments: {
        $elemMatch: {
          type: 'live-location',
        },
      },
    });

    if (!msg) {
      throw new Meteor.Error('error-live-location-not-found', 'Live location not found', {
        method: 'liveLocation.get',
      });
    }

    const attachment = msg.attachments?.find((att: any) => att.type === 'live-location') as any;
    if (!attachment) {
      throw new Meteor.Error('error-live-location-not-found', 'Live location attachment not found', {
        method: 'liveLocation.get',
      });
    }
    return {
      messageId: msg._id,
      ownerId: attachment.live?.ownerId,
      ownerUsername: msg.u?.username,
      ownerName: (msg.u as any)?.name || msg.u?.username,
      isActive: attachment.live?.isActive || false,
      startedAt: attachment.live?.startedAt ? new Date(attachment.live.startedAt) : undefined,
      lastUpdateAt: attachment.live?.lastUpdateAt ? new Date(attachment.live.lastUpdateAt) : undefined,
      stoppedAt: attachment.live?.stoppedAt ? new Date(attachment.live.stoppedAt) : undefined,
      coords: attachment.live?.coords,
      expiresAt: attachment.live?.expiresAt ? new Date(attachment.live.expiresAt) : undefined,
      version: attachment.live?.version || 1,
    };
  },
});

DDPRateLimiter.addRule(
  {
    userId(userId: string) {
      return !!userId;
    },
    type: 'method',
    name: 'liveLocation.get',
  },
  10,
  60000
);