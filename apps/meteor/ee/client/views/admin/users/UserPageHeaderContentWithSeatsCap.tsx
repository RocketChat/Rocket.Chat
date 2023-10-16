import { Button, ButtonGroup, Margins } from '@rocket.chat/fuselage';
import { useSetModal, useRoute, useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';
import React from 'react';

import { useExternalLink } from '../../../../../client/hooks/useExternalLink';
import CloseToSeatsCapModal from './CloseToSeatsCapModal';
import ReachedSeatsCapModal from './ReachedSeatsCapModal';
import SeatsCapUsage from './SeatsCapUsage';
import { useRequestSeatsLink } from './useRequestSeatsLink';

type UserPageHeaderContentWithSeatsCapProps = {
	activeUsers: number;
	maxActiveUsers: number;
};

const UserPageHeaderContentWithSeatsCap = ({ activeUsers, maxActiveUsers }: UserPageHeaderContentWithSeatsCapProps): ReactElement => {
	const seatsLinkUrl = useRequestSeatsLink();
	const handleExternalLink = useExternalLink();

	const t = useTranslation();
	const usersRoute = useRoute('admin-users');

	const setModal = useSetModal();
	const closeModal = (): void => setModal(null);

	const isCloseToLimit = (): boolean => {
		const ratio = activeUsers / maxActiveUsers;
		return ratio >= 0.8;
	};

	const hasReachedLimit = (): boolean => {
		const ratio = activeUsers / maxActiveUsers;
		return ratio >= 1;
	};

	const withPreventionOnReachedLimit = (fn: () => void) => (): void => {
		if (typeof seatsLinkUrl !== 'string') {
			return;
		}
		if (hasReachedLimit()) {
			setModal(<ReachedSeatsCapModal members={activeUsers} limit={maxActiveUsers} requestSeatsLink={seatsLinkUrl} onClose={closeModal} />);
			return;
		}

		fn();
	};

	const handleNewButtonClick = withPreventionOnReachedLimit(() => {
		if (typeof seatsLinkUrl !== 'string') {
			return;
		}
		if (isCloseToLimit()) {
			setModal(
				<CloseToSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					title={t('Create_new_members')}
					requestSeatsLink={seatsLinkUrl}
					onConfirm={(): void => {
						usersRoute.push({ context: 'new' });
						closeModal();
					}}
					onClose={closeModal}
				/>,
			);
			return;
		}

		usersRoute.push({ context: 'new' });
	});

	const handleInviteButtonClick = withPreventionOnReachedLimit(() => {
		if (typeof seatsLinkUrl !== 'string') {
			return;
		}
		if (isCloseToLimit()) {
			setModal(
				<CloseToSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					title={t('Invite_Users')}
					requestSeatsLink={seatsLinkUrl}
					onConfirm={(): void => {
						usersRoute.push({ context: 'invite' });
						closeModal();
					}}
					onClose={closeModal}
				/>,
			);
			return;
		}

		usersRoute.push({ context: 'invite' });
	});

	return (
		<>
			<Margins inline={16}>
				<SeatsCapUsage members={activeUsers} limit={maxActiveUsers} />
			</Margins>
			<ButtonGroup>
				<Button icon='user-plus' onClick={handleNewButtonClick}>
					{t('New')}
				</Button>
				<Button icon='mail' onClick={handleInviteButtonClick}>
					{t('Invite')}
				</Button>
				<Button icon='new-window' onClick={() => handleExternalLink(seatsLinkUrl)}>
					{t('Request_seats')}
				</Button>
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContentWithSeatsCap;
