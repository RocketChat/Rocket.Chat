import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter, useTranslation } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericNoResults from '../../../../client/components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../../../client/components/GenericTable';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import RemoveUnitButton from './RemoveUnitButton';

const UnitsTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);
	const router = useRouter();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'visibility'>('name');

	const query = useMemo(
		() => ({
			fields: JSON.stringify({ name: 1 }),
			text: debouncedFilter,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[debouncedFilter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getUnits = useEndpoint('GET', '/v1/livechat/units');
	const { isSuccess, isLoading, data, refetch } = useQuery(['livechat-units', query], async () => getUnits(query));

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	useEffect(() => {
		reload.current = refetch;
	}, [refetch, reload]);

	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/units/new'));
	const onRowClick = useMutableCallback((id) => () => router.navigate(`/omnichannel/units/edit/${id}`));

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell
				key='visibility'
				direction={sortDirection}
				active={sortBy === 'visibility'}
				onClick={setSort}
				sort='visibility'
			>
				{t('Visibility')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove' w='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{((isSuccess && data?.units.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setFilter(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.units.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data.units.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='business'
					title={t('No_units_yet')}
					description={t('No_units_yet_description')}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					buttonAction={handleAddNew}
					buttonTitle={t('Create_unit')}
					linkText={t('Learn_more_about_units')}
				/>
			)}
			{isSuccess && data?.units.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.units.map(({ _id, name, visibility }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{visibility}</GenericTableCell>
									<RemoveUnitButton _id={_id} reload={refetch} />
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

export default UnitsTable;
