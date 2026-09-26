import { Injectable } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import type {
  IMessage,
  IRoom,
  MessageTypesValues,
} from '@rocket.chat/core-typings';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { PaginationService } from '../common/pagination.service.js';
import { RestV1Forbidden } from '../common/rest-v1.failure.js';
import { InjectModel, type Models } from '../database/models.js';
import { MessageNormalizerService } from '../messages/message-normalizer.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { ChannelHistoryQuery } from './dto/channel-history.query.js';
import { RoomsService } from './rooms.service.js';

export interface ChannelHistory {
  messages: IMessage[];
  firstUnread?: IMessage;
  unreadNotLoaded?: number;
}

// The `mute_unmute` option of Hide_System_Messages covers two message types.
const expandHiddenTypes = (
  types: MessageTypesValues[],
): MessageTypesValues[] => [
  ...new Set(
    types.flatMap<MessageTypesValues>((type) =>
      type === 'mute_unmute' ? ['user-muted', 'user-unmuted'] : [type],
    ),
  ),
];

@Injectable()
export class ChannelHistoryService {
  constructor(
    @InjectCoreService('Authorization')
    private readonly authorization: CoreServices['Authorization'],
    @InjectModel('Messages') private readonly messages: Models['Messages'],
    private readonly rooms: RoomsService,
    private readonly pagination: PaginationService,
    private readonly settings: SettingsService,
    private readonly normalizer: MessageNormalizerService,
  ) {}

  async getHistory(
    uid: string,
    query: ChannelHistoryQuery,
  ): Promise<ChannelHistory> {
    const room = await this.rooms.findRoomByIdOrName(query);
    if (room.t !== 'c' && room.t !== 'l') {
      throw new MeteorError(
        'error-room-not-found',
        'The required "roomId" or "roomName" param provided does not match any channel',
      );
    }

    if (!(await this.authorization.canReadRoom(room, { _id: uid }))) {
      throw new RestV1Forbidden();
    }

    const { count, offset } = await this.pagination.parse(query);
    const latest = query.latest ? new Date(query.latest) : new Date();
    const oldest = query.oldest ? new Date(query.oldest) : undefined;
    const inclusive = query.inclusive === 'true';
    const showThreadMessages = query.showThreadMessages === 'true';
    const hiddenTypes = await this.getHiddenTypes(room);

    const options = { sort: { ts: -1 as const }, skip: offset, limit: count };
    const records = await (
      oldest === undefined
        ? this.messages.findVisibleByRoomIdBeforeTimestampNotContainingTypes(
            room._id,
            latest,
            hiddenTypes,
            options,
            showThreadMessages,
            inclusive,
          )
        : this.messages.findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
            room._id,
            oldest,
            latest,
            hiddenTypes,
            options,
            showThreadMessages,
            inclusive,
          )
    ).toArray();

    const messages = await this.normalizer.normalize(records, uid);

    if (query.unreads !== 'true') {
      return { messages };
    }

    const oldestLoaded = messages[messages.length - 1];
    if (oldest === undefined || !oldestLoaded || oldestLoaded.ts <= oldest) {
      return { messages, unreadNotLoaded: 0 };
    }

    const [firstUnread] = await this.messages
      .findVisibleByRoomIdBetweenTimestampsNotContainingTypes(
        room._id,
        oldest,
        oldestLoaded.ts,
        hiddenTypes,
        { limit: 1, sort: { ts: 1 } },
        showThreadMessages,
      )
      .toArray();
    const unreadNotLoaded =
      await this.messages.countVisibleByRoomIdBetweenTimestampsNotContainingTypes(
        room._id,
        oldest,
        oldestLoaded.ts,
        hiddenTypes,
        showThreadMessages,
      );

    return { messages, firstUnread, unreadNotLoaded };
  }

  private async getHiddenTypes(
    room: Pick<IRoom, 'sysMes'>,
  ): Promise<MessageTypesValues[]> {
    if (Array.isArray(room.sysMes)) {
      return room.sysMes;
    }

    const hidden =
      (await this.settings.get<MessageTypesValues[]>('Hide_System_Messages')) ??
      [];
    return expandHiddenTypes(hidden);
  }
}
