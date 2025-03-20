import { IconButton, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import { useRemoveTag } from './useRemoveTag';
import FilterByText from '../../components/FilterByText';
import GenericNoResults from '../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableRow,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingRow,
} from '../../components/GenericTable';
import { usePagination } from '../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../components/GenericTable/hooks/useSort';

const TagsTable = () => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const router = useRouter();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description'>('name');

	const onRowClick = useEffectEvent((id: string) => router.navigate(`/omnichannel/tags/edit/${id}`));
	const handleAddNew = useEffectEvent(() => router.navigate('/omnichannel/tags/new'));
	const handleDeleteTag = useRemoveTag();

	const query = useDebouncedValue(
		useMemo(
			() => ({
				viewAll: 'true' as const,
				text: filter,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[filter, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const getTags = useEndpoint('GET', '/v1/livechat/tags');
	const { data, isSuccess, isLoading } = useQuery({
		queryKey: ['livechat-tags', query],
		queryFn: async () => getTags(query),
		refetchOnWindowFocus: false,
	});

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='description'
				direction={sortDirection}
				active={sortBy === 'description'}
				onClick={setSort}
				sort='description'
			>
				{t('Description')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove' w='x60' />
		</>
	);

	return (
		<>
			{((isSuccess && data?.tags.length > 0) || queryHasChanged) && (
				<FilterByText value={filter} onChange={(event) => setFilter(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.tags.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.tags.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='tag'
					title={t('No_tags_yet')}
					description={t('No_tags_yet_description')}
					buttonTitle={t('Create_tag')}
					buttonAction={handleAddNew}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_tags')}
				/>
			)}
			{isSuccess && data?.tags.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.tags.map(({ _id, name, description }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={() => onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{description}</GenericTableCell>
									<GenericTableCell>
										<IconButton
											icon='trash'
											small
											title={t('Remove')}
											onClick={(e) => {
												e.stopPropagation();
												handleDeleteTag(_id);
											}}
										/>
									</GenericTableCell>
								</GenericTableRow>
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default TagsTable;
