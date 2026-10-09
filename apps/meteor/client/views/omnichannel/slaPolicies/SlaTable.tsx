import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableLoadingRow,
	GenericTableBody,
	GenericTableRow,
	GenericTableCell,
	usePaginatedQueryKey,
	useSort,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashKey } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import { useMemo, useState, useEffect } from 'react';

import RemoveSlaButton from './RemoveSlaButton';
import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults/GenericNoResults';
import { links } from '../../../lib/links';

const SlaTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const router = useRouter();

	const [filter, setFilter] = useState('');

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'description' | 'dueTimeInMinutes'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text: filter,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
			}),
			[filter, sortBy, sortDirection],
		),
		500,
	);
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => ['/v1/livechat/sla', query] as const,
	});

	const getSlaData = useEndpoint('GET', '/v1/livechat/sla');
	const { data, isSuccess, isLoading, refetch } = useQuery({
		queryKey,
		queryFn: () => getSlaData(paginatedQuery),
	});

	const [defaultQuery] = useState(hashKey([paginatedQuery]));
	const queryHasChanged = defaultQuery !== hashKey([paginatedQuery]);

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	const handleAddNew = useStableCallback(() => router.navigate('/omnichannel/sla-policies/new'));
	const onRowClick = useStableCallback((id: string) => () => router.navigate(`/omnichannel/sla-policies/edit/${id}`));

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
			<GenericTableHeaderCell key='remove' width='x60'>
				{t('Remove')}
			</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{((isSuccess && data?.sla.length > 0) || queryHasChanged) && (
				<FilterByText value={filter} onChange={(event) => setFilter(event.target.value)} />
			)}
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_SLA_policies')}
				/>
			)}
			{isSuccess && data?.sla.length > 0 && (
				<>
					<GenericTable aria-label={t('SLA_Policies')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.sla.map(({ _id, name, description, dueTimeInMinutes }) => (
								<GenericTableRow key={_id} tabIndex={0} onClick={onRowClick(_id)} action>
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
					<Pagination divider {...paginationProps} />
				</>
			)}
		</>
	);
};

export default SlaTable;
