import { Pagination, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableHeader,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	usePaginatedQuery,
	usePagination,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint, useRouter } from '@rocket.chat/ui-contexts';
import { hashKey } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import TriggersRow from './TriggersRow';
import GenericError from '../../../components/GenericError';
import { links } from '../../../lib/links';

const TriggersTable = () => {
	const t = useTranslation();
	const router = useRouter();

	const handleAddNew = useStableCallback(() => {
		router.navigate('/omnichannel/triggers/new');
	});

	const query = useMemo(() => ({}), []);

	const queryKey = ['livechat-triggers', query];
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination({ resetKey: queryKey });

	const getTriggers = useEndpoint('GET', '/v1/livechat/triggers');
	const { data, refetch, isSuccess, isLoading, isError } = usePaginatedQuery({
		query,
		queryKey,
		queryFn: getTriggers,
		itemsKey: 'triggers',
		offset: current,
		count: itemsPerPage,
	});

	const [defaultQuery] = useState(hashKey([query, current, itemsPerPage]));
	const queryHasChanged = defaultQuery !== hashKey([query, current, itemsPerPage]);

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'x60'];

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Description')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Enabled')}</GenericTableHeaderCell>
			<GenericTableHeaderCell />
		</>
	);

	return (
		<>
			{isLoading && (
				<GenericTable columns={columns}>
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
					linkHref={links.go.omnichannelDocs}
					linkText={t('Learn_more_about_triggers')}
				/>
			)}
			{isSuccess && data.triggers.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Livechat_Triggers')}>
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
