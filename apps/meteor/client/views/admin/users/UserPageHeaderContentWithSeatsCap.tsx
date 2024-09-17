import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { useSetModal, useTranslation, useRouter, useSetting } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../subscription/hooks/useCheckoutUrl';
import SeatsCapUsage from './SeatsCapUsage';
import AssignExtensionModal from './voip/AssignExtensionModal';

type UserPageHeaderContentWithSeatsCapProps = {
	activeUsers: number;
	maxActiveUsers: number;
	isSeatsCapExceeded: boolean;
};

const UserPageHeaderContentWithSeatsCap = ({
	isSeatsCapExceeded,
	activeUsers,
	maxActiveUsers,
}: UserPageHeaderContentWithSeatsCapProps): ReactElement => {
	const t = useTranslation();
	const router = useRouter();
	const setModal = useSetModal();

	const canRegisterExtension = useSetting('VoIP_TeamCollab_Enabled');

	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });
	const openExternalLink = useExternalLink();

	const handleNewButtonClick = () => {
		router.navigate('/admin/users/new');
	};

	const handleInviteButtonClick = () => {
		router.navigate('/admin/users/invite');
	};

	return (
		<>
			<Margins inline={16}>
				<SeatsCapUsage members={activeUsers} limit={maxActiveUsers} />
			</Margins>
			<ButtonGroup>
				{canRegisterExtension && (
					<Button icon='phone' onClick={(): void => setModal(<AssignExtensionModal onClose={(): void => setModal(null)} />)}>
						{t('Assign_extension')}
					</Button>
				)}
				<Button icon='mail' onClick={handleInviteButtonClick} disabled={isSeatsCapExceeded}>
					{t('Invite')}
				</Button>
				<Button icon='user-plus' onClick={handleNewButtonClick} disabled={isSeatsCapExceeded}>
					{t('New_user')}
				</Button>
				{isSeatsCapExceeded && (
					<Button primary role='link' onClick={() => openExternalLink(manageSubscriptionUrl)}>
						{t('Buy_more_seats')}
					</Button>
				)}
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContentWithSeatsCap;
