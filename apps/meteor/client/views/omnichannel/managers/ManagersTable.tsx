import { Box, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { hashKey, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import AddManager from './AddManager';
import RemoveManagerButton from './RemoveManagerButton';
import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults/GenericNoResults';
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

// TODO: Missing error state
const ManagersTable = () => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address'>('name');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, sortBy, sortDirection, itemsPerPage, current],
		),
		500,
	);

	const getManagers = useEndpoint('GET', '/v1/livechat/users/manager');
	const { data, isLoading, isSuccess, refetch } = useQuery({
		queryKey: ['omnichannel', 'managers', 'livechat-manager', query],

		queryFn: async () => getManagers(query),
	});

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='username' direction={sortDirection} active={sortBy === 'username'} onClick={setSort} sort='username'>
				{t('Username')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='email'
				direction={sortDirection}
				active={sortBy === 'emails.address'}
				onClick={setSort}
				sort='emails.address'
			>
				{t('Email')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove' w='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<AddManager reload={refetch} />
			{((isSuccess && data?.users.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable aria-busy>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.users.length === 0 && (
				<GenericNoResults
					icon='shield'
					title={t('No_managers_yet')}
					description={t('No_managers_yet_description')}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_managers')}
				/>
			)}
			{isSuccess && data.users.length > 0 && (
				<>
					<GenericTable aria-busy={isLoading} aria-label={t('Managers')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.users.map((user) => (
								<GenericTableRow key={user._id} tabIndex={0} qa-user-id={user._id}>
									<GenericTableCell withTruncatedText>
										<Box display='flex' alignItems='center'>
											<UserAvatar size='x28' username={user.username || ''} etag={user.avatarETag} />
											<Box display='flex' withTruncatedText mi={8}>
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
										<Box mi={4} />
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{user.emails?.length && user.emails[0].address}</GenericTableCell>
									<RemoveManagerButton _id={user._id} reload={refetch} />
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default ManagersTable;
