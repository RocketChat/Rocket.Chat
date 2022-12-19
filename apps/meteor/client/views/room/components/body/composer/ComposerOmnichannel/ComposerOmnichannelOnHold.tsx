import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useOmnichannelRoom } from '../../../../contexts/RoomContext';
import { useResumeChatOnHoldMutation } from './hooks/useResumeChatOnHoldMutation';

export const ComposerOmnichannelOnHold = (): ReactElement => {
	const resumeChatOnHoldMutation = useResumeChatOnHoldMutation();

	const room = useOmnichannelRoom();

	const t = useTranslation();

	return (
		<footer className='rc-message-box footer'>
			<MessageFooterCallout>
				<MessageFooterCalloutContent>{t('chat_on_hold_due_to_inactivity')}</MessageFooterCalloutContent>
				<MessageFooterCalloutAction
					disabled={resumeChatOnHoldMutation.isLoading}
					onClick={(): void => resumeChatOnHoldMutation.mutate(room._id)}
				>
					{t('Resume')}
				</MessageFooterCalloutAction>
			</MessageFooterCallout>
		</footer>
	);
};
