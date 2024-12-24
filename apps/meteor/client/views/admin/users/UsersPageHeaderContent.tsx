import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { usePermission, useRouter } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import SeatsCapUsage from './SeatsCapUsage';
import type { SeatCapProps } from './useSeatsCap';
import AssignExtensionButton from './voip/AssignExtensionButton';
import { useExternalLink } from '../../../hooks/useExternalLink';
import { useCheckoutUrl } from '../subscription/hooks/useCheckoutUrl';
import { useVoipExtensionPermission } from './voip/hooks/useVoipExtensionPermission';

type UsersPageHeaderContentProps = {
	isSeatsCapExceeded: boolean;
	seatsCap?: Omit<SeatCapProps, 'reload'>;
};

const UsersPageHeaderContent = ({ isSeatsCapExceeded, seatsCap }: UsersPageHeaderContentProps) => {
	const { t } = useTranslation();
	const router = useRouter();
	const canCreateUser = usePermission('create-user');
	const canBulkCreateUser = usePermission('bulk-register-user');
	const canManageVoipExtension = useVoipExtensionPermission();

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
			{seatsCap && seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY && (
				<Margins inline={16}>
					<SeatsCapUsage members={seatsCap.activeUsers} limit={seatsCap.maxActiveUsers} />
				</Margins>
			)}
			<ButtonGroup>
				{canManageVoipExtension && <AssignExtensionButton />}

				{canBulkCreateUser && (
					<Button icon='mail' onClick={handleInviteButtonClick} disabled={isSeatsCapExceeded}>
						{t('Invite')}
					</Button>
				)}

				{canCreateUser && (
					<Button icon='user-plus' onClick={handleNewButtonClick} disabled={isSeatsCapExceeded}>
						{t('New_user')}
					</Button>
				)}

				{isSeatsCapExceeded && (
					<Button primary role='link' onClick={() => openExternalLink(manageSubscriptionUrl)}>
						{t('Buy_more_seats')}
					</Button>
				)}
			</ButtonGroup>
		</>
	);
};

export default UsersPageHeaderContent;
