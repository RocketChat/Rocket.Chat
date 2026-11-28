import type { IMessage } from '@rocket.chat/core-typings';
import { getUserDisplayName } from '@rocket.chat/core-typings';

import { settings } from '../../settings';

/** Lists mentioned users the way the mention prompts show them. */
export const formatMentionedUsers = (mentions: NonNullable<IMessage['mentions']>): string => {
	const useRealName = settings.get<boolean>('UI_Use_Real_Name');
	return mentions.map(({ username, name }) => `*${getUserDisplayName(name, username, useRealName)}*`).join(', ');
};
