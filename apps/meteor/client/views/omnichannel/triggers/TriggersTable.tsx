import { Pagination } from '@rocket.chat/fuselage';
import { useMutableCallback } from '@rocket.chat/fuselage-hooks';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { useQuery, hashQueryKey } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import GenericError from '../../../components/GenericError';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import TriggersRow from './TriggersRow';

const TriggersTable = () => {
	const t = useTranslation();
	const router = useRouter();

	const handleAddNew = useMutableCallback(() => {
		router.navigate('/omnichannel/triggers/new');
	});

	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const query = useMemo(() => ({ offset: current, count: itemsPerPage }), [current, itemsPerPage]);

	const getTriggers = useEndpoint('GET', '/v1/livechat/triggers');
	const { data, refetch, isSuccess, isLoading, isError } = useQuery(['livechat-triggers', query], async () => getTriggers(query));

	const [defaultQuery] = useState(hashQueryKey([query]));
	const queryHasChanged = defaultQuery !== hashQueryKey([query]);

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Description')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Enabled')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x60' />
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
			{isSuccess && data.triggers.length === 0 && queryHasChanged && <GenericNoResults />}
			{isSuccess && data.triggers.length === 0 && !queryHasChanged && (
				<GenericNoResults
					icon='smart'
					title={t('No_triggers_yet')}
					description={t('No_triggers_yet_description')}
					buttonAction={handleAddNew}
					buttonTitle={t('Create_trigger')}
					linkHref='https://go.rocket.chat/i/omnichannel-docs'
					linkText={t('Learn_more_about_triggers')}
				/>
			)}
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
			{isError && <GenericError buttonAction={refetch} />}
		</>
	);
};

export default TriggersTable;
