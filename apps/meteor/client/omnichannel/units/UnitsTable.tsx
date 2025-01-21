import { Pagination, IconButton } from '@rocket.chat/fuselage';
import { useDebouncedValue, useEffectEvent } from '@rocket.chat/fuselage-hooks';
import { useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { useRemoveUnit } from './useRemoveUnit';
import FilterByText from '../../components/FilterByText';
import GenericNoResults from '../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../components/GenericTable';
import { usePagination } from '../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../components/GenericTable/hooks/useSort';

const UnitsTable = () => {
	const { t } = useTranslation();
	const [filter, setFilter] = useState('');
	const router = useRouter();

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'visibility'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				text: filter,
				sort: JSON.stringify({ [sortBy]: sortDirection === 'asc' ? 1 : -1 }),
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[filter, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const getUnits = useEndpoint('GET', '/v1/livechat/units');
	const { isSuccess, isLoading, data } = useQuery({
		queryKey: ['livechat-units', query],
		queryFn: async () => getUnits(query),
	});

	const [defaultQuery] = useState(hashKey([query]));
	const queryHasChanged = defaultQuery !== hashKey([query]);

	const handleAddNew = useEffectEvent(() => router.navigate('/omnichannel/units/new'));
	const onRowClick = useEffectEvent((id: string) => () => router.navigate(`/omnichannel/units/edit/${id}`));
	const handleDelete = useRemoveUnit();

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
			<GenericTableHeaderCell key='remove' w='x60' />
		</>
	);

	return (
		<>
			{((isSuccess && data?.units.length > 0) || queryHasChanged) && (
				<FilterByText value={filter} onChange={(event) => setFilter(event.target.value)} />
			)}
			{isLoading && (
				<GenericTable aria-busy>
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
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					buttonAction={handleAddNew}
					buttonTitle={t('Create_unit')}
					linkText={t('Learn_more_about_units')}
				/>
			)}
			{isSuccess && data?.units.length > 0 && (
				<>
					<GenericTable aria-busy={isLoading}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.units.map(({ _id, name, visibility }) => (
								<GenericTableRow key={_id} tabIndex={0} role='link' data-qa-id={name} onClick={onRowClick(_id)} action qa-user-id={_id}>
									<GenericTableCell withTruncatedText>{name}</GenericTableCell>
									<GenericTableCell withTruncatedText>{visibility}</GenericTableCell>
									<GenericTableCell>
										<IconButton
											icon='trash'
											small
											title={t('Remove')}
											data-qa-id={`remove-unit-${name}`}
											onClick={(e) => {
												e.stopPropagation();
												handleDelete(_id);
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

export default UnitsTable;
