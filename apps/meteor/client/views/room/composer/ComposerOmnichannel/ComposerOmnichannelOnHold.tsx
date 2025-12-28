import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import type { ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { useResumeChatOnHoldMutation } from './hooks/useResumeChatOnHoldMutation';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

export const ComposerOmnichannelOnHold = (): ReactElement => {
	const resumeChatOnHoldMutation = useResumeChatOnHoldMutation();

	const room = useOmnichannelRoom();

	const { t } = useTranslation();

	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t('chat_on_hold_due_to_inactivity')}</MessageFooterCalloutContent>
			<MessageFooterCalloutAction
				disabled={resumeChatOnHoldMutation.isPending}
				onClick={(): void => resumeChatOnHoldMutation.mutate(room._id)}
			>
				{t('Resume')}
			</MessageFooterCalloutAction>
		</MessageFooterCallout>
	);
};
