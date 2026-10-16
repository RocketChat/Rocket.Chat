import { Pagination, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue, useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingRow,
	usePaginatedQuery,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import UnitTableRow from './UnitTableRow';
import FilterByText from '../../../components/FilterByText';
import { links } from '../../../lib/links';

const UnitsTable = () => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const router = useRouter();

	const { sortBy, sortDirection, setSort } = useSort<'name' | 'visibility'>('name');

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

	const getUnits = useEndpoint('GET', '/v1/livechat/units');
	const { isSuccess, isLoading, data, paginatedQuery, paginationProps } = usePaginatedQuery({
		query,
		queryKey: ['livechat-units', query],
		queryFn: getUnits,
		itemsKey: 'units',
	});

	const [defaultQuery] = useState(hashKey([paginatedQuery]));
	const queryHasChanged = defaultQuery !== hashKey([paginatedQuery]);

	const handleAddNew = useStableCallback(() => router.navigate('/omnichannel/units/new'));

	const columns: TableColumnWidth[] = ['auto', 'auto', 'x60'];

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
			<GenericTableHeaderCell key='remove' />
		</>
	);

	return (
		<>
			{((isSuccess && data?.units.length > 0) || queryHasChanged) && (
				<FilterByText value={filter} onChange={(event) => setFilter(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable columns={columns} aria-busy>
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
					linkHref={links.go.omnichannelDocs}
					buttonAction={handleAddNew}
					buttonTitle={t('Create_unit')}
					linkText={t('Learn_more_about_units')}
				/>
			)}
			{isSuccess && data?.units.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Units')} aria-busy={isLoading}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.units.map(({ _id, name, visibility }) => (
								<UnitTableRow key={_id} _id={_id} name={name} visibility={visibility} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
				</>
			)}
		</>
	);
};

export default UnitsTable;
