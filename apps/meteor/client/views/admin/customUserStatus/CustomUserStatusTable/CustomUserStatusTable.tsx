import { Pagination } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { ReactElement, MutableRefObject } from 'react';
import { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import CustomUserStatusRow from './CustomUserStatusRow';
import FilterByText from '../../../../components/FilterByText';
import GenericNoResult from '../../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableBody,
	GenericTableLoadingTable,
} from '../../../../components/GenericTable';
import { usePagination } from '../../../../components/GenericTable/hooks/usePagination';
import { useSort } from '../../../../components/GenericTable/hooks/useSort';

type CustomUserStatusProps = {
	reload: MutableRefObject<() => void>;
	onClick: (id: string) => void;
};

// TODO: Missing error state
const CustomUserStatus = ({ reload, onClick }: CustomUserStatusProps): ReactElement | null => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();
	const { sortBy, sortDirection, setSort } = useSort<'name' | 'statusType'>('name');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				name: escapeRegExp(text),
				sort: `{ "${sortBy}": ${sortDirection === 'asc' ? 1 : -1} }`,
				count: itemsPerPage,
				offset: current,
			}),
			[text, itemsPerPage, current, sortBy, sortDirection],
		),
		500,
	);

	const getCustomUserStatus = useEndpoint('GET', '/v1/custom-user-status.list');

	const { data, isLoading, refetch, isFetched } = useQuery({
		queryKey: ['custom-user-statuses', query],

		queryFn: async () => {
			const { statuses } = await getCustomUserStatus(query);
			return statuses;
		},
		meta: {
			apiErrorToastMessage: true,
		},
	});

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	if (!data) {
		return null;
	}

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			{data.length === 0 && <GenericNoResult />}
			{data && data.length > 0 && (
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
							{isLoading && <GenericTableLoadingTable headerCells={2} />}
							{data?.map((status) => <CustomUserStatusRow key={status._id} status={status} onClick={onClick} />)}
						</GenericTableBody>
					</GenericTable>
					{isFetched && (
						<Pagination
							current={current}
							itemsPerPage={itemsPerPage}
							count={data.length}
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
