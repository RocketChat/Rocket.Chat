import { Injectable } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import type { IMessage, IRoom, IUser } from '@rocket.chat/core-typings';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { InjectModel, type Models } from '../database/models.js';
import { SettingsService } from '../settings/settings.service.js';

const elapsedMinutes = (ts: Date): number =>
  (Date.now() - new Date(ts).getTime()) / 60_000;

// The message rules that the real API checks in the monolith before it calls
// the message service. The service itself does not enforce them.
@Injectable()
export class MessagePermissionsService {
  constructor(
    @InjectCoreService('Authorization')
    private readonly authorization: CoreServices['Authorization'],
    @InjectModel('Rooms') private readonly rooms: Models['Rooms'],
    @InjectModel('Subscriptions')
    private readonly subscriptions: Models['Subscriptions'],
    private readonly settings: SettingsService,
  ) {}

  async assertCanSendMessage(rid: string, user: IUser): Promise<IRoom> {
    const room = await this.rooms.findOneById(rid);
    if (!room) {
      throw new Error('error-invalid-room');
    }

    if (room.archived) {
      throw new Error('room_is_archived');
    }

    if (
      user.type !== 'app' &&
      !(await this.authorization.canAccessRoom(room, user))
    ) {
      throw new Error('error-not-allowed');
    }

    if (room.t === 'd' && (room.uids?.length ?? 0) <= 2) {
      const subscription = await this.subscriptions.findOneByRoomIdAndUserId(
        room._id,
        user._id,
        { projection: { blocked: 1, blocker: 1 } },
      );
      if (subscription?.blocked || subscription?.blocker) {
        throw new Error('room_is_blocked');
      }
    }

    if (
      room.ro === true &&
      !(await this.authorization.hasPermission(
        user._id,
        'post-readonly',
        room._id,
      )) &&
      user.username &&
      !(room.unmuted ?? []).includes(user.username)
    ) {
      throw new Error("You can't send messages because the room is readonly.");
    }

    if (user.username && room.muted?.includes(user.username)) {
      throw new Error('You_have_been_muted');
    }

    return room;
  }

  async assertCanEditMessage(user: IUser, original: IMessage): Promise<void> {
    const [canEditAny, editAllowed, blockEditInMinutes, bypassTimeLimit] =
      await Promise.all([
        this.authorization.hasPermission(
          user._id,
          'edit-message',
          original.rid,
        ),
        this.settings.get<boolean>('Message_AllowEditing'),
        this.settings.get<number>('Message_AllowEditing_BlockEditInMinutes'),
        this.authorization.hasPermission(
          user._id,
          'bypass-time-limit-edit-and-delete',
          original.rid,
        ),
      ]);

    const editOwn = original.u?._id === user._id;
    if (!canEditAny && (!editAllowed || !editOwn)) {
      throw new MeteorError(
        'error-action-not-allowed',
        'Message editing not allowed',
        { method: 'updateMessage', action: 'Message_editing' },
      );
    }

    if (
      !bypassTimeLimit &&
      typeof blockEditInMinutes === 'number' &&
      blockEditInMinutes !== 0 &&
      original.ts &&
      Math.floor(elapsedMinutes(original.ts)) >= blockEditInMinutes
    ) {
      throw new MeteorError(
        'error-message-editing-blocked',
        'Message editing is blocked',
        { method: 'updateMessage' },
      );
    }

    await this.assertCanSendMessage(original.rid, user);
  }

  async canDeleteMessage(
    user: Pick<IUser, '_id' | 'username'>,
    message: Pick<IMessage, 'u' | 'rid' | 'ts'>,
  ): Promise<boolean> {
    const room = await this.rooms.findOneById<
      Pick<IRoom, '_id' | 'ro' | 'unmuted' | 't' | 'teamId' | 'prid'>
    >(message.rid, {
      projection: { _id: 1, ro: 1, unmuted: 1, t: 1, teamId: 1, prid: 1 },
    });

    if (
      !room ||
      !(await this.authorization.canAccessRoom(room, { _id: user._id }))
    ) {
      return false;
    }

    if (
      await this.authorization.hasPermission(
        user._id,
        'force-delete-message',
        room._id,
      )
    ) {
      return true;
    }

    if (!message.ts || !(await this.settings.get('Message_AllowDeleting'))) {
      return false;
    }

    const allowed =
      (await this.authorization.hasPermission(
        user._id,
        'delete-message',
        room._id,
      )) ||
      (user._id === message.u._id &&
        (await this.authorization.hasPermission(
          user._id,
          'delete-own-message',
          room._id,
        )));
    if (!allowed) {
      return false;
    }

    const bypassTimeLimit = await this.authorization.hasPermission(
      user._id,
      'bypass-time-limit-edit-and-delete',
      room._id,
    );
    if (!bypassTimeLimit) {
      const blockDeleteInMinutes = await this.settings.get<number>(
        'Message_AllowDeleting_BlockDeleteInMinutes',
      );
      if (blockDeleteInMinutes) {
        return Math.round(elapsedMinutes(message.ts)) <= blockDeleteInMinutes;
      }
    }

    if (
      room.ro === true &&
      !(await this.authorization.hasPermission(
        user._id,
        'post-readonly',
        room._id,
      )) &&
      user.username &&
      !(room.unmuted ?? []).includes(user.username)
    ) {
      throw new Error(
        "You can't delete messages because the room is readonly.",
      );
    }

    return true;
  }
}
