import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';
import { Messages, Subscriptions } from '@rocket.chat/models';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';

type Coords = { lat: number; lng: number; acc?: number };

const MIN_INTERVAL_MS = 3000;

Meteor.methods({
  /**
   * Update live location coordinates
   */
  async 'liveLocation.update'(rid: string, msgId: string, coords: Coords) {
    check(rid, String);
    check(msgId, String);
    check(coords, Object);

    const uid = Meteor.userId();
    if (!uid) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'liveLocation.update' });
    }

    if (!(await canAccessRoomIdAsync(rid, uid))) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'liveLocation.update' });
    }
    const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
    if (!sub) {
      throw new Meteor.Error('error-not-in-room', 'User is not in the room', { method: 'liveLocation.update' });
    }

    const msg = await Messages.findOne({
      _id: msgId,
      rid,
      'u._id': uid,
      attachments: {
        $elemMatch: {
          type: 'live-location',
          'live.isActive': true,
        },
      },
    });

    if (!msg) {
      throw new Meteor.Error('error-live-location-not-found', 'Active live location not found', {
        method: 'liveLocation.update',
      });
    }

    const last: Date | undefined = (msg.attachments?.[0] as any)?.live?.lastUpdateAt;
    const now = new Date();
    if (last && now.getTime() - new Date(last).getTime() < MIN_INTERVAL_MS) {
      return { ignored: true, reason: 'too-soon' };
    }

    const updateTime = new Date();
    const res = await Messages.updateOne(
      { _id: msgId },
      {
        $set: {
          'attachments.0.live.coords': coords,
          'attachments.0.live.lastUpdateAt': updateTime,
        },
      },
    );

    // Notify clients of message update for real-time UI refresh
    if (res.modifiedCount > 0) {
      const updatedMsg = await Messages.findOneById(msgId);
      if (updatedMsg) {
        void notifyOnMessageChange({
          id: updatedMsg._id,
          data: updatedMsg,
        });
      }
    }

    return { updated: Boolean(res.modifiedCount) };
  },
});

DDPRateLimiter.addRule(
  {
    userId(userId: string) {
      return !!userId;
    },
    type: 'method',
    name: 'liveLocation.update',
  },
  12,
  60000
);
