import type { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { LocalBroker, api } from '@rocket.chat/core-services';
import type { Db } from 'mongodb';
import request from 'supertest';
import type { App } from 'supertest/types.js';
import { AppModule } from '../src/app.module.js';
import { configureApp } from '../src/app.setup.js';
import { BROKER } from '../src/broker/broker.module.js';
import { SHADOW_CONFIG } from '../src/config/shadow.config.js';
import { MONGO_DB } from '../src/database/database.module.js';
import {
  type FakeWorkspace,
  grant,
  registerFakeCoreServices,
} from './fake-core-services.js';
import {
  alice,
  asUser,
  bob,
  defaultSettings,
  seedWorkspace,
} from './fixtures.js';
import { startMongo } from './mongo.js';

describe('REST v1 shadow (e2e)', () => {
  const workspace: FakeWorkspace = {
    settings: defaultSettings(),
    permissions: new Set(),
  };

  let app: INestApplication<App>;
  let db: Db;
  let stopMongo: () => Promise<void>;

  beforeAll(async () => {
    const mongo = await startMongo();
    stopMongo = mongo.stop;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(SHADOW_CONFIG)
      .useValue({ port: 0, mongoUrl: mongo.uri, settingsCacheTtlMs: 0 })
      .overrideProvider(BROKER)
      .useFactory({
        factory: () => {
          const broker = new LocalBroker();
          api.setBroker(broker);
          registerFakeCoreServices(workspace);
          return broker;
        },
      })
      .compile();

    app = configureApp(moduleRef.createNestApplication());
    await app.init();

    db = app.get<Db>(MONGO_DB);
    await seedWorkspace(db);
  });

  afterAll(async () => {
    await db?.dropDatabase();
    await app?.close();
    await stopMongo?.();
  });

  beforeEach(() => {
    workspace.settings = defaultSettings();
    workspace.permissions.clear();
  });

  const get = (path: string, user = alice) =>
    request(app.getHttpServer()).get(`/api/v1/${path}`).set(asUser(user));

  const post = (path: string, body: object, user = alice) =>
    request(app.getHttpServer())
      .post(`/api/v1/${path}`)
      .set(asUser(user))
      .send(body);

  const sendMessage = async (msg: string, rid = 'GENERAL', user = alice) => {
    const response = await post(
      'chat.sendMessage',
      { message: { rid, msg } },
      user,
    );
    expect(response.status).toBe(200);
    return response.body.message as { _id: string; rid: string };
  };

  describe('authentication', () => {
    it('rejects a request without credentials', async () => {
      const response = await request(app.getHttpServer()).get(
        '/api/v1/subscriptions.get',
      );

      expect(response.status).toBe(401);
      expect(response.body).toEqual({
        success: false,
        error: 'You must be logged in to do this.',
        status: 'error',
        message: 'You must be logged in to do this.',
      });
    });

    it('rejects a wrong token', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/subscriptions.get')
        .set(asUser({ _id: alice._id, token: 'wrong' }));

      expect(response.status).toBe(401);
    });
  });

  describe('GET subscriptions.get', () => {
    it('lists the subscriptions of the user', async () => {
      const response = await get('subscriptions.get');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.remove).toEqual([]);
      expect(
        response.body.update.map((sub: { rid: string }) => sub.rid).sort(),
      ).toEqual(['GENERAL', 'news', 'secret']);
    });

    it('lists only the changes after updatedSince', async () => {
      const response = await get(
        `subscriptions.get?updatedSince=${new Date().toISOString()}`,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ update: [], remove: [], success: true });
    });

    it('rejects an invalid date', async () => {
      const response = await get('subscriptions.get?updatedSince=yesterday');

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-roomId-param-invalid');
    });
  });

  describe('POST subscriptions.read', () => {
    it('marks the room as read through the room service', async () => {
      const response = await post(
        'subscriptions.read',
        { rid: 'GENERAL' },
        bob,
      );

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ success: true });

      const subscription = await db
        .collection('rocketchat_subscription')
        .findOne({ rid: 'GENERAL', 'u._id': bob._id });
      expect(subscription).toMatchObject({ alert: false, unread: 0 });
    });

    it('fails for a room that does not exist', async () => {
      const response = await post('subscriptions.read', { roomId: 'nope' });

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'error-invalid-subscription',
      });
    });
  });

  describe('GET rooms.get', () => {
    it('lists the rooms of the user with the public fields only', async () => {
      const response = await get('rooms.get', bob);

      expect(response.status).toBe(200);
      expect(response.body.update).toHaveLength(1);
      expect(response.body.update[0]).toMatchObject({
        _id: 'GENERAL',
        t: 'c',
      });
    });
  });

  describe('GET rooms.info', () => {
    it('finds a room by name', async () => {
      const response = await get('rooms.info?roomName=general');

      expect(response.status).toBe(200);
      expect(response.body.room).toMatchObject({ _id: 'GENERAL' });
    });

    it('hides a private room from a user who is not a member', async () => {
      const response = await get('rooms.info?roomId=secret', bob);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        success: false,
        error: 'not-allowed',
        errorType: 'Not Allowed',
      });
    });

    it('accepts query parameters that it does not use, like the real API', async () => {
      const response = await get('rooms.info?roomId=GENERAL&fields={"name":1}');

      expect(response.status).toBe(200);
      expect(response.body.room).toMatchObject({ _id: 'GENERAL' });
    });

    it('needs a room id or a room name', async () => {
      const response = await get('rooms.info');

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-roomid-param-not-provided');
    });
  });

  describe('GET channels.history', () => {
    it('returns the newest messages first', async () => {
      const response = await get('channels.history?roomId=GENERAL&count=2');

      expect(response.status).toBe(200);
      const messages = response.body.messages as { ts: string }[];
      expect(messages).toHaveLength(2);
      expect(new Date(messages[0].ts) > new Date(messages[1].ts)).toBe(true);
    });

    it('counts the unread messages that did not load', async () => {
      const oldest = new Date(Date.now() - 10 * 60_000).toISOString();
      const response = await get(
        `channels.history?roomId=GENERAL&count=1&unreads=true&oldest=${oldest}`,
      );

      expect(response.status).toBe(200);
      expect(response.body.messages).toHaveLength(1);
      expect(response.body.unreadNotLoaded).toBeGreaterThanOrEqual(2);
      expect(response.body.firstUnread).toMatchObject({ _id: 'general-3' });
    });

    it('serves public channels only', async () => {
      const response = await get('channels.history?roomId=secret');

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-room-not-found');
    });

    it('rejects unknown query parameters', async () => {
      const response = await get('channels.history?roomId=GENERAL&foo=1');

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-invalid-params');
    });
  });

  describe('POST chat.sendMessage', () => {
    it('sends a message through the message service', async () => {
      const message = await sendMessage('hello from the shadow');

      expect(message).toMatchObject({
        rid: 'GENERAL',
        msg: 'hello from the shadow',
        u: { _id: alice._id, username: alice.username },
      });
      const stored = await db
        .collection('rocketchat_message')
        .findOne({ _id: message._id as never });
      expect(stored).toMatchObject({ msg: 'hello from the shadow' });
      expect(stored).not.toHaveProperty('tmid');
      expect(stored).not.toHaveProperty('alias');
    });

    it('rejects a body that does not match the contract', async () => {
      const response = await post('chat.sendMessage', {
        message: { rid: 'GENERAL', msg: 'hi' },
        unexpected: true,
      });

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-invalid-params');
    });

    it('rejects a message over Message_MaxAllowedSize', async () => {
      workspace.settings.Message_MaxAllowedSize = 5;

      const response = await post('chat.sendMessage', {
        message: { rid: 'GENERAL', msg: 'too long' },
      });

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-message-size-exceeded');
    });

    it('stops a user who cannot access the room', async () => {
      const response = await post(
        'chat.sendMessage',
        { message: { rid: 'secret', msg: 'let me in' } },
        bob,
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toBe('error-not-allowed');
    });

    it('needs post-readonly to post in a read-only room', async () => {
      const denied = await post('chat.sendMessage', {
        message: { rid: 'news', msg: 'breaking' },
      });
      expect(denied.status).toBe(400);
      expect(denied.body.error).toMatch(/readonly/);

      grant(workspace, alice._id, 'post-readonly');
      await sendMessage('breaking', 'news');
    });

    it('sends a reply to the root of a nested thread', async () => {
      const root = await sendMessage('thread root');
      const reply = await post('chat.sendMessage', {
        message: { rid: 'GENERAL', msg: 'reply', tmid: root._id },
      });
      const nested = await post('chat.sendMessage', {
        message: {
          rid: 'GENERAL',
          msg: 'nested',
          tmid: reply.body.message._id,
        },
      });

      expect(nested.status).toBe(200);
      expect(nested.body.message.tmid).toBe(root._id);
    });

    it('rejects tshow without tmid', async () => {
      const response = await post('chat.sendMessage', {
        message: { rid: 'GENERAL', msg: 'hi', tshow: true },
      });

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('invalid-params');
    });
  });

  describe('GET chat.getMessage', () => {
    it('returns a message of a room the user can access', async () => {
      const response = await get('chat.getMessage?msgId=general-1', bob);

      expect(response.status).toBe(200);
      expect(response.body.message).toMatchObject({ _id: 'general-1' });
    });

    it('stops a user who cannot access the room', async () => {
      const response = await get('chat.getMessage?msgId=secret-1', bob);

      expect(response.status).toBe(400);
      expect(response.body).toMatchObject({
        errorType: 'error-not-allowed',
        details: { method: 'getSingleMessage' },
      });
    });
  });

  describe('POST chat.update', () => {
    it('lets the author edit their message', async () => {
      const { _id } = await sendMessage('first draft');

      const response = await post('chat.update', {
        roomId: 'GENERAL',
        msgId: _id,
        text: 'final text',
      });

      expect(response.status).toBe(200);
      expect(response.body.message).toMatchObject({
        _id,
        msg: 'final text',
        editedBy: { _id: alice._id },
      });
    });

    it('stops another user without edit-message', async () => {
      const { _id } = await sendMessage('mine');

      const response = await post(
        'chat.update',
        { roomId: 'GENERAL', msgId: _id, text: 'yours now' },
        bob,
      );

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-action-not-allowed');
    });

    it('checks that the message belongs to the room', async () => {
      const { _id } = await sendMessage('in general');

      const response = await post('chat.update', {
        roomId: 'news',
        msgId: _id,
        text: 'moved',
      });

      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'The room id provided does not match where the message is from.',
      );
    });
  });

  describe('POST chat.react', () => {
    it('toggles the reaction of the user', async () => {
      const { _id } = await sendMessage('react to me');

      await post('chat.react', { messageId: _id, emoji: 'smile' }).expect(200);
      let stored = await db
        .collection('rocketchat_message')
        .findOne({ _id: _id as never });
      expect(stored?.reactions[':smile:'].usernames).toEqual([alice.username]);

      await post('chat.react', { messageId: _id, reaction: ':smile:' }).expect(
        200,
      );
      stored = await db
        .collection('rocketchat_message')
        .findOne({ _id: _id as never });
      expect(stored?.reactions?.[':smile:']).toBeUndefined();
    });

    it('fails for a message that does not exist', async () => {
      const response = await post('chat.react', {
        messageId: 'nope',
        emoji: 'smile',
      });

      expect(response.status).toBe(400);
      expect(response.body.errorType).toBe('error-message-not-found');
    });
  });

  describe('POST chat.delete', () => {
    it('needs delete-own-message to delete an own message', async () => {
      const { _id } = await sendMessage('regret');

      const denied = await post('chat.delete', {
        roomId: 'GENERAL',
        msgId: _id,
      });
      expect(denied.status).toBe(400);
      expect(denied.body.errorType).toBe('error-action-not-allowed');

      grant(workspace, alice._id, 'delete-own-message');
      const response = await post('chat.delete', {
        roomId: 'GENERAL',
        msgId: _id,
      });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        _id,
        message: { _id, rid: 'GENERAL', u: { _id: alice._id } },
        success: true,
      });
      await expect(
        db
          .collection('rocketchat_message')
          .countDocuments({ _id: _id as never }),
      ).resolves.toBe(0);
    });

    it('needs force-delete-message to delete as the author', async () => {
      const { _id } = await sendMessage('not yours');

      const response = await post(
        'chat.delete',
        { roomId: 'GENERAL', msgId: _id, asUser: true },
        bob,
      );

      expect(response.status).toBe(400);
      expect(response.body.error).toMatch(/force-delete-message/);
    });
  });
});
