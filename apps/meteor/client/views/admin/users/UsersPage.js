import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useRoute, useRouteParameter, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useEffect, useMemo, useState } from 'react';

import UserPageHeaderContentWithSeatsCap from '../../../../ee/client/views/admin/users/UserPageHeaderContentWithSeatsCap';
import { useSeatsCap } from '../../../../ee/client/views/admin/users/useSeatsCap';
import Page from '../../../components/Page';
import VerticalBar from '../../../components/VerticalBar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AddUser } from './AddUser';
import EditUserWithData from './EditUserWithData';
import { InviteUsers } from './InviteUsers';
import { UserInfoWithData } from './UserInfo';
import UserPageHeaderContent from './UserPageHeaderContent';
import UsersTable from './UsersTable';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, sortFields) =>
	useMemo(
		() => ({
			fields: JSON.stringify({
				name: 1,
				username: 1,
				emails: 1,
				roles: 1,
				status: 1,
				avatarETag: 1,
				active: 1,
			}),
			query: JSON.stringify({
				$or: [
					{ 'emails.address': { $regex: text || '', $options: 'i' } },
					{ username: { $regex: text || '', $options: 'i' } },
					{ name: { $regex: text || '', $options: 'i' } },
				],
			}),
			sort: JSON.stringify(
				sortFields.reduce((agg, [column, direction]) => {
					agg[column] = sortDir(direction);
					return agg;
				}, {}),
			),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, sortFields],
	);

function UsersPage() {
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');
	const seatsCap = useSeatsCap();
	const usersRoute = useRoute('admin-users');

	useEffect(() => {
		if (!context || !seatsCap) {
			return;
		}

		if (seatsCap.activeUsers >= seatsCap.maxActiveUsers && !['edit', 'info'].includes(context)) {
			usersRoute.push({});
		}
	}, [context, seatsCap, usersRoute]);

	const t = useTranslation();

	const handleVerticalBarCloseButtonClick = () => {
		usersRoute.push({});
	};
	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState([
		['name', 'asc'],
		['usernames', 'asc'],
	]);

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);
	const { value: data = {}, reload: reloadList } = useEndpointData('users.list', query);

	const reload = () => {
		seatsCap?.reload();
		reloadList();
	};

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Users')}>
					{seatsCap &&
						(seatsCap.maxActiveUsers < Number.POSITIVE_INFINITY ? (
							<UserPageHeaderContentWithSeatsCap {...seatsCap} />
						) : (
							<UserPageHeaderContent />
						))}
				</Page.Header>
				<Page.Content>
					<UsersTable users={data.users} total={data.total} params={params} onChangeParams={setParams} sort={sort} onChangeSort={setSort} />
				</Page.Content>
			</Page>
			{context && (
				<VerticalBar>
					<VerticalBar.Header>
						{context === 'info' && t('User_Info')}
						{context === 'edit' && t('Edit_User')}
						{context === 'new' && t('Add_User')}
						{context === 'invite' && t('Invite_Users')}
						<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
					</VerticalBar.Header>

					{context === 'info' && id && <UserInfoWithData uid={id} onReload={reload} />}
					{context === 'edit' && <EditUserWithData uid={id} onReload={reload} />}
					{context === 'new' && <AddUser onReload={reload} />}
					{context === 'invite' && <InviteUsers />}
				</VerticalBar>
			)}
		</Page>
	);
}

export default UsersPage;
