import { Button, ButtonGroup, Icon, Margins } from '@rocket.chat/fuselage';
import React, { ReactElement } from 'react';

import ExternalLink from '../../../../../client/components/ExternalLink';
import { useSetModal } from '../../../../../client/contexts/ModalContext';
import { useRoute } from '../../../../../client/contexts/RouterContext';
import { useTranslation } from '../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../client/hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../../client/lib/asyncState';
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
	const { value, phase } = useEndpointData('licenses.requestSeatsLink');

	const seatsLinkUrl = value?.url;

	const disableButtons = !seatsLinkUrl || AsyncStatePhase.LOADING === phase;

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
			setModal(
				<ReachedSeatsCapModal
					members={activeUsers}
					limit={maxActiveUsers}
					requestSeatsLink={seatsLinkUrl}
					onClose={closeModal}
				/>,
			);
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
					confirmText={t('Create')}
					confirmIcon='user-plus'
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
					confirmText={t('Invite')}
					confirmIcon='mail'
					requestSeatsLink={seatsLinkUrl}
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

	return (
		<>
			<Margins inline='x8'>
				<SeatsCapUsage members={activeUsers} limit={maxActiveUsers} />
			</Margins>
			<ButtonGroup>
				<Button onClick={handleNewButtonClick} disabled={disableButtons}>
					<Icon size='x20' name='user-plus' /> {t('New')}
				</Button>
				<Button onClick={handleInviteButtonClick} disabled={disableButtons}>
					<Icon size='x20' name='mail' /> {t('Invite')}
				</Button>
				<ExternalLink to={seatsLinkUrl || ''}>
					<Button disabled={disableButtons}>
						<Icon size='x20' name='new-window' /> {t('Request_seats')}
					</Button>
				</ExternalLink>
			</ButtonGroup>
		</>
	);
};

export default UserPageHeaderContentWithSeatsCap;
