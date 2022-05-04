import { Box, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import React, { useMemo, useCallback, useState } from 'react';

import GenericTable from '../../../components/GenericTable';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { usePermission } from '../../../contexts/AuthorizationContext';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useEndpointData } from '../../../hooks/useEndpointData';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import ManagersPage from './ManagersPage';
import RemoveManagerButton from './RemoveManagerButton';

const sortDir = (sortDir) => (sortDir === 'asc' ? 1 : -1);

const useQuery = ({ text, itemsPerPage, current }, [column, direction]) =>
	useMemo(
		() => ({
			fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
			text,
			sort: JSON.stringify({
				[column]: sortDir(direction),
				usernames: column === 'name' ? sortDir(direction) : undefined,
			}),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[text, itemsPerPage, current, column, direction],
	);

function ManagersRoute() {
	const t = useTranslation();
	const canViewManagers = usePermission('manage-livechat-managers');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const [sort, setSort] = useState(['name', 'asc']);

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const onHeaderClick = useMutableCallback((id) => {
		const [sortBy, sortDirection] = sort;

		if (sortBy === id) {
			setSort([id, sortDirection === 'asc' ? 'desc' : 'asc']);
			return;
		}
		setSort([id, 'asc']);
	});

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue(sort, 500);
	const query = useQuery(debouncedParams, debouncedSort);

	const { value: data = {}, reload } = useEndpointData('livechat/users/manager', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sort[1]} active={sort[0] === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'username'}
						direction={sort[1]}
						active={sort[0] === 'username'}
						onClick={onHeaderClick}
						sort='username'
					>
						{t('Username')}
					</GenericTable.HeaderCell>
				),
				<GenericTable.HeaderCell
					key={'email'}
					direction={sort[1]}
					active={sort[0] === 'emails.address'}
					onClick={onHeaderClick}
					sort='emails.address'
				>
					{t('Email')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sort, onHeaderClick, t, mediaQuery],
	);

	const renderRow = useCallback(
		({ emails, _id, username, name, avatarETag }) => (
			<Table.Row key={_id} tabIndex={0} qa-user-id={_id}>
				<Table.Cell withTruncatedText>
					<Box display='flex' alignItems='center'>
						<UserAvatar size={mediaQuery ? 'x28' : 'x40'} title={username} username={username} etag={avatarETag} />
						<Box display='flex' withTruncatedText mi='x8'>
							<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
								<Box fontScale='p2m' withTruncatedText color='default'>
									{name || username}
								</Box>
								{!mediaQuery && name && (
									<Box fontScale='p2' color='hint' withTruncatedText>
										{' '}
										{`@${username}`}{' '}
									</Box>
								)}
							</Box>
						</Box>
					</Box>
				</Table.Cell>
				{mediaQuery && (
					<Table.Cell>
						<Box fontScale='p2m' withTruncatedText color='hint'>
							{username}
						</Box>{' '}
						<Box mi='x4' />
					</Table.Cell>
				)}
				<Table.Cell withTruncatedText>{emails && emails.length && emails[0].address}</Table.Cell>
				<RemoveManagerButton _id={_id} reload={reload} />
			</Table.Row>
		),
		[mediaQuery, reload],
	);

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return (
		<ManagersPage
			setParams={setParams}
			params={params}
			onHeaderClick={onHeaderClick}
			data={data}
			useQuery={useQuery}
			reload={reload}
			header={header}
			renderRow={renderRow}
			title={t('Managers')}
		/>
	);
}

export default ManagersRoute;
