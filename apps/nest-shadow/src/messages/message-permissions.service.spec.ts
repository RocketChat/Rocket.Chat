import { Test } from '@nestjs/testing';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import { getCoreServiceToken } from '../broker/core-services.js';
import { getModelToken } from '../database/models.js';
import { SettingsService } from '../settings/settings.service.js';
import { MessagePermissionsService } from './message-permissions.service.js';

describe('MessagePermissionsService', () => {
  const author = { _id: 'author', username: 'author' } as IUser;
  const other = { _id: 'other', username: 'other' } as IUser;
  const room = { _id: 'GENERAL', t: 'c' } as IRoom;

  let currentRoom: IRoom;
  let permissions: Set<string>;
  let settings: Record<string, unknown>;
  let service: MessagePermissionsService;

  beforeEach(async () => {
    currentRoom = { ...room };
    permissions = new Set();
    settings = {
      Message_AllowEditing: true,
      Message_AllowEditing_BlockEditInMinutes: 0,
      Message_AllowDeleting: true,
      Message_AllowDeleting_BlockDeleteInMinutes: 0,
    };

    const moduleRef = await Test.createTestingModule({
      providers: [
        MessagePermissionsService,
        {
          provide: getCoreServiceToken('Authorization'),
          useValue: {
            canAccessRoom: async () => true,
            hasPermission: async (uid: string, permission: string) =>
              permissions.has(`${uid}:${permission}`),
          },
        },
        {
          provide: getModelToken('Rooms'),
          useValue: { findOneById: async () => currentRoom },
        },
        {
          provide: getModelToken('Subscriptions'),
          useValue: { findOneByRoomIdAndUserId: async () => null },
        },
        {
          provide: SettingsService,
          useValue: { get: async (id: string) => settings[id] },
        },
      ],
    }).compile();

    service = moduleRef.get(MessagePermissionsService);
  });

  const message = (minutesAgo = 0): IMessage =>
    ({
      _id: 'm1',
      rid: room._id,
      u: { _id: author._id, username: author.username },
      ts: new Date(Date.now() - minutesAgo * 60_000),
    }) as IMessage;

  describe('assertCanEditMessage', () => {
    it('lets the author edit their own message', async () => {
      await expect(
        service.assertCanEditMessage(author, message()),
      ).resolves.toBeUndefined();
    });

    it('stops another user without the edit-message permission', async () => {
      await expect(
        service.assertCanEditMessage(other, message()),
      ).rejects.toMatchObject({ error: 'error-action-not-allowed' });
    });

    it('lets a user with the edit-message permission edit any message', async () => {
      permissions.add('other:edit-message');

      await expect(
        service.assertCanEditMessage(other, message()),
      ).resolves.toBeUndefined();
    });

    it('blocks the edit after the time limit', async () => {
      settings.Message_AllowEditing_BlockEditInMinutes = 5;

      await expect(
        service.assertCanEditMessage(author, message(10)),
      ).rejects.toMatchObject({ error: 'error-message-editing-blocked' });
    });
  });

  describe('canDeleteMessage', () => {
    it('needs the delete-own-message permission for the author', async () => {
      await expect(service.canDeleteMessage(author, message())).resolves.toBe(
        false,
      );

      permissions.add('author:delete-own-message');
      await expect(service.canDeleteMessage(author, message())).resolves.toBe(
        true,
      );
    });

    it('lets force-delete-message delete any message at any time', async () => {
      settings.Message_AllowDeleting = false;
      permissions.add('other:force-delete-message');

      await expect(service.canDeleteMessage(other, message(60))).resolves.toBe(
        true,
      );
    });
  });

  describe('assertCanSendMessage', () => {
    it('stops a muted user', async () => {
      currentRoom = { ...room, muted: ['author'] };

      await expect(
        service.assertCanSendMessage(room._id, author),
      ).rejects.toThrow('You_have_been_muted');
    });

    it('stops a user who cannot post in a read-only room', async () => {
      currentRoom = { ...room, ro: true };

      await expect(
        service.assertCanSendMessage(room._id, author),
      ).rejects.toThrow('readonly');

      permissions.add('author:post-readonly');
      await expect(
        service.assertCanSendMessage(room._id, author),
      ).resolves.toMatchObject({ _id: room._id });
    });
  });
});
