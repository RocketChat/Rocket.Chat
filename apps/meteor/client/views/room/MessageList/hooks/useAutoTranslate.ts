import type { IMessage, ISubscription } from '@rocket.chat/core-typings';
import { useSetting } from '@rocket.chat/ui-contexts';

import { hasTranslationLanguageInAttachments, hasTranslationLanguageInMessage } from '../lib/autoTranslate';
import { isOwnUserMessage } from '../lib/isOwnUserMessage';

export type AutoTranslateOptions = {
	autoTranslateEnabled: boolean;
	autoTranslateLanguage?: string;
	showAutoTranslate: (message: IMessage) => boolean;
};

export const useAutoTranslate = (subscription?: ISubscription): AutoTranslateOptions => {
	const autoTranslateSettingEnabled = Boolean(useSetting('AutoTranslate_Enabled'));
	const autoTranslateEnabled = Boolean(autoTranslateSettingEnabled && subscription?.autoTranslateLanguage && subscription?.autoTranslate);
	const autoTranslateLanguage = autoTranslateEnabled ? subscription?.autoTranslateLanguage : undefined;

	return {
		autoTranslateEnabled,
		autoTranslateLanguage,
		showAutoTranslate: autoTranslateEnabled
			? (message: IMessage): boolean =>
					!isOwnUserMessage(message, subscription) &&
					!!autoTranslateLanguage &&
					!(message as { autoTranslateShowInverse?: boolean }).autoTranslateShowInverse &&
					(hasTranslationLanguageInMessage(message, autoTranslateLanguage) ||
						hasTranslationLanguageInAttachments(message.attachments, autoTranslateLanguage))
			: (): boolean => false,
	};
};
