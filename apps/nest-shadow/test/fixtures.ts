import { createHash } from 'node:crypto';
import type { SettingValue } from '@rocket.chat/core-typings';
import type { Db } from 'mongodb';

export const alice = {
  _id: 'alice-id',
  username: 'alice',
  token: 'alice-token',
};
export const bob = { _id: 'bob-id', username: 'bob', token: 'bob-token' };

export const asUser = (user: { _id: string; token: string }) => ({
  'X-User-Id': user._id,
  'X-Auth-Token': user.token,
});

export const defaultSettings = (): Record<string, SettingValue> => ({
  API_Allow_Infinite_Count: true,
  API_Default_Count: 50,
  API_Upper_Count_Limit: 100,
  E2E_Allow_Unencrypted_Messages: false,
  E2E_Enable: false,
  Hide_System_Messages: [],
  Message_AllowDeleting: true,
  Message_AllowDeleting_BlockDeleteInMinutes: 0,
  Message_AllowEditing: true,
  Message_AllowEditing_BlockEditInMinutes: 0,
  Message_MaxAllowedSize: 5000,
  Threads_enabled: true,
  UI_Use_Real_Name: false,
});

const minutesAgo = (minutes: number): Date =>
  new Date(Date.now() - minutes * 60_000);

const hashed = (token: string): string =>
  createHash('sha256').update(token).digest('base64');

export async function seedWorkspace(db: Db): Promise<void> {
  const now = new Date();

  await db.collection('users').insertMany(
    [alice, bob].map(({ _id, username, token }) => ({
      _id: _id as never,
      username,
      name: username.toUpperCase(),
      type: 'user',
      active: true,
      roles: ['user'],
      services: {
        resume: { loginTokens: [{ hashedToken: hashed(token), when: now }] },
      },
      _updatedAt: now,
    })),
  );

  const owner = { _id: alice._id, username: alice.username };
  await db.collection('rocketchat_room').insertMany(
    [
      { _id: 'GENERAL', t: 'c', name: 'general', u: owner, ts: now, msgs: 3 },
      { _id: 'secret', t: 'p', name: 'secret', u: owner, ts: now, msgs: 1 },
      {
        _id: 'news',
        t: 'c',
        name: 'news',
        u: owner,
        ts: now,
        msgs: 0,
        ro: true,
      },
    ].map((room) => ({ ...room, _id: room._id as never, _updatedAt: now })),
  );

  await db.collection('rocketchat_subscription').insertMany(
    [
      { rid: 'GENERAL', name: 'general', t: 'c', u: owner },
      { rid: 'secret', name: 'secret', t: 'p', u: owner },
      { rid: 'news', name: 'news', t: 'c', u: owner },
      {
        rid: 'GENERAL',
        name: 'general',
        t: 'c',
        u: { _id: bob._id, username: bob.username },
      },
    ].map((subscription, index) => ({
      _id: `sub-${index}` as never,
      ...subscription,
      open: true,
      alert: true,
      unread: 2,
      ts: now,
      _updatedAt: minutesAgo(10),
    })),
  );

  await db.collection('rocketchat_message').insertMany([
    ...[3, 2, 1].map((age) => ({
      _id: `general-${age}` as never,
      rid: 'GENERAL',
      msg: `message sent ${age} minutes ago`,
      ts: minutesAgo(age),
      u: owner,
      _updatedAt: minutesAgo(age),
    })),
    {
      _id: 'secret-1' as never,
      rid: 'secret',
      msg: 'members only',
      ts: minutesAgo(1),
      u: owner,
      _updatedAt: minutesAgo(1),
    },
  ]);
}
