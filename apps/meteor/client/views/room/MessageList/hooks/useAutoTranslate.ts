import type { IMessage, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { AutoTranslate } from '../../../../lib/autotranslate';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../lib/autoTranslate';

export type AutoTranslateOptions = {
	autoTranslateEnabled: boolean;
	autoTranslateLanguage?: string;
	showAutoTranslate: (message: IMessage & Partial<ITranslatedMessage>) => boolean;
};

export const useAutoTranslate = (subscription?: ISubscription): AutoTranslateOptions => {
	const autoTranslateSettingEnabled = useSetting('AutoTranslate_Enabled', false);
	const isSubscriptionEnabled = autoTranslateSettingEnabled && subscription?.autoTranslateLanguage && subscription?.autoTranslate;
	const roomType = subscription?.t;
	const rid = subscription?.rid;
	const subscriptionUserId = subscription?.u._id;
	const isLivechatRoom = useMemo(() => !!roomType && roomCoordinator.isLivechatRoom(roomType), [roomType]);
	const autoTranslateEnabled = Boolean(isSubscriptionEnabled || isLivechatRoom);
	const autoTranslateLanguage = autoTranslateEnabled && rid ? AutoTranslate.getLanguage(rid) : undefined;

	const showAutoTranslate = useCallback(
		(message: IMessage): boolean => {
			if (!autoTranslateEnabled || !autoTranslateLanguage) {
				return false;
			}

			return (
				message.u._id !== subscriptionUserId &&
				!(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse &&
				(hasTranslationLanguageInMessage(message, autoTranslateLanguage) ||
					hasTranslationLanguageInAttachments(message.attachments, autoTranslateLanguage))
			);
		},
		[subscriptionUserId, autoTranslateEnabled, autoTranslateLanguage],
	);

	return useMemo(() => {
		return { autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate };
	}, [autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate]);
};
