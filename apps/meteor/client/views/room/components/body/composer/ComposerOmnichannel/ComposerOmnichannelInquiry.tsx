import { MessageComposerDisabled, MessageComposerDisabledAction } from '@rocket.chat/ui-composer';
import { useEndpoint, useMethod, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { ReactElement } from 'react';

import { useOmnichannelRoom } from '../../../../contexts/RoomContext';

export const ComposerOmnichannelInquiry = (): ReactElement => {
	const room = useOmnichannelRoom();
	const getInquire = useEndpoint('GET', `/v1/livechat/inquiries.getOne`);
	const result = useQuery(['inquire', room._id], () =>
		getInquire({
			roomId: room._id,
		}),
	);
	const takeInquiry = useMethod('livechat:takeInquiry');

	const t = useTranslation();
	return (
		<footer className='rc-message-box footer'>
			<MessageComposerDisabled aria-busy={result.isLoading}>
				{t('you_are_in_preview_mode_of_incoming_livechat')}
				<MessageComposerDisabledAction
					disabled={result.isLoading}
					onClick={async (): Promise<unknown> => result.isSuccess && takeInquiry(result.data.inquiry._id)}
				>
					{t('Take_it')}
				</MessageComposerDisabledAction>
			</MessageComposerDisabled>
		</footer>
	);
};
