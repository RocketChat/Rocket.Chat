import type { IMessage } from '@rocket.chat/core-typings';
import { isE2EEMessage, isVideoConfMessage } from '@rocket.chat/core-typings';
import { escapeHTML } from '@rocket.chat/tools';
import type { TFunction } from 'i18next';

import { normalizeMessagePreview } from '../../lib/utils/normalizeMessagePreview/normalizeMessagePreview';

/** A message as the card previews it: plain text, as escaped HTML, with the same placeholders the sidebar preview uses. */
export const getHoverCardMessagePreview = (message: IMessage, t: TFunction): string => {
	if (isVideoConfMessage(message)) {
		return escapeHTML(t('Call_started'));
	}

	if (isE2EEMessage(message) && message.e2e !== 'done') {
		return escapeHTML(t('Encrypted_message_preview_unavailable'));
	}

	return normalizeMessagePreview(message, t) ?? '';
};
