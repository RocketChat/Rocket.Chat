import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useFeaturePreview } from '@rocket.chat/ui-client';
import { useSetModal, useTranslation } from '@rocket.chat/ui-contexts';

import { TimestampPicker } from '../../../../../../components/message/toolbar/items/actions/Timestamp/TimestampPicker';
import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';

export const useTimestampAction = (composer: ComposerAPI | undefined): GenericMenuItemProps | undefined => {
	const setModal = useSetModal();
	const t = useTranslation();
	const timestampFeatureEnabled = useFeaturePreview('enable-timestamp-message-parser');

	if (!timestampFeatureEnabled) return undefined;

	const handleClick = () => {
		if (!composer) {
			return;
		}

		setModal(<TimestampPicker onClose={() => setModal(null)} composer={composer} />);
	};

	return {
		id: 'timestamp',
		icon: 'clock',
		content: t('Add_Date_And_Time'),
		onClick: handleClick,
		disabled: false,
	};
};
