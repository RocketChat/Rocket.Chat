import { Meteor } from 'meteor/meteor';

import { Messages } from '@rocket.chat/models';

const CLEANUP_INTERVAL_MS = 60_000;
const INACTIVE_GRACE_MS   = 30_000;
async function ensureIndex(collection: any, keys: any, options: any = {}) {
  try {
    await collection.col.createIndex(keys, options);
  } catch (e) {
    // ignore errors
  }
}

Meteor.startup(async () => {
  await ensureIndex(Messages, { 'attachments.0.type': 1, 'attachments.0.live.isActive': 1 });
  await ensureIndex(Messages, { rid: 1, 'u._id': 1, 'attachments.0.type': 1, 'attachments.0.live.isActive': 1 });
  await ensureIndex(
    Messages,
    { 'attachments.0.live.expiresAt': 1 },
    {
      expireAfterSeconds: 0,
      partialFilterExpression: { 'attachments.0.type': 'live-location', 'attachments.0.live.expiresAt': { $type: 'date' } },
      name: 'liveLocation_expiresAt_TTL',
    },
  );
  await ensureIndex(
    Messages,
    { 'attachments.0.live.lastUpdateAt': 1 },
    {
      partialFilterExpression: { 'attachments.0.type': 'live-location' },
      name: 'liveLocation_lastUpdateAt_idx',
    },
  );

  Meteor.setInterval(async () => {
    const now = new Date();
    const staleBefore = new Date(now.getTime() - INACTIVE_GRACE_MS);
    await Messages.updateMany(
      {
        'attachments.0.type': 'live-location',
        'attachments.0.live.isActive': true,
        $or: [
          { 'attachments.0.live.lastUpdateAt': { $lt: staleBefore } },
          { 'attachments.0.live.expiresAt': { $lte: now } },
        ],
      },
      {
        $set: {
          'attachments.0.live.isActive': false,
          'attachments.0.live.stoppedAt': now,
        },
      },
    );
  }, CLEANUP_INTERVAL_MS);
});

export const LiveLocationStartup = {
  CLEANUP_INTERVAL_MS,
  INACTIVE_GRACE_MS,
};
