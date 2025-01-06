import type { ILivechatContactVisitorAssociation } from '@rocket.chat/core-typings';
import { useEndpoint, useSetModal, useToastMessageDispatch } from '@rocket.chat/ui-contexts';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import BlockChannelModal from './BlockChannelModal';
import { useHasLicenseModule } from '../../../../../hooks/useHasLicenseModule';
import AdvancedContactModal from '../../AdvancedContactModal';

export const useBlockChannel = ({ blocked, association }: { blocked: boolean; association: ILivechatContactVisitorAssociation }) => {
	const { t } = useTranslation();
	const setModal = useSetModal();
	const dispatchToastMessage = useToastMessageDispatch();
	const hasLicense = useHasLicenseModule('contact-id-verification') as boolean;
	const queryClient = useQueryClient();

	const blockContact = useEndpoint('POST', '/v1/omnichannel/contacts.block');
	const unblockContact = useEndpoint('POST', '/v1/omnichannel/contacts.unblock');

	const handleUnblock = useCallback(async () => {
		try {
			await unblockContact({ visitor: association });
			dispatchToastMessage({ type: 'success', message: t('Contact_unblocked') });
			queryClient.invalidateQueries({ queryKey: ['getContactById'] });
		} catch (error) {
			dispatchToastMessage({ type: 'error', message: error });
		}
	}, [association, dispatchToastMessage, queryClient, t, unblockContact]);

	const handleBlock = useCallback(() => {
		if (!hasLicense) {
			return setModal(<AdvancedContactModal onCancel={() => setModal(null)} />);
		}

		const blockAction = async () => {
			try {
				await blockContact({ visitor: association });
				dispatchToastMessage({ type: 'success', message: t('Contact_blocked') });
				queryClient.invalidateQueries({ queryKey: ['getContactById'] });
			} catch (error) {
				dispatchToastMessage({ type: 'error', message: error });
			} finally {
				setModal(null);
			}
		};

		setModal(<BlockChannelModal onCancel={() => setModal(null)} onConfirm={blockAction} />);
	}, [association, blockContact, dispatchToastMessage, hasLicense, queryClient, setModal, t]);

	return blocked ? handleUnblock : handleBlock;
};
