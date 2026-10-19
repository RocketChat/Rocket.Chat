import { Box, Pagination, type TableColumnWidth, Text } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	getCombineFn,
	usePaginatedQuery,
	usePagination,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import AddManager from './AddManager';
import RemoveManagerButton from './RemoveManagerButton';
import FilterByText from '../../../components/FilterByText';
import GenericError from '../../../components/GenericError';
import { links } from '../../../lib/links';
import { omnichannelQueryKeys } from '../../../lib/queryKeys';

const ManagersTable = () => {
	const t = useTranslation();

	const [text, setText] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'username' | 'emails.address'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			}),
			[text, sortBy, sortDirection],
		),
		500,
	);

	const queryKey = omnichannelQueryKeys.managers(query);
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const getManagers = useEndpoint('GET', '/v1/livechat/users/manager');
	const { data, isLoading, isSuccess, isError, refetch } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getManagers,
		combineData: getCombineFn('users'),
		offset: current,
		count: itemsPerPage,
	});

	const [defaultQuery] = useState(hashKey([query, current, itemsPerPage]));
	const queryHasChanged = defaultQuery !== hashKey([query, current, itemsPerPage]);

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'x60'];

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
			<GenericTableHeaderCell key='remove'>{t('Remove')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<AddManager />
			{((isSuccess && data?.users.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable columns={columns} aria-busy={isLoading} aria-label={t('Managers')}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.users.length === 0 && (
				<GenericNoResults
					icon='shield'
					title={t('No_managers_yet')}
					description={t('No_managers_yet_description')}
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_managers')}
				/>
			)}
			{isSuccess && data.users.length > 0 && (
				<>
					<GenericTable columns={columns} aria-busy={isLoading} aria-label={t('Managers')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.users.map((user) => (
								<GenericTableRow key={user._id} tabIndex={0}>
									<GenericTableCell truncate>
										<Box display='flex' alignItems='center'>
											<UserAvatar size='x28' username={user.username || ''} etag={user.avatarETag} />
											<Box display='flex' withTruncatedText marginInline={8}>
												<Box display='flex' flexDirection='column' alignSelf='center' withTruncatedText>
													<Text fontScale='p2m' truncate color='default'>
														{user.name || user.username}
													</Text>
												</Box>
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell>
										<Text fontScale='p2m' truncate color='hint'>
											{user.username}
										</Text>
										<Box marginInline={4} />
									</GenericTableCell>
									<GenericTableCell truncate>{user.emails?.length && user.emails[0].address}</GenericTableCell>
									<RemoveManagerButton _id={user._id} />
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
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default ManagersTable;
