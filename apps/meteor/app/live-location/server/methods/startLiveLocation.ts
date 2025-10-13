import type { IRoom, IUser } from '@rocket.chat/core-typings';
import { Meteor } from 'meteor/meteor';
import { check, Match } from 'meteor/check';

import { Rooms, Subscriptions, Messages } from '@rocket.chat/models';
import { canAccessRoomIdAsync } from '../../../authorization/server/functions/canAccessRoom';
import { notifyOnMessageChange } from '../../../lib/server/lib/notifyListener';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';

type Coords = { lat: number; lng: number; acc?: number };

declare module 'meteor/meteor' {
  namespace Meteor {
    function user(): IUser | null;
  }
}

Meteor.methods({
  /**
   * Start live location sharing in a room
   */
  async 'liveLocation.start'(rid: string, opts: { durationSec?: number; initial?: Coords } = {}) {
    check(rid, String);
    check(opts, Match.ObjectIncluding({ durationSec: Match.Optional(Number), initial: Match.Optional(Object) }));

    const uid = Meteor.userId();
    if (!uid) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'liveLocation.start' });
    }

    const room = await Rooms.findOneById<IRoom>(rid);
    if (!room) {
      throw new Meteor.Error('error-room-not-found', 'Room not found', { method: 'liveLocation.start' });
    }

    const sub = await Subscriptions.findOneByRoomIdAndUserId(rid, uid);
    if (!sub) {
      throw new Meteor.Error('error-not-in-room', 'User is not in the room', { method: 'liveLocation.start' });
    }
    if (!(await canAccessRoomIdAsync(rid, uid))) {
      throw new Meteor.Error('error-not-allowed', 'Not allowed', { method: 'liveLocation.start' });
    }

    // Reuse existing active live location if found
    const existing = await Messages.findOne({
      rid,
      'u._id': uid,
      attachments: {
        $elemMatch: {
          type: 'live-location',
          'live.isActive': true,
        },
      },
    });

    if (existing) {
      return { msgId: existing._id };
    }

    const now = new Date();
    const expiresAt = opts.durationSec ? new Date(now.getTime() + opts.durationSec * 1000) : undefined;
    const user = await Meteor.users.findOneAsync({ _id: uid }, { 
        projection: { username: 1, name: 1 } 
    });
    
    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'User not found', { method: 'liveLocation.start' });
    }

    const msg = {
      rid,
      ts: now,
      u: { 
            _id: uid,
            username: user.username,
            name: (user as any).name || user.username
        },
      attachments: [
        {
          type: 'live-location',
          live: {
            isActive: true,
            ownerId: uid,
            startedAt: now,
            lastUpdateAt: now,
            expiresAt,
            coords: opts.initial || null,
            version: 1,
          },
        },
      ],
    } as any;

    try {
      const result = await Messages.insertOne(msg);
      
      const createdMsg = await Messages.findOneById(result.insertedId);
      if (createdMsg) {
        void notifyOnMessageChange({
          id: createdMsg._id,
          data: createdMsg,
        });
      }
      
      return { msgId: result.insertedId };
    } catch (insertError) {
      throw new Meteor.Error('error-message-creation-failed', 'Failed to create live location message', { method: 'liveLocation.start' });
    }
  },
});

DDPRateLimiter.addRule(
  {
    userId(userId: string) {
      return !!userId;
    },
    type: 'method',
    name: 'liveLocation.start',
  },
  5,
  60000
);