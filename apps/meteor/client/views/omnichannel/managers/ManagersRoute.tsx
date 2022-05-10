import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { usePermission, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ReactElement, useMemo } from 'react';

import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import Page from '../../../components/Page';
import UserAvatar from '../../../components/avatar/UserAvatar';
import { useEndpointData } from '../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../lib/asyncState';
import NotAuthorizedPage from '../../notAuthorized/NotAuthorizedPage';
import AddManager from './AddManager';
import RemoveManagerButton from './RemoveManagerButton';

const ManagersRoute = (): ReactElement => {
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address'>('name');
	const t = useTranslation();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				// text,
				fields: JSON.stringify({ name: 1, username: 1, emails: 1, avatarETag: 1 }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { reload, ...result } = useEndpointData('livechat/users/manager', query);
	const canViewManagers = usePermission('manage-livechat-managers');

	if (!canViewManagers) {
		return <NotAuthorizedPage />;
	}

	return (
		<Page flexDirection='row'>
			<Page>
				<Page.Header title={t('Managers')} />
				<AddManager reload={reload} />
				<Page.Content>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell key={'name'} direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
								{t('Name')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key={'username'}
								direction={sortDirection}
								active={sortBy === 'username'}
								onClick={setSort}
								sort='username'
							>
								{t('Username')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key={'email'}
								direction={sortDirection}
								active={sortBy === 'emails.address'}
								onClick={setSort}
								sort='emails.address'
							>
								{t('Email')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell key={'remove'} w='x60'>
								{t('Remove')}
							</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{result.phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={2} />}
							{result.phase === AsyncStatePhase.RESOLVED &&
								result.value.users.length > 0 &&
								result.value.users.map((user) => (
									<GenericTableRow key={user._id} tabIndex={0} qa-user-id={user._id}>
										<GenericTableCell withTruncatedText>
											<Box display='flex' alignItems='center'>
												<UserAvatar size='x28' username={user.username || ''} etag={user.avatarETag} />
												<Box display='flex' withTruncatedText mi='x8'>
													<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
														<Box fontScale='p2m' withTruncatedText color='default'>
															{user.name || user.username}
														</Box>
													</Box>
												</Box>
											</Box>
										</GenericTableCell>
										<GenericTableCell>
											<Box fontScale='p2m' withTruncatedText color='hint'>
												{user.username}
											</Box>
											<Box mi='x4' />
										</GenericTableCell>
										<GenericTableCell withTruncatedText>{user.emails?.length && user.emails[0].address}</GenericTableCell>
										<RemoveManagerButton _id={user._id} reload={reload} />
									</GenericTableRow>
								))}
						</GenericTableBody>
					</GenericTable>
					{result.phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={result.value.total || 0}
							onSetItemsPerPage={onSetItemsPerPage}
							onSetCurrent={onSetCurrent}
							{...paginationProps}
						/>
					)}
				</Page.Content>
			</Page>
		</Page>
	);
};

export default ManagersRoute;
