import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useState, useMemo, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import GenericNoResults from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import CustomSoundRow from './CustomSoundRow';

type CustomSoundsTableProps = {
	onClick: (soundId: string) => () => void;
	reload: MutableRefObject<() => void>;
};

const CustomSoundsTable = ({ reload, onClick }: CustomSoundsTableProps) => {
	const t = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const [text, setParams] = useState('');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: JSON.stringify({ name: { $regex: escapeRegExp(text), $options: 'i' } }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				...(itemsPerPage && { count: itemsPerPage }),
				...(current && { offset: current }),
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const getSounds = useEndpoint('GET', '/v1/custom-sounds.list');
	const { data, refetch, isLoading, isError, isSuccess } = useQuery(['custom-sounds', query], async () => getSounds(query), {
		refetchOnMount: false,
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell w='x40' key='action' />
		</>
	);

	return (
		<>
			<FilterByText onChange={({ text }): void => setParams(text)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.sounds.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.sounds.map((sound) => (
								<CustomSoundRow key={sound._id} sound={sound} onClick={onClick} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data.sounds.length || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
			{isSuccess && data?.sounds.length === 0 && <GenericNoResults />}
			{isError && (
				<States>
					<StatesIcon name='warning' variation='danger' />
					<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
					<StatesActions>
						<StatesAction onClick={() => refetch()}>{t('Reload_page')}</StatesAction>
					</StatesActions>
				</States>
			)}
		</>
	);
};

export default CustomSoundsTable;
