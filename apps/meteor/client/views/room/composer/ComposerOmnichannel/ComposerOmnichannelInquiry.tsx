import { MessageFooterCallout, MessageFooterCalloutAction, MessageFooterCalloutContent } from '@rocket.chat/ui-composer';
import { useEndpoint, useMethod, useToastMessageDispatch, useTranslation, useUser } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement } from 'react';
import { useMemo } from 'react';

import { useOmnichannelAgentAvailable } from '../../../../hooks/omnichannel/useOmnichannelAgentAvailable';
import { useOmnichannelRoom } from '../../contexts/RoomContext';

export const ComposerOmnichannelInquiry = (): ReactElement => {
	const t = useTranslation();
	const dispatchToastMessage = useToastMessageDispatch();
	const user = useUser();
	const agentAvailable = useOmnichannelAgentAvailable();
	const room = useOmnichannelRoom();
	const getInquire = useEndpoint('GET', `/v1/livechat/inquiries.getOne`);
	const result = useQuery({
		queryKey: ['inquire', room._id],

		queryFn: () =>
			getInquire({
				roomId: room._id,
			}),
	});

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

	const title = useMemo(() => {
		if (user?.status === 'offline') {
			return t('You_cant_take_chats_offline');
		}

		if (!agentAvailable) {
			return t('You_cant_take_chats_unavailable');
		}
	}, [agentAvailable, t, user?.status]);

	return (
		<MessageFooterCallout aria-busy={result.isPending}>
			<MessageFooterCalloutContent>{t('you_are_in_preview_mode_of_incoming_livechat')}</MessageFooterCalloutContent>
			<MessageFooterCalloutAction
				{...(title && { title })}
				disabled={result.isPending || user?.status === 'offline' || !agentAvailable}
				onClick={handleTakeInquiry}
			>
				{t('Take_it')}
			</MessageFooterCalloutAction>
		</MessageFooterCallout>
	);
};
