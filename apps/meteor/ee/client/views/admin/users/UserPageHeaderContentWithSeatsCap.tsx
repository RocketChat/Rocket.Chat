import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { useTranslation, useRouter } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useShouldPreventAction } from '../../../../../client/hooks/useShouldPreventAction';
import { useCheckoutUrl } from '../../../../../client/views/admin/subscription/hooks/useCheckoutUrl';
import SeatsCapUsage from './SeatsCapUsage';

type UserPageHeaderContentWithSeatsCapProps = {
	activeUsers: number;
	maxActiveUsers: number;
};

const UserPageHeaderContentWithSeatsCap = ({ activeUsers, maxActiveUsers }: UserPageHeaderContentWithSeatsCapProps): ReactElement => {
	const isCreateUserDisabled = useShouldPreventAction('activeUsers');

	const t = useTranslation();
	const router = useRouter();

	const manageSubscriptionUrl = useCheckoutUrl()({ target: 'user-page', action: 'buy_more' });

	const withReachedLimit = (fn: () => void) => (): void => {
		if (isCreateUserDisabled) {
			router.navigate('/admin/users/upgrade');
			return;
		}

		fn();
	};

	const handleNewButtonClick = withReachedLimit(() => {
		router.navigate('/admin/users/new');
	});

	const handleInviteButtonClick = withReachedLimit(() => {
		router.navigate('/admin/users/invite');
	});

	return (
		<>
			<Margins inline={16}>
				<SeatsCapUsage members={activeUsers} limit={maxActiveUsers} />
			</Margins>
			<ButtonGroup>
				<Button icon='mail' onClick={handleInviteButtonClick}>
					{t('Invite')}
				</Button>
				<Button icon='user-plus' onClick={handleNewButtonClick}>
					{t('New_user')}
				</Button>
				{isCreateUserDisabled && (
					<Button mis={8} is='a' href={manageSubscriptionUrl} target='_blank' rel='noopener noreferrer' primary>
						{t('Buy_more_seats')}
					</Button>
				)}
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContentWithSeatsCap;
