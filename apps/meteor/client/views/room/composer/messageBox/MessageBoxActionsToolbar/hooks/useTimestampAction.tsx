import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useSetModal } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { TimestampPickerModal } from '../../../../../../components/message/toolbar/items/actions/Timestamp/TimestampPicker/TimestampPickerModal';
import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';

export const useTimestampAction = (composer: ComposerAPI | undefined): GenericMenuItemProps | undefined => {
	const setModal = useSetModal();
	const { t } = useTranslation();
	const timestampFeatureEnabled = useFeaturePreview('enable-timestamp-message-parser');

	if (!timestampFeatureEnabled) {
		return;
	}

	const handleClick = () => {
		if (!composer) {
			return;
		}

		setModal(<TimestampPickerModal onClose={() => setModal(null)} composer={composer} />);
	};

	return {
		id: 'timestamp',
		icon: 'clock',
		content: t('Timestamp'),
		onClick: handleClick,
	};
};
