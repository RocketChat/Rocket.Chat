import i18next from 'i18next';
import { getEmojiClassNameAndDataTitle } from '../../client/lib/utils/renderEmoji';

const translateReactedWith = ()=>{
	if(i18next.t('Reacted_with') === 'Reacted_with'){
		return 'Reacted with';
	}
	return i18next.t('Reacted_with');
}

export function parseReaction(msg: string, emoji: string): string {
	return `${translateReactedWith()} ${getEmojiClassNameAndDataTitle(emoji.trim()).children} \n msg : "${msg}"`;
}
