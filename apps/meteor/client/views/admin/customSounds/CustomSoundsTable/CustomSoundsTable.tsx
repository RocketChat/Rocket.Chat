import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	usePaginatedQuery,
	useSort,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import type { MutableRefObject } from 'react';
import { useState, useMemo, useEffect } from 'react';

import CustomSoundRow from './CustomSoundRow';
import FilterByText from '../../../../components/FilterByText';

export type CustomSoundsTableProps = {
	onClick: (soundId: string) => () => void;
	reload: MutableRefObject<() => void>;
};

const CustomSoundsTable = ({ reload, onClick }: CustomSoundsTableProps) => {
	const t = useTranslation();
	const { sortBy, sortDirection, setSort } = useSort<'name'>('name');

	const [text, setText] = useState('');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				name: text,
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
			}),
			[text, sortBy, sortDirection],
		),
		500,
	);

	const getSounds = useEndpoint('GET', '/v1/custom-sounds.list');
	const { data, refetch, isLoading, isError, isSuccess, paginationProps } = usePaginatedQuery({
		query,
		queryKey: ['custom-sounds', query],
		queryFn: getSounds,
		itemsKey: 'sounds',
		refetchOnMount: false,
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	const columns: TableColumnWidth[] = ['auto', 'x40'];

	const headers = (
		<>
			<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
				{t('Name')}
			</GenericTableHeaderCell>
			<GenericTableHeaderCell key='action' />
		</>
	);

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={2} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.sounds.length > 0 && (
				<>
					<GenericTable columns={columns}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.sounds.map((sound) => (
								<CustomSoundRow key={sound._id} sound={sound} onClick={onClick} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
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
