import { States, StatesIcon, StatesTitle, Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ReactElement, MutableRefObject } from 'react';
import React, { useState, useMemo, useEffect } from 'react';

import FilterByText from '../../../../components/FilterByText';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import CustomUserStatusRow from './CustomUserStatusRow';

type CustomUserStatusProps = {
	reload: MutableRefObject<() => void>;
	onClick: (id: string) => void;
};

const CustomUserStatus = ({ reload, onClick }: CustomUserStatusProps): ReactElement | null => {
	const t = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'statusType'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				query: JSON.stringify({ name: { $regex: text || '', $options: 'i' } }),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const { value, reload: reloadEndpoint, phase } = useEndpointData('/v1/custom-user-status.list', query);

	useEffect(() => {
		reload.current = reloadEndpoint;
	}, [reload, reloadEndpoint]);

	if (phase === AsyncStatePhase.REJECTED) {
		return null;
	}

	return (
		<>
			<FilterByText onChange={({ text }): void => setText(text)} />
			{value?.statuses.length === 0 && (
				<States>
					<StatesIcon name='magnifier' />
					<StatesTitle>{t('No_results_found')}</StatesTitle>
				</States>
			)}
			{value?.statuses && value.statuses.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>
							<GenericTableHeaderCell key='name' direction={sortDirection} active={sortBy === 'name'} onClick={setSort} sort='name'>
								{t('Name')}
							</GenericTableHeaderCell>
							<GenericTableHeaderCell
								key='presence'
								direction={sortDirection}
								active={sortBy === 'statusType'}
								onClick={setSort}
								sort='statusType'
							>
								{t('Presence')}
							</GenericTableHeaderCell>
						</GenericTableHeader>
						<GenericTableBody>
							{phase === AsyncStatePhase.LOADING && <GenericTableLoadingTable headerCells={2} />}
							{value?.statuses.map((status) => (
								<CustomUserStatusRow key={status._id} status={status} onClick={onClick} />
							))}
						</GenericTableBody>
					</GenericTable>
					{phase === AsyncStatePhase.RESOLVED && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={value?.total || 0}
							onSetItemsPerPage={onSetItemsPerPage}
							onSetCurrent={onSetCurrent}
							{...paginationProps}
						/>
					)}
				</>
			)}
		</>
	);
};

export default CustomUserStatus;
