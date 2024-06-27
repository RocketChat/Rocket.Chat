import type { RoomType } from '@rocket.chat/apps-engine/definition/rooms';

import { getEmojiClassNameAndDataTitle } from '../../client/lib/utils/renderEmoji';

export function parseReaction(reactionText: string, roomtype: RoomType, reactionWithTranslation: string): string {
	let reaction = '';
	if (roomtype === 'd') {
		reaction = `${reactionWithTranslation} ${getEmojiClassNameAndDataTitle(reactionText.trim()).children}`;
	} else {
		const reactionMessage = reactionText.trim().split(' ');
		reaction = `${reactionMessage[0]} ${reactionWithTranslation} ${getEmojiClassNameAndDataTitle(reactionMessage[1].trim()).children}`;
	}
	return reaction;
}
