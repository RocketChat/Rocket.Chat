import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useTranslation } from 'react-i18next';

import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';
import { useComposerMenuActions } from '../../../ComposerMenuActionsContext';

export const useTimestampAction = (disabled: boolean, composer: ComposerAPI | undefined): GenericMenuItemProps | undefined => {
	const { insertTimestamp } = useComposerMenuActions();
	const { t } = useTranslation();

	const handleClick = () => {
		if (!composer) {
			return;
		}

		insertTimestamp(composer);
	};

	return {
		id: 'timestamp',
		icon: 'clock',
		content: t('Timestamp'),
		onClick: handleClick,
		disabled,
	};
};
