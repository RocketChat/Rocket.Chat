import type { IMessage, IRoom } from '@rocket.chat/core-typings';
import type { GenericMenuItemProps } from '@rocket.chat/ui-client';
import { useSetModal, useSetting } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import type { ComposerAPI } from '../../../../../../lib/chats/ChatAPI';
import ScheduleMessageModal from '../../../ScheduleMessageModal';

export const useScheduleMessageAction = (
	disabled: boolean,
	rid: IRoom['_id'],
	composer: ComposerAPI | undefined,
	tmid?: IMessage['_id'],
): GenericMenuItemProps | undefined => {
	const setModal = useSetModal();
	const { t } = useTranslation();
	const enabled = useSetting('Message_AllowScheduling', true);

	if (!enabled) {
		return undefined;
	}

	const handleClick = () => {
		const initialText = composer?.text ?? '';

		setModal(
			<ScheduleMessageModal
				rid={rid}
				tmid={tmid}
				initialText={initialText}
				onClose={() => setModal(null)}
				onScheduled={() => composer?.clear()}
			/>,
		);
	};

	return {
		id: 'schedule-message',
		icon: 'clock',
		content: t('Schedule_message'),
		onClick: handleClick,
		disabled,
	};
};
