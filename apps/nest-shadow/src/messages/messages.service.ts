import { Injectable } from '@nestjs/common';
import { MeteorError } from '@rocket.chat/core-services';
import type { IMessage, IUser } from '@rocket.chat/core-typings';
import type { AuthenticatedUser } from '../auth/authenticated-user.js';
import {
  type CoreServices,
  InjectCoreService,
} from '../broker/core-services.js';
import { RestV1Failure } from '../common/rest-v1.failure.js';
import { InjectModel, type Models } from '../database/models.js';
import { SettingsService } from '../settings/settings.service.js';
import type { DeleteMessageDto } from './dto/delete-message.dto.js';
import type { ReactToMessageDto } from './dto/react-to-message.dto.js';
import type { SendMessageDto } from './dto/send-message.dto.js';
import type { UpdateMessageDto } from './dto/update-message.dto.js';
import { MessageNormalizerService } from './message-normalizer.service.js';
import { MessagePermissionsService } from './message-permissions.service.js';

// A DTO instance carries every declared field, and an unset one must not reach
// the stored message as null.
const definedFields = <T extends object>(dto: T): Partial<T> =>
  Object.fromEntries(
    Object.entries(dto).filter(([, value]) => value !== undefined),
  ) as Partial<T>;

@Injectable()
export class MessagesService {
  constructor(
    @InjectCoreService('Message')
    private readonly messageService: CoreServices['Message'],
    @InjectCoreService('Authorization')
    private readonly authorization: CoreServices['Authorization'],
    @InjectModel('Messages') private readonly messages: Models['Messages'],
    @InjectModel('Users') private readonly users: Models['Users'],
    private readonly permissions: MessagePermissionsService,
    private readonly normalizer: MessageNormalizerService,
    private readonly settings: SettingsService,
  ) {}

  async getMessage(
    user: AuthenticatedUser,
    msgId: string,
  ): Promise<{ message: IMessage }> {
    const message = await this.messages.findOneById(msgId);
    if (!message?.rid) {
      throw new RestV1Failure();
    }

    if (!(await this.authorization.canAccessRoomId(message.rid, user._id))) {
      throw new MeteorError('error-not-allowed', 'Not allowed', {
        method: 'getSingleMessage',
      });
    }

    return { message: await this.normalizeOne(message, user._id) };
  }

  async sendMessage(
    user: AuthenticatedUser,
    { message: input }: SendMessageDto,
  ): Promise<{ message: IMessage }> {
    const message: Partial<IMessage> = {
      ...definedFields(input),
      ts: new Date(),
    };

    if (message.tshow && !message.tmid) {
      throw new MeteorError(
        'invalid-params',
        'tshow provided but missing tmid',
        {
          method: 'sendMessage',
        },
      );
    }

    if (message.tmid && !(await this.settings.get('Threads_enabled'))) {
      throw new MeteorError('error-not-allowed', 'not-allowed', {
        method: 'sendMessage',
      });
    }

    const maxAllowedSize =
      (await this.settings.get<number>('Message_MaxAllowedSize')) ?? 0;
    if (message.msg && message.msg.length > maxAllowedSize) {
      throw new MeteorError(
        'error-message-size-exceeded',
        'Message size exceeds Message_MaxAllowedSize',
        { method: 'sendMessage' },
      );
    }

    let { rid } = message;

    if (message.tmid) {
      const parent = await this.messages.findOneById(message.tmid, {
        projection: { rid: 1, tmid: 1 },
      });
      message.tmid = parent?.tmid || message.tmid;
      rid = parent?.rid ?? rid;
    }

    if (!rid) {
      throw new Error("The 'rid' property on the message object is missing.");
    }

    const room = await this.permissions.assertCanSendMessage(rid, user);

    if (
      room.encrypted &&
      message.t !== 'e2e' &&
      (await this.settings.get<boolean>('E2E_Enable')) &&
      !(await this.settings.get<boolean>('E2E_Allow_Unencrypted_Messages'))
    ) {
      throw new MeteorError(
        'error-not-allowed',
        'Not allowed to send un-encrypted messages in an encrypted room',
        { method: 'sendMessage' },
      );
    }

    const sent = await this.messageService.sendMessageWithValidation(
      user,
      message,
      room,
    );
    if (!sent) {
      throw new RestV1Failure('The message was not sent.');
    }

    return { message: await this.normalizeOne(sent, user._id) };
  }

  async updateMessage(
    user: AuthenticatedUser,
    { roomId, msgId, text, previewUrls, customFields }: UpdateMessageDto,
  ): Promise<{ message: IMessage }> {
    const original = await this.messages.findOneById(msgId);
    if (!original) {
      throw new RestV1Failure(`No message found with the id of "${msgId}".`);
    }

    if (roomId !== original.rid) {
      throw new RestV1Failure(
        'The room id provided does not match where the message is from.',
      );
    }

    const currentText = original.attachments?.[0]?.description ?? original.msg;
    if (currentText !== text || previewUrls || customFields) {
      await this.permissions.assertCanEditMessage(user, original);

      const edited: Partial<IMessage> = {
        _id: original._id,
        rid: original.rid,
        msg: text,
        u: original.u,
        ...(customFields && { customFields }),
      };

      const [attachment] = original.attachments ?? [];
      if (attachment?.description !== undefined) {
        edited.attachments = [
          { ...attachment, description: text },
          ...(original.attachments ?? []).slice(1),
        ];
        edited.msg = original.msg;
      }

      await this.messageService.updateMessage(
        edited as IMessage,
        user,
        original,
      );
    }

    const updated = await this.messages.findOneById(original._id);
    return {
      message: (updated
        ? await this.normalizeOne(updated, user._id)
        : undefined) as IMessage,
    };
  }

  async deleteMessage(
    user: AuthenticatedUser,
    dto: DeleteMessageDto,
  ): Promise<{
    _id: string;
    ts: string;
    message: Pick<IMessage, '_id' | 'rid' | 'u'>;
  }> {
    const message = dto.fileId
      ? await this.messages.getMessageByFileId(dto.fileId)
      : await this.messages.findOneById(dto.msgId as string, {
          projection: { u: 1, rid: 1 },
        });

    if (!message) {
      throw new RestV1Failure(
        dto.fileId
          ? `No message found with the file id: "${dto.fileId}".`
          : `No message found with the id of "${dto.msgId}".`,
      );
    }

    if (dto.roomId !== undefined && dto.roomId !== message.rid) {
      throw new RestV1Failure(
        'The room id provided does not match where the message is from.',
      );
    }

    if (
      dto.asUser &&
      message.u._id !== user._id &&
      !(await this.authorization.hasPermission(
        user,
        'force-delete-message',
        message.rid,
      ))
    ) {
      throw new RestV1Failure(
        'Unauthorized. You must have the permission "force-delete-message" to delete other\'s message as them.',
      );
    }

    const deletingUser = await this.users.findOneById<IUser>(
      dto.asUser ? message.u._id : user._id,
    );
    if (!deletingUser) {
      throw new RestV1Failure('User not found');
    }

    const original = await this.messages.findOneById(message._id);
    if (
      !original ||
      !(await this.permissions.canDeleteMessage(deletingUser, original))
    ) {
      throw new MeteorError('error-action-not-allowed', 'Not allowed');
    }

    await this.messageService.deleteMessage(deletingUser, original);

    return {
      _id: message._id,
      ts: Date.now().toString(),
      message: { _id: message._id, rid: message.rid, u: message.u },
    };
  }

  async reactToMessage(
    user: AuthenticatedUser,
    dto: ReactToMessageDto,
  ): Promise<void> {
    const message = await this.messages.findOneById(dto.messageId, {
      projection: { _id: 1 },
    });
    if (!message) {
      throw new MeteorError(
        'error-message-not-found',
        'The provided "messageId" does not match any existing message.',
      );
    }

    const emoji = dto.emoji ?? dto.reaction;
    if (!emoji) {
      throw new MeteorError(
        'error-emoji-param-not-provided',
        'The required "emoji" param is missing.',
      );
    }

    await this.messageService.reactToMessage(
      user._id,
      emoji,
      message._id,
      dto.shouldReact,
    );
  }

  private async normalizeOne(
    message: IMessage,
    uid: string,
  ): Promise<IMessage> {
    const [normalized] = await this.normalizer.normalize([message], uid);
    return normalized;
  }
}
