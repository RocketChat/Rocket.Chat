import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableRow,
	GenericTableCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../components/GenericTable/hooks/useSort';
import RemoveCustomFieldButton from './RemoveCustomFieldButton';

const CustomFieldsTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const router = useRouter();
	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'_id' | 'label' | 'scope' | 'visibility'>('_id');

	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/customfields/new'));
	const onRowClick = useMutableCallback((id) => () => router.navigate(`/omnichannel/customfields/edit/${id}`));

	const query = useMemo(
		() => ({
			text: debouncedFilter,
			sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[debouncedFilter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getCustomFields = useEndpoint('GET', '/v1/livechat/custom-fields');
	const { data, isSuccess, isLoading, refetch } = useQuery(['livechat-customFields', query], async () => getCustomFields(query));

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);
	reload.current = refetch;

	const headers = (
		<>
			<GenericTableHeaderCell key='field' direction={sortDirection} active={sortBy === '_id'} onClick={setSort} sort='_id'>
				{t('Field')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='label' direction={sortDirection} active={sortBy === 'label'} onClick={setSort} sort='label'>
				{t('Label')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='scope' direction={sortDirection} active={sortBy === 'scope'} onClick={setSort} sort='scope'>
				{t('Scope')}
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
			{((isSuccess && data?.customFields.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }) => setFilter(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.customFields.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data.customFields.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='file-sheets'
					title={t('No_custom_fields_yet')}
					description={t('No_custom_fields_yet_description')}
					buttonAction={handleAddNew}
					buttonTitle={t('Create_custom_field')}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_custom_fields')}
				/>
			)}

			{isSuccess && data.customFields.length > 0 && (
				<>
					<GenericTable data-qa='GenericTableCustomFieldsInfoBody'>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.customFields.map(({ label, _id, scope, visibility }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{_id}</GenericTableCell>
									<GenericTableCell withTruncatedText>{label}</GenericTableCell>
									<GenericTableCell withTruncatedText>{scope === 'visitor' ? t('Visitor') : t('Room')}</GenericTableCell>
									<GenericTableCell withTruncatedText>{visibility === 'visible' ? t('Visible') : t('Hidden')}</GenericTableCell>
									<RemoveCustomFieldButton _id={_id} reload={refetch} />
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

export default CustomFieldsTable;
