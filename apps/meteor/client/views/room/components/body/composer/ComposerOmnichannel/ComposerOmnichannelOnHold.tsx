import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement } from 'react';

import { useOmnichannelRoom } from '../../../../contexts/RoomContext';

export const ComposerOmnichannelOnHold = (): ReactElement => {
	const resume = useMethod('livechat:resumeOnHold');
	const room = useOmnichannelRoom();
	const t = useTranslation();
	return (
		<footer className='rc-message-box footer'>
			<MessageFooterCallout>
				<MessageFooterCalloutContent>{t('chat_on_hold_due_to_inactivity')}</MessageFooterCalloutContent>
				<MessageFooterCalloutAction onClick={(): Promise<unknown> => resume(room._id, { clientAction: true })}>
					{t('Resume')}
				</MessageFooterCalloutAction>
			</MessageFooterCallout>
		</footer>
	);
};
