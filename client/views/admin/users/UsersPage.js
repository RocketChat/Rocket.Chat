import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import React from 'react';

import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useSetModal } from '../../../contexts/ModalContext';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { AddUser } from './AddUser';
import CloseToLimitModal from './CloseToLimitModal';
import EditUserWithData from './EditUserWithData';
import { InviteUsers } from './InviteUsers';
import MemberCapUsage from './MemberCapUsage';
import ReachedLimitModal from './ReachedLimitModal';
import { UserInfoWithData } from './UserInfo';
import UsersTable from './UsersTable';
import { useSeatsData } from './useSeatsData';

function UsersPage() {
	const t = useTranslation();

	const usersRoute = useRoute('admin-users');

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};

	const setModal = useSetModal();

	const [, { context, id }] = useCurrentRoute();

	const { members, limit } = useSeatsData();

	const percentage = (100 / limit) * members;

	const closeToLimit = percentage >= 80;
	const reachedLimit = percentage >= 100;

	const closeModal = () => setModal();

	const handleLimitModal = (action, actionType = 'add') => {
		if (reachedLimit) {
			return setModal(<ReachedLimitModal members={members} limit={limit} onClose={closeModal} />);
		}
		if (closeToLimit) {
			if (actionType === 'add') {
				return setModal(
					<CloseToLimitModal
						members={members}
						limit={limit}
						title={t('Create_new_members')}
						confirmText={t('Create')}
						confirmIcon={'user-plus'}
						onConfirm={action}
						onClose={closeModal}
					/>,
				);
			}
			setModal(
				<CloseToLimitModal
					members={members}
					limit={limit}
					title={t('Invite_Users')}
					confirmText={t('Invite')}
					confirmIcon={'mail'}
					onConfirm={action}
					onClose={closeModal}
				/>,
			);
		}
	};

	const handleNewButtonClick = () => {
		const action = () => usersRoute.push({ context: 'new' });
		if (closeToLimit) {
			return handleLimitModal(() => {
				action();
				closeModal();
			});
		}
		action();
	};

	const handleInviteButtonClick = () => {
		const action = usersRoute.push({ context: 'invite' });
		if (closeToLimit) {
			return handleLimitModal(() => {
				action();
				closeModal();
			}, 'invite');
		}
		action();
	};

	const handleRequestSeats = () => {
		console.log('request seats');
	};

	const shouldShowVerticalBar = !reachedLimit || context !== 'new' || context !== 'invite';

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					<ButtonGroup>
						{limit !== 0 && <MemberCapUsage members={members} limit={limit} />}
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
				</Page.Header>
				<Page.Content>
					<UsersTable />
				</Page.Content>
			</Page>
			{context && shouldShowVerticalBar && (
				<VerticalBar>
					<VerticalBar.Header>
						{context === 'info' && t('User_Info')}
						{context === 'edit' && t('Edit_User')}
						{context === 'new' && t('Add_User')}
						{context === 'invite' && t('Invite_Users')}
						<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
					</VerticalBar.Header>

					{context === 'info' && <UserInfoWithData uid={id} />}
					{context === 'edit' && <EditUserWithData uid={id} />}
					{context === 'new' && <AddUser />}
					{context === 'invite' && <InviteUsers />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default UsersPage;
