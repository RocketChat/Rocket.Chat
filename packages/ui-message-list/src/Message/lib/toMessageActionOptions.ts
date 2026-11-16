import type { IMessage } from '@rocket.chat/core-typings';
import type { TranslationKey } from '@rocket.chat/ui-contexts';

/** The action links of a message, shaped as the buttons `MessageActions` renders. */
export const toMessageActionOptions = (actionLinks: NonNullable<IMessage['actionLinks']>) =>
	actionLinks.map(({ method_id: methodId, i18nLabel, ...action }) => ({
		methodId,
		i18nLabel: i18nLabel as TranslationKey,
		...action,
	}));
