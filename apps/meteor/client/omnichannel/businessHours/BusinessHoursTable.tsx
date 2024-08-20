import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle } from '@rocket.chat/fuselage';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';

import FilterByText from '../../components/FilterByText';
import GenericNoResults from '../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableLoadingRow,
} from '../../components/GenericTable';
import { usePagination } from '../../components/GenericTable/hooks/usePagination';
import BusinessHoursRow from './BusinessHoursRow';

const BusinessHoursTable = () => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const query = useMemo(
		() => ({
			...(itemsPerPage && { count: itemsPerPage }),
			...(current && { offset: current }),
			name: text,
		}),
		[itemsPerPage, current, text],
	);

	const getBusinessHours = useEndpoint('GET', '/v1/livechat/business-hours');
	const { data, isLoading, isSuccess, isError, refetch } = useQuery(['livechat-getBusinessHours', query], async () =>
		getBusinessHours(query),
	);

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Timezone')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Open_Days')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x100'>{t('Enabled')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x100'>{t('Remove')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<FilterByText onChange={setText} />
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
								<BusinessHoursRow key={businessHour._id} {...businessHour} />
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
