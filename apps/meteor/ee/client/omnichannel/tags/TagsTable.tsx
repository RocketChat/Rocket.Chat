import { Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

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
import RemoveTagButton from './RemoveTagButton';

const TagsTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description'>('name');

	const tagsRoute = useRoute('omnichannel-tags');

	const onRowClick = useMutableCallback(
		(id) => () =>
			tagsRoute.push({
				context: 'edit',
				id,
			}),
	);

	const query = useMemo(
		() => ({
			fields: JSON.stringify({ name: 1 }),
			text: filter,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[filter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getTags = useEndpoint('GET', '/v1/livechat/tags');
	const { data, refetch, isSuccess, isLoading } = useQuery(['livechat-tags', query], async () => getTags(query), {
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

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
			<GenericTableHeaderCell key='remove' w='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<FilterByText onChange={({ text }): void => setFilter(text)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.tags.length === 0 && <GenericNoResults />}
			{isSuccess && data?.tags.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.tags.map(({ _id, name, description }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{description}</GenericTableCell>
									<RemoveTagButton _id={_id} reload={refetch} />
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
