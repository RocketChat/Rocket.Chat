import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../../client/components/FilterByText';
import GenericNoResults from '../../../client/components/GenericNoResults';
import { GenericTable, GenericTableBody, GenericTableHeader, GenericTableLoadingRow } from '../../../client/components/GenericTable';
import { usePagination } from '../../../client/components/GenericTable/hooks/usePagination';
import BusinessHoursRow from './BusinessHoursRow';

const BusinessHoursTable = () => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useMemo(
		() => ({
			count: itemsPerPage,
			offset: current,
			name: text,
		}),
		[itemsPerPage, current, text],
	);

	const getBusinessHours = useEndpoint('GET', '/v1/livechat/business-hours');
	const { data, isLoading, isSuccess, isError, refetch } = useQuery(['livechat-buiness-hours', query], async () => getBusinessHours(query));

	const headers = (
		<>
			<GenericTable.HeaderCell>{t('Name')}</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>{t('Timezone')}</GenericTable.HeaderCell>
			<GenericTable.HeaderCell>{t('Open_Days')}</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x100'>{t('Enabled')}</GenericTable.HeaderCell>
			<GenericTable.HeaderCell width='x100'>{t('Remove')}</GenericTable.HeaderCell>
		</>
	);

	return (
		<>
			<FilterByText onChange={({ text }) => setText(text)} />
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.businessHours.length === 0 && <GenericNoResults />}
			{isSuccess && data?.businessHours.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.businessHours.map((businessHour) => (
								<BusinessHoursRow key={businessHour._id} reload={refetch} {...businessHour} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination
						divider
						current={current}
						itemsPerPage={itemsPerPage}
						count={data.total || 0}
						onSetItemsPerPage={onSetItemsPerPage}
						onSetCurrent={onSetCurrent}
						{...paginationProps}
					/>
				</>
			)}
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

export default BusinessHoursTable;
