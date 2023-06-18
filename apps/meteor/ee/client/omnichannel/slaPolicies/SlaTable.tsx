import { Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useRoute, useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
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
	const [filter, setFilter] = useState('');
	const slaPoliciesRoute = useRoute('omnichannel-sla-policies');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description' | 'dueTimeInMinutes'>('name');

	const query = useMemo(
		() => ({
			text: filter,
			sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
		}),
		[filter, itemsPerPage, current, sortBy, sortDirection],
	);

	const getSlaData = useEndpoint('GET', '/v1/livechat/sla');
	const { data, isSuccess, isLoading, refetch } = useQuery(['/v1/livechat/sla', query], () => getSlaData(query), {
		refetchOnWindowFocus: false,
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	const onRowClick = useMutableCallback(
		(id) => () =>
			slaPoliciesRoute.push({
				context: 'edit',
				id,
			}),
	);

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
			<GenericTableHeaderCell key={'remove'} w='x60'>
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
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.sla.length === 0 && <GenericNoResults />}
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
