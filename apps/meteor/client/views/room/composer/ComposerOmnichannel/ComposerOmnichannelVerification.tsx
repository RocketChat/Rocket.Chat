import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
// useToastMessageDispatch,
import type { ReactElement } from 'react';
import React from 'react';

import { useOmnichannelRoom } from '../../contexts/RoomContext';

export const ComposerOmnichannelVerification = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const room = useOmnichannelRoom();

	const cancelVerification = useEndpoint('PUT', `/v1/livechat/room.verificationStatus`);
	const handleCancelVerification = async (): Promise<void> => {
		try {
			await cancelVerification({ roomId: room._id });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};
	return (
		<MessageFooterCallout>
			<MessageFooterCalloutContent>{t('This_conversation_is_currently_undergoing_a_verification_process')}</MessageFooterCalloutContent>
			<MessageFooterCalloutAction onClick={handleCancelVerification}>{t('Cancel')}</MessageFooterCalloutAction>
		</MessageFooterCallout>
	);
};
