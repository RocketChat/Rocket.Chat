import { IconButton, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericNoResults from '../../../../client/components/GenericNoResults';
import {
	GenericTable,
	GenericTableRow,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingRow,
} from '../../../../client/components/GenericTable';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import { useRemoveTag } from './useRemoveTag';

const TagsTable = () => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const router = useRouter();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description'>('name');

	const onRowClick = useMutableCallback((id) => router.navigate(`/omnichannel/tags/edit/${id}`));
	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/tags/new'));
	const handleDeleteTag = useRemoveTag();

	const query = useMemo(
		() => ({
			viewAll: 'true' as const,
			fields: JSON.stringify({ name: 1 }),
			text: debouncedFilter,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[debouncedFilter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getTags = useEndpoint('GET', '/v1/livechat/tags');
	const { data, isSuccess, isLoading } = useQuery(['livechat-tags', query], async () => getTags(query), { refetchOnWindowFocus: false });

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

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
			{((isSuccess && data?.tags.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setFilter(text)} />}
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
					linkHref='https://go.rocket.chat/omnichannel-docs'
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
