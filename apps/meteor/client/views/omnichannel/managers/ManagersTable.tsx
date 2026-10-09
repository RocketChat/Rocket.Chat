import { Box, Pagination } from '@rocket.chat/fuselage';
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
	usePaginatedQueryKey,
	useSort,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { hashKey, useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import AddManager from './AddManager';
import RemoveManagerButton from './RemoveManagerButton';
import FilterByText from '../../../components/FilterByText';
import GenericError from '../../../components/GenericError';
import GenericNoResults from '../../../components/GenericNoResults/GenericNoResults';
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
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => omnichannelQueryKeys.managers(query),
	});

	const getManagers = useEndpoint('GET', '/v1/livechat/users/manager');
	const { data, isLoading, isSuccess, isError, refetch } = useQuery({
		queryKey,
		queryFn: async () => getManagers(paginatedQuery),
	});

	const [defaultQuery] = useState(hashKey([paginatedQuery]));
	const queryHasChanged = defaultQuery !== hashKey([paginatedQuery]);

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
			<GenericTableHeaderCell key='remove' width='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<AddManager />
			{((isSuccess && data?.users.length > 0) || queryHasChanged) && (
				<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable aria-busy={isLoading} aria-label={t('Managers')}>
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
					<GenericTable aria-busy={isLoading} aria-label={t('Managers')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.users.map((user) => (
								<GenericTableRow key={user._id} tabIndex={0}>
									<GenericTableCell withTruncatedText>
										<Box display='flex' alignItems='center'>
											<UserAvatar size='x28' username={user.username || ''} etag={user.avatarETag} />
											<Box display='flex' withTruncatedText marginInline={8}>
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
										<Box marginInline={4} />
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{user.emails?.length && user.emails[0].address}</GenericTableCell>
									<RemoveManagerButton _id={user._id} />
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default ManagersTable;
