import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useMemo, useState, useEffect } from 'react';

import FilterByText from '../../../../client/components/FilterByText';
import GenericNoResults from '../../../../client/components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableLoadingRow,
	GenericTableBody,
	GenericTableRow,
	GenericTableCell,
} from '../../../../client/components/GenericTable';
import { usePagination } from '../../../../client/components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../client/components/GenericTable/hooks/useSort';
import RemoveSlaButton from './RemoveSlaButton';

const SlaTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const router = useRouter();

	const [filter, setFilter] = useState('');
	const debouncedFilter = useDebouncedValue(filter, 500);

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description' | 'dueTimeInMinutes'>('name');

	const query = useMemo(
		() => ({
			text: debouncedFilter,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[debouncedFilter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getSlaData = useEndpoint('GET', '/v1/livechat/sla');
	const { data, isSuccess, isLoading, refetch } = useQuery(['/v1/livechat/sla', query], () => getSlaData(query));

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	const handleAddNew = useMutableCallback(() => router.navigate('/omnichannel/sla-policies/new'));
	const onRowClick = useMutableCallback((id) => () => router.navigate(`/omnichannel/sla-policies/edit/${id}`));

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
			<GenericTableHeaderCell
				key='dueTimeInMinutes'
				direction={sortDirection}
				active={sortBy === 'dueTimeInMinutes'}
				onClick={setSort}
				sort='dueTimeInMinutes'
			>
				{t('Estimated_wait_time')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='remove' w='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{((isSuccess && data?.sla.length > 0) || queryHasChanged) && <FilterByText onChange={({ text }): void => setFilter(text)} />}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.sla.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data?.sla.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='flag'
					title={t('No_SLA_policies_yet')}
					description={t('No_SLA_policies_yet_description')}
					buttonTitle={t('Create_SLA_policy')}
					buttonAction={handleAddNew}
					linkHref='https://go.rocket.chat/omnichannel-docs'
					linkText={t('Learn_more_about_SLA_policies')}
				/>
			)}
			{isSuccess && data?.sla.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.sla.map(({ _id, name, description, dueTimeInMinutes }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' onClick={onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{description}</GenericTableCell>
									<GenericTableCell withTruncatedText>
										{dueTimeInMinutes} {t('minutes')}
									</GenericTableCell>
									<RemoveSlaButton _id={_id} reload={refetch} />
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

export default SlaTable;
