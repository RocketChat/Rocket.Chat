import type { IMessage, IRoom, ISubscription } from '@rocket.chat/core-typings';
import { useMemo } from 'react';

import type { MessageActionConfig } from '../../../lib/MessageAction';
import { AutoTranslate } from '../../../lib/autotranslate';
import { roomCoordinator } from '../../../lib/rooms/roomCoordinator';
import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../../../views/room/MessageList/lib/autoTranslate';
import { useMessageActions, useMessageActionsPolicy } from '../list/MessageListContext';

export const useViewOriginalTranslationAction = (
	message: IMessage & { autoTranslateShowInverse?: boolean },
	{ room, subscription }: { room: IRoom; subscription: ISubscription | undefined },
): MessageActionConfig | null => {
	const policy = useMessageActionsPolicy();
	const { user } = policy;
	const autoTranslateEnabled = policy.settings.autoTranslateEnabled ?? false;
	const canAutoTranslate = policy.permissions.autoTranslate;
	const actions = useMessageActions();

	const language = useMemo(
		() => subscription?.autoTranslateLanguage || AutoTranslate.getLanguage(message.rid),
		[message.rid, subscription?.autoTranslateLanguage],
	);
	const hasTranslations = useMemo(
		() => hasTranslationLanguageInMessage(message, language) || hasTranslationLanguageInAttachments(message.attachments, language),
		[message, language],
	);

	if (!autoTranslateEnabled || !canAutoTranslate || !user) {
		return null;
	}

	const isLivechatRoom = roomCoordinator.isLivechatRoom(room?.t);
	const isDifferentUser = message?.u && message.u._id !== user._id;
	const autoTranslationActive = subscription?.autoTranslate || isLivechatRoom;

	if (message.autoTranslateShowInverse || !isDifferentUser || !autoTranslationActive || !hasTranslations) {
		return null;
	}

	return {
		id: 'view-original',
		icon: 'language',
		label: 'View_original',
		context: ['message', 'message-mobile', 'threads'],
		type: 'interaction',
		group: 'menu',
		action() {
			actions.toggleTranslation(message, language, hasTranslations);
		},
		order: 90,
	};
};
