import { Button, ButtonGroup, Icon, Margins } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import CloseToSeatsCapModal from './CloseToSeatsCapModal';
import ReachedSeatsCapModal from './ReachedSeatsCapModal';
import SeatsCapUsage from './SeatsCapUsage';

type UserPageHeaderContentWithSeatsCapProps = {
	activeUsers: number;
	maxActiveUsers: number;
};

const UserPageHeaderContentWithSeatsCap = ({
	activeUsers,
	maxActiveUsers,
}: UserPageHeaderContentWithSeatsCapProps): ReactElement => {
	// TODO
	const requestSeatsLink = '';

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
		if (hasReachedLimit()) {
			setModal(
				<ReachedSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					requestSeatsLink={requestSeatsLink}
					onClose={closeModal}
				/>,
			);
			return;
		}

		fn();
	};

	const handleNewButtonClick = withPreventionOnReachedLimit(() => {
		if (isCloseToLimit()) {
			setModal(
				<CloseToSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					title={t('Create_new_members')}
					confirmText={t('Create')}
					confirmIcon='user-plus'
					requestSeatsLink={requestSeatsLink}
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
		if (isCloseToLimit()) {
			setModal(
				<CloseToSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					title={t('Invite_Users')}
					confirmText={t('Invite')}
					confirmIcon='mail'
					requestSeatsLink={requestSeatsLink}
					onConfirm={(): void => {
						usersRoute.push({ context: 'invite' });
						closeModal();
					}}
					onClose={closeModal}
				/>,
			);
		}

		usersRoute.push({ context: 'invite' });
	});

	const handleRequestSeats = (): void => {
		// TODO
		console.log('request seats');
	};

	return (
		<>
			<Margins inline='x8'>
				<SeatsCapUsage members={activeUsers} limit={maxActiveUsers} />
			</Margins>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick}>
					<Icon size='x20' name='user-plus' /> {t('New')}
				</Button>
				<Button onClick={handleInviteButtonClick}>
					<Icon size='x20' name='mail' /> {t('Invite')}
				</Button>
				<Button onClick={handleRequestSeats}>
					<Icon size='x20' name='new-window' /> {t('Request_seats')}
				</Button>
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContentWithSeatsCap;
