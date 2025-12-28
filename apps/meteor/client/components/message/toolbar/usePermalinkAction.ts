import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import { isE2EEMessage } from '@rocket.chat/core-typings';
import { useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import type { MessageActionConfig, MessageActionContext } from '../../../../app/ui-utils/client/lib/MessageAction';
import { getPermaLink } from '../../../lib/getPermaLink';

export const usePermalinkAction = (
	message: IMessage,
	{ id, context, type, order }: { context: MessageActionContext[]; order: number } & Pick<MessageActionConfig, 'id' | 'type'>,
	{ room }: { room: IRoom },
): MessageActionConfig | null => {
	const { t } = useTranslation();

	const dispatchToastMessage = useToastMessageDispatch();

	const isABACEnabled = !!room.abacAttributes;
	const encrypted = isE2EEMessage(message);
	const tooltip = useMemo(() => {
		if (encrypted) {
			return t('Action_not_available_encrypted_content', { action: t('Copy_link') });
		}
		if (isABACEnabled) {
			return t('Not_available_for_ABAC_enabled_rooms');
		}
		return null;
	}, [encrypted, isABACEnabled, t]);

	return {
		id,
		icon: 'permalink',
		label: 'Copy_link',
		context,
		type,
		async action() {
			try {
				const permalink = await getPermaLink(message._id);
				navigator.clipboard.writeText(permalink);
				dispatchToastMessage({ type: 'success', message: t('Copied') });
			} catch (e) {
				dispatchToastMessage({ type: 'error', message: e });
			}
		},
		order,
		group: 'menu',
		disabled: encrypted || isABACEnabled,
		...(tooltip && { tooltip }),
	};
};
