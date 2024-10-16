import { useStream, useUserId } from '@rocket.chat/ui-contexts';
import { useEffect } from 'react';

import { updateEmojiCustom, deleteEmojiCustom } from '../../../app/emoji-custom/client/lib/emojiCustom';

export const useUpdateCustomEmoji = () => {
	const notify = useStream('notify-logged');
	const uid = useUserId();
	useEffect(() => {
		if (!uid) {
			return;
		}

		const unsubUpdate = notify('updateEmojiCustom', (data) => updateEmojiCustom(data.emojiData));
		const unsubDelete = notify('deleteEmojiCustom', (data) => deleteEmojiCustom(data.emojiData));

		return () => {
			unsubUpdate();
			unsubDelete();
		};
	}, [notify, uid]);
};
