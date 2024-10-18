import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import BlockChannelModal from './BlockChannelModal';

export const useBlockChannel = ({ blocked, visitorId }: { blocked: boolean; visitorId: string }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const queryClient = useQueryClient();

	const blockContact = useEndpoint('POST', '/v1/omnichannel/contacts.block');
	const unblockContact = useEndpoint('POST', '/v1/omnichannel/contacts.unblock');

	const handleUnblock = async () => {
		try {
			await unblockContact({ visitorId });
			dispatchToastMessage({ type: 'success', message: t('Contact_unblocked') });
			queryClient.invalidateQueries(['getContactById']);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleBlock = () => {
		const blockAction = async () => {
			try {
				await blockContact({ visitorId });
				dispatchToastMessage({ type: 'success', message: t('Contact_blocked') });
				queryClient.invalidateQueries(['getContactById']);
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<BlockChannelModal onCancel={() => setModal(null)} onConfirm={blockAction} />);
	};

	return blocked ? handleUnblock : handleBlock;
};
