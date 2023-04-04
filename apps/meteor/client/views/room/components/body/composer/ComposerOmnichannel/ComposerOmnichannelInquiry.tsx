import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useMethod, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import React from 'react';

import { useOmnichannelRoom } from '../../../../contexts/RoomContext';

export const ComposerOmnichannelInquiry = (): ReactElement => {
	const dispatchToastMessage = useToastMessageDispatch();

	const room = useOmnichannelRoom();
	const getInquire = useEndpoint('GET', `/v1/livechat/inquiries.getOne`);
	const result = useQuery(['inquire', room._id], () =>
		getInquire({
			roomId: room._id,
		}),
	);
	const takeInquiry = useMethod('livechat:takeInquiry');

	const handleTakeInquiry = async (): Promise<void> => {
		if (!result.isSuccess) {
			return;
		}
		if (!result.data.inquiry) {
			return;
		}
		try {
			await takeInquiry(result.data.inquiry._id, { clientAction: true });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const t = useTranslation();
	return (
		<footer className='rc-message-box footer'>
			<MessageFooterCallout aria-busy={result.isLoading}>
				<MessageFooterCalloutContent>{t('you_are_in_preview_mode_of_incoming_livechat')}</MessageFooterCalloutContent>
				<MessageFooterCalloutAction disabled={result.isLoading} onClick={handleTakeInquiry}>
					{t('Take_it')}
				</MessageFooterCalloutAction>
			</MessageFooterCallout>
		</footer>
	);
};
