import { Injectable } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import type { IRoom } from '@rocket.chat/core-typings';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { RestV1Failure } from '../common/rest-v1.failure.js';
import { parseUpdatedSince } from '../common/updated-since.js';
import { InjectModel, type Models } from '../database/models.js';
import { MessageNormalizerService } from '../messages/message-normalizer.service.js';
import type { RoomInfoQuery } from './dto/room-info.query.js';
import { excludedRoomFields, roomFields } from './room-fields.js';

@Injectable()
export class RoomsService {
  constructor(
    @InjectCoreService('Authorization')
    private readonly authorization: CoreServices['Authorization'],
    @InjectCoreService('Team') private readonly team: CoreServices['Team'],
    @InjectModel('Rooms') private readonly rooms: Models['Rooms'],
    private readonly normalizer: MessageNormalizerService,
  ) {}

  async listRooms(
    uid: string,
    updatedSince?: string,
  ): Promise<{ update: IRoom[]; remove: IRoom[] }> {
    const since = parseUpdatedSince(
      updatedSince,
      new MeteorError(
        'error-updatedSince-param-invalid',
        'The "updatedSince" query parameter must be a valid date.',
      ),
    );
    const options = { projection: roomFields };

    if (!since) {
      const cursor = await this.rooms.findBySubscriptionUserId(uid, options);
      return {
        update: await this.withLastMessage(await cursor.toArray(), uid),
        remove: [],
      };
    }

    const [updated, removed] = await Promise.all([
      this.rooms
        .findBySubscriptionUserIdUpdatedAfter(uid, since, options)
        .then((cursor) => cursor.toArray()),
      this.rooms
        .trashFindDeletedAfter(
          since,
          {},
          { projection: { _id: 1, _deletedAt: 1 } },
        )
        .toArray(),
    ]);

    return {
      update: await this.withLastMessage(updated, uid),
      remove: await this.withLastMessage(removed as IRoom[], uid),
    };
  }

  async getRoomInfo(
    uid: string,
    { roomId, roomName }: RoomInfoQuery,
  ): Promise<{
    room: IRoom | null;
    team?: unknown;
    parent?: unknown;
  }> {
    const room = await this.findRoomByIdOrName({ roomId, roomName });

    if (!(await this.authorization.canAccessRoom(room, { _id: uid }))) {
      throw new RestV1Failure('not-allowed', 'Not Allowed');
    }

    const discussionParent =
      room.prid &&
      (await this.rooms.findOneById(room.prid, {
        projection: { name: 1, fname: 1, t: 1, prid: 1, u: 1 },
      }));
    const { team, parentRoom } = await this.team.getRoomInfo(room);
    const parent = discussionParent || parentRoom;

    return {
      room: await this.rooms.findOneByIdOrName(room._id),
      ...(team && { team }),
      ...(parent && { parent }),
    };
  }

  async findRoomByIdOrName({
    roomId,
    roomName,
  }: {
    roomId?: string;
    roomName?: string;
  }): Promise<IRoom> {
    if (!roomId && !roomName) {
      throw new MeteorError(
        'error-roomid-param-not-provided',
        'The parameter "roomId" or "roomName" is required',
      );
    }

    const options = { projection: excludedRoomFields };
    const room =
      roomId !== undefined
        ? await this.rooms.findOneById(roomId, options)
        : await this.rooms.findOneByName(roomName as string, options);

    if (!room) {
      throw new MeteorError(
        'error-room-not-found',
        'The required "roomId" or "roomName" param provided does not match any channel',
      );
    }

    return room;
  }

  private async withLastMessage(rooms: IRoom[], uid: string): Promise<IRoom[]> {
    for (const room of rooms) {
      if (room.lastMessage) {
        [room.lastMessage] = await this.normalizer.normalize(
          [room.lastMessage],
          uid,
        );
      }
    }

    return rooms;
  }
}
