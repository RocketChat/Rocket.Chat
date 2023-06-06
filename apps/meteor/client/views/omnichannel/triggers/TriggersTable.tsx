import { Callout, Pagination } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import type { MutableRefObject } from 'react';
import React, { useEffect, useMemo } from 'react';

import GenericNoResults from '../../../components/GenericNoResults/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import TriggersRow from './TriggersRow';

const TriggersTable = ({ reload }: { reload: MutableRefObject<() => void> }) => {
	const t = useTranslation();
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const query = useMemo(() => ({ offset: current, count: itemsPerPage }), [current, itemsPerPage]);

	const getTriggers = useEndpoint('GET', '/v1/livechat/triggers');
	const { data, refetch, isSuccess, isLoading, isError } = useQuery(['livechat-triggers', query], async () => getTriggers(query));

	useEffect(() => {
		reload.current = refetch;
	}, [reload, refetch]);

	if (isError) {
		return <Callout>{t('Error')}</Callout>;
	}

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Description')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Enabled')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x60'>{t('Remove')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={4} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.triggers.length === 0 && <GenericNoResults />}
			{isSuccess && data.triggers.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data.triggers.map(({ _id, name, description, enabled }) => (
								<TriggersRow key={_id} _id={_id} name={name} description={description} enabled={enabled} reload={refetch} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data?.total || 0}
						onSetItemsPerPage={setItemsPerPage}
						onSetCurrent={setCurrent}
						{...paginationProps}
					/>
				</>
			)}
		</>
	);
};

export default TriggersTable;
