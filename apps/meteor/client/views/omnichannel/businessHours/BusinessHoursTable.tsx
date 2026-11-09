import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle, type TableColumnWidth } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableLoadingRow,
	usePaginatedQuery,
	usePagination,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useMemo, useState } from 'react';

import BusinessHoursRow from './BusinessHoursRow';
import FilterByText from '../../../components/FilterByText';

const BusinessHoursTable = () => {
	const t = useTranslation();
	const [text, setText] = useState('');

	const query = useDebouncedValue(
		useMemo(
			() => ({
				name: text,
			}),
			[text],
		),
		500,
	);

	const queryKey = ['livechat-getBusinessHours', query];
	const {
		current,
		itemsPerPage,
		setItemsPerPage: onSetItemsPerPage,
		setCurrent: onSetCurrent,
		...paginationProps
	} = usePagination({ resetKey: queryKey });

	const getBusinessHours = useEndpoint('GET', '/v1/livechat/business-hours');
	const { data, isLoading, isSuccess, isError, refetch } = usePaginatedQuery({
		query: {
			queryKey,
			queryFn: (page) => getBusinessHours({ ...query, ...page }),
		},
		itemsKey: 'businessHours',
		offset: current,
		count: itemsPerPage,
	});

	const columns: TableColumnWidth[] = ['auto', 'auto', 'auto', 'x100', 'x100'];

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Timezone')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Open_Days')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Enabled')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Remove')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
			{isLoading && (
				<GenericTable columns={columns}>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data?.businessHours.length === 0 && <GenericNoResults />}
			{isSuccess && data?.businessHours.length > 0 && (
				<>
					<GenericTable columns={columns} aria-label={t('Business_Hours')}>
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
