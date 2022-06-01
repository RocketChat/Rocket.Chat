import { Box, Table } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMediaQuery, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { PaginatedRequest } from '@rocket.chat/rest-typings';
import { useRouteParameter, useRoute, usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { useMemo, useCallback, useState, FC, ReactElement } from 'react';

import GenericTable from '../../../components/GenericTable';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import VerticalBar from '../../../components/VerticalBar';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AgentEditWithData from './AgentEditWithData';
import AgentInfo from './AgentInfo';
import AgentInfoActions from './AgentInfoActions';
import AgentsPage from './AgentsPage';
import RemoveAgentButton from './RemoveAgentButton';

const sortDir = (sortDir: 'asc' | 'desc'): 1 | -1 => (sortDir === 'asc' ? 1 : -1);

const useQuery = (
	{
		text,
		itemsPerPage,
		current,
	}: {
		text: string;
		itemsPerPage: number;
		current: number;
	},
	[column, direction]: [string, 'asc' | 'desc'],
): PaginatedRequest<{ text: string }> =>
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

const AgentsRoute: FC = () => {
	const t = useTranslation();
	const canViewAgents = usePermission('manage-livechat-agents');

	const [params, setParams] = useState({ text: '', current: 0, itemsPerPage: 25 });
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address' | 'statusLivechat'>('name');

	const mediaQuery = useMediaQuery('(min-width: 1024px)');

	const debouncedParams = useDebouncedValue(params, 500);
	const debouncedSort = useDebouncedValue([sortBy, sortDirection], 500) as [
		'name' | 'username' | 'emails.address' | 'statusLivechat',
		'asc' | 'desc',
	];
	const query = useQuery(debouncedParams, debouncedSort);
	const agentsRoute = useRoute('omnichannel-agents');
	const context = useRouteParameter('context');
	const id = useRouteParameter('id');

	if (!id) {
		throw new Error('Agent id is required');
	}

	const onHeaderClick = useMutableCallback((id) => {
		if (sortBy === id) {
			setSort(id, sortDirection === 'asc' ? 'desc' : 'asc');
			return;
		}
		setSort(id, 'asc');
	});

	const onRowClick = useMutableCallback(
		(id) => (): void =>
			agentsRoute.push({
				context: 'info',
				id,
			}),
	);

	const { value: data, reload } = useEndpointData('livechat/users/agent', query);

	const header = useMemo(
		() =>
			[
				<GenericTable.HeaderCell key={'name'} direction={sortDirection} active={sortBy === 'name'} onClick={onHeaderClick} sort='name'>
					{t('Name')}
				</GenericTable.HeaderCell>,
				mediaQuery && (
					<GenericTable.HeaderCell
						key={'username'}
						direction={sortDirection}
						active={sortBy === 'username'}
						onClick={onHeaderClick}
						sort='username'
					>
						{t('Username')}
					</GenericTable.HeaderCell>
				),
				<GenericTable.HeaderCell
					key={'email'}
					direction={sortDirection}
					active={sortBy === 'emails.address'}
					onClick={onHeaderClick}
					sort='emails.address'
				>
					{t('Email')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell
					key={'status'}
					direction={sortDirection}
					active={sortBy === 'statusLivechat'}
					onClick={onHeaderClick}
					sort='statusLivechat'
				>
					{t('Livechat_status')}
				</GenericTable.HeaderCell>,
				<GenericTable.HeaderCell key={'remove'} w='x60'>
					{t('Remove')}
				</GenericTable.HeaderCell>,
			].filter(Boolean),
		[sortDirection, sortBy, onHeaderClick, t, mediaQuery],
	) as ReactElement[];

	const renderRow = useCallback(
		({ emails, _id, username, name, avatarETag, statusLivechat }) => (
			<Table.Row key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
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
				<Table.Cell withTruncatedText>{emails?.length && emails[0].address}</Table.Cell>
				<Table.Cell withTruncatedText>{statusLivechat === 'available' ? t('Available') : t('Not_Available')}</Table.Cell>
				<RemoveAgentButton _id={_id} reload={reload} />
			</Table.Row>
		),
		[mediaQuery, reload, onRowClick, t],
	);

	const EditAgentsTab = useCallback((): ReactElement => {
		if (!context) {
			return <></>;
		}
		const handleVerticalBarCloseButtonClick = (): void => {
			agentsRoute.push({});
		};

		return (
			<VerticalBar>
				<VerticalBar.Header>
					{context === 'edit' && t('Edit_User')}
					{context === 'info' && t('User_Info')}
					<VerticalBar.Close onClick={handleVerticalBarCloseButtonClick} />
				</VerticalBar.Header>

				{context === 'edit' && <AgentEditWithData uid={id} reload={reload} />}
				{context === 'info' && (
					<AgentInfo uid={id}>
						<AgentInfoActions reload={reload} />
					</AgentInfo>
				)}
			</VerticalBar>
		);
	}, [t, context, id, agentsRoute, reload]);

	if (!canViewAgents) {
		return <NotAuthorizedPage />;
	}

	return (
		<AgentsPage setParams={setParams} params={params} data={data} reload={reload} header={header} renderRow={renderRow} title={t('Agents')}>
			<EditAgentsTab />
		</AgentsPage>
	);
};

export default AgentsRoute;
