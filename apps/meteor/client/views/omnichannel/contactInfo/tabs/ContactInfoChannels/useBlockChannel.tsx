import type { ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { useEndpoint, useSetModal, useToastMessageDispatch, useTranslation } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import AdvancedContactModal from '../../AdvancedContactModal';
import BlockChannelModal from './BlockChannelModal';

export const useBlockChannel = ({ blocked, association }: { blocked: boolean; association: ILivechatContactVisitorAssociation }) => {
	const t = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const queryClient = useQueryClient();

	const blockContact = useEndpoint('POST', '/v1/omnichannel/contacts.block');
	const unblockContact = useEndpoint('POST', '/v1/omnichannel/contacts.unblock');

	const handleUnblock = async () => {
		try {
			await unblockContact({ visitor: association });
			dispatchToastMessage({ type: 'success', message: t('Contact_unblocked') });
			queryClient.invalidateQueries(['getContactById']);
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	};

	const handleBlock = () => {
		if (!hasLicense) {
			return setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}

		const blockAction = async () => {
			try {
				await blockContact({ visitor: association });
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
