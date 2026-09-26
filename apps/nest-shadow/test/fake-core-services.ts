import { randomUUID } from 'node:crypto';
import { ServiceClass, api } from '@rocket.chat/core-services';
import type {
  IMessage,
  IRoom,
  IUser,
  SettingValue,
} from '@rocket.chat/core-typings';
import { Messages, Rooms, Subscriptions, Users } from '@rocket.chat/models';

// Stand-ins for the services that the monolith registers on the broker. They
// keep only the behaviour that the shadow endpoints depend on.
export interface FakeWorkspace {
  settings: Record<string, SettingValue>;
  permissions: Set<string>;
}

export const grant = (
  workspace: FakeWorkspace,
  uid: string,
  permission: string,
): void => {
  workspace.permissions.add(`${uid}:${permission}`);
};

class FakeSettingsService extends ServiceClass {
  protected name = 'settings';

  constructor(private readonly workspace: FakeWorkspace) {
    super();
  }

  async get(settingId: string): Promise<SettingValue> {
    return this.workspace.settings[settingId];
  }
}

class FakeAuthorizationService extends ServiceClass {
  protected name = 'authorization';

  constructor(private readonly workspace: FakeWorkspace) {
    super();
  }

  async hasPermission(
    user: string | Pick<IUser, '_id'>,
    permission: string,
  ): Promise<boolean> {
    const uid = typeof user === 'string' ? user : user._id;
    return this.workspace.permissions.has(`${uid}:${permission}`);
  }

  async canAccessRoom(
    room?: Pick<IRoom, '_id' | 't'>,
    user?: Pick<IUser, '_id'>,
  ): Promise<boolean> {
    if (!room || !user) {
      return false;
    }

    if (room.t === 'c') {
      return true;
    }

    return Boolean(
      await Subscriptions.findOneByRoomIdAndUserId(room._id, user._id),
    );
  }

  async canReadRoom(
    room?: Pick<IRoom, '_id' | 't'>,
    user?: Pick<IUser, '_id'>,
  ): Promise<boolean> {
    return this.canAccessRoom(room, user);
  }

  async canAccessRoomId(rid: string, uid: string): Promise<boolean> {
    const room = await Rooms.findOneById(rid);
    return this.canAccessRoom(room ?? undefined, { _id: uid });
  }
}

class FakeMessageService extends ServiceClass {
  protected name = 'message';

  async sendMessageWithValidation(
    user: IUser,
    message: Partial<IMessage>,
    room: IRoom,
  ): Promise<IMessage> {
    const sent = {
      ...message,
      _id: message._id ?? randomUUID(),
      rid: room._id,
      msg: message.msg ?? '',
      ts: message.ts ?? new Date(),
      u: { _id: user._id, username: user.username as string, name: user.name },
    } as IMessage;

    await Messages.insertOne(sent);
    await Rooms.updateOne(
      { _id: room._id },
      { $set: { lastMessage: sent, lm: sent.ts }, $inc: { msgs: 1 } },
    );

    return sent;
  }

  async updateMessage(message: IMessage, user: IUser): Promise<void> {
    await Messages.updateOne(
      { _id: message._id },
      {
        $set: {
          msg: message.msg,
          ...(message.attachments && { attachments: message.attachments }),
          editedAt: new Date(),
          editedBy: { _id: user._id, username: user.username as string },
        },
      },
    );
  }

  async deleteMessage(_user: IUser, message: IMessage): Promise<void> {
    await Messages.deleteOne({ _id: message._id });
  }

  async reactToMessage(
    userId: string,
    reaction: string,
    messageId: string,
    shouldReact?: boolean,
  ): Promise<void> {
    const [user, message] = await Promise.all([
      Users.findOneById(userId),
      Messages.findOneById(messageId),
    ]);
    if (!user?.username || !message) {
      throw new Error('error-not-allowed');
    }

    const key = `:${reaction.replace(/:/g, '')}:`;
    const usernames = message.reactions?.[key]?.usernames ?? [];
    const reacted = usernames.includes(user.username);
    const react = shouldReact ?? !reacted;

    const next = react
      ? [...new Set([...usernames, user.username])]
      : usernames.filter((username) => username !== user.username);

    await Messages.updateOne(
      { _id: messageId },
      next.length
        ? { $set: { [`reactions.${key}`]: { usernames: next } } }
        : { $unset: { [`reactions.${key}`]: 1 } },
    );
  }
}

class FakeRoomService extends ServiceClass {
  protected name = 'room';

  async markAsRead(room: IRoom, userId: string): Promise<void> {
    await Subscriptions.updateOne(
      { rid: room._id, 'u._id': userId },
      { $set: { open: true, alert: false, unread: 0, ls: new Date() } },
    );
  }
}

class FakeTeamService extends ServiceClass {
  protected name = 'team';

  async getRoomInfo(): Promise<Record<string, never>> {
    return {};
  }
}

export function registerFakeCoreServices(workspace: FakeWorkspace): void {
  api.registerService(new FakeSettingsService(workspace));
  api.registerService(new FakeAuthorizationService(workspace));
  api.registerService(new FakeMessageService());
  api.registerService(new FakeRoomService());
  api.registerService(new FakeTeamService());
}
