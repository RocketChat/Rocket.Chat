import { Injectable } from '@nestjs/common';
import type { IMessage } from '@rocket.chat/core-typings';
import { InjectModel, type Models } from '../database/models.js';
import { SettingsService } from '../settings/settings.service.js';

type NormalizableMessage = Pick<
  IMessage,
  'u' | 'starred' | 'mentions' | 'reactions'
>;

// Prepares messages for the user that reads them: only their own star is
// visible, and names follow the UI_Use_Real_Name setting.
@Injectable()
export class MessageNormalizerService {
  constructor(
    private readonly settings: SettingsService,
    @InjectModel('Users') private readonly users: Models['Users'],
  ) {}

  async normalize<T extends NormalizableMessage>(
    messages: T[],
    uid: string,
  ): Promise<T[]> {
    for (const message of messages) {
      if (Array.isArray(message.starred)) {
        message.starred = message.starred.filter((star) => star._id === uid);
      }
    }

    if (!(await this.settings.get<boolean>('UI_Use_Real_Name'))) {
      return messages;
    }

    const usernames = new Set<string>();
    for (const message of messages) {
      if (!message.u?.username) {
        continue;
      }
      usernames.add(message.u.username);
      message.mentions?.forEach(
        ({ username }) => username && usernames.add(username),
      );
      Object.values(message.reactions ?? {}).forEach((reaction) =>
        reaction.usernames.forEach((username) => usernames.add(username)),
      );
    }

    const names = new Map<string, string | undefined>();
    const users = await this.users
      .findUsersByUsernames([...usernames], {
        projection: { username: 1, name: 1 },
      })
      .toArray();
    users.forEach((user) => names.set(user.username as string, user.name));

    const nameOf = (username: string): string =>
      names.get(username) || username;

    for (const message of messages) {
      if (!message.u) {
        continue;
      }
      message.u.name = nameOf(message.u.username);
      message.mentions?.forEach((mention) => {
        if (mention.username) {
          mention.name = nameOf(mention.username);
        }
      });
      Object.values(message.reactions ?? {}).forEach((reaction) => {
        reaction.names = reaction.usernames.map(nameOf);
      });
    }

    return messages;
  }
}
