import type { IMessage, ISubscription, ITranslatedMessage } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';
import { useCallback, useMemo } from 'react';

import { AutoTranslate } from '../../../../../app/autotranslate/client';
import { roomCoordinator } from '../../../../lib/rooms/roomCoordinator';
import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../lib/autoTranslate';
import { isOwnUserMessage } from '../lib/isOwnUserMessage';

export type AutoTranslateOptions = {
	autoTranslateEnabled: boolean;
	autoTranslateLanguage?: string;
	showAutoTranslate: (message: IMessage & Partial<ITranslatedMessage>) => boolean;
};

export const useAutoTranslate = (subscription?: ISubscription): AutoTranslateOptions => {
	const autoTranslateSettingEnabled = Boolean(useSetting('AutoTranslate_Enabled'));
	const isSubscriptionEnabled = autoTranslateSettingEnabled && subscription?.autoTranslateLanguage && subscription?.autoTranslate;
	const isLivechatRoom = useMemo(() => subscription && roomCoordinator.isLivechatRoom(subscription?.t), [subscription]);
	const autoTranslateEnabled = Boolean(isSubscriptionEnabled || isLivechatRoom);
	const autoTranslateLanguage = autoTranslateEnabled && subscription ? AutoTranslate.getLanguage(subscription.rid) : undefined;

	const showAutoTranslate = useCallback(
		(message: IMessage): boolean => {
			if (!autoTranslateEnabled || !autoTranslateLanguage) {
				return false;
			}

			return (
				!isOwnUserMessage(message, subscription) &&
				!(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse &&
				(hasTranslationLanguageInMessage(message, autoTranslateLanguage) ||
					hasTranslationLanguageInAttachments(message.attachments, autoTranslateLanguage))
			);
		},
		[subscription, autoTranslateEnabled, autoTranslateLanguage],
	);

	return useMemo(() => {
		return { autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate };
	}, [autoTranslateEnabled, autoTranslateLanguage, showAutoTranslate]);
};
