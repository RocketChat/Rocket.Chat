import { Pagination, States, StatesIcon, StatesActions, StatesAction, StatesTitle } from '@rocket.chat/fuselage';
import { useDebouncedValue } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableHeaderCell,
	GenericTableHeader,
	GenericTableLoadingRow,
	usePaginatedQueryKey,
} from '@rocket.chat/ui-client';
import { useTranslation, useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';

import BusinessHoursRow from './BusinessHoursRow';
import FilterByText from '../../../components/FilterByText';
import GenericNoResults from '../../../components/GenericNoResults';

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
	const { paginatedQuery, queryKey, paginationProps } = usePaginatedQueryKey({
		query,
		getQueryKey: (query) => ['livechat-getBusinessHours', query] as const,
	});

	const getBusinessHours = useEndpoint('GET', '/v1/livechat/business-hours');
	const { data, isLoading, isSuccess, isError, refetch } = useQuery({
		queryKey,

		queryFn: async () => getBusinessHours(paginatedQuery),
	});

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
			<FilterByText value={text} onChange={(event) => setText(event.target.value)} />
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
					<GenericTable aria-label={t('Business_Hours')}>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{data?.businessHours.map((businessHour) => (
								<BusinessHoursRow key={businessHour._id} {...businessHour} />
							))}
						</GenericTableBody>
					</GenericTable>
					<Pagination divider {...paginationProps} />
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
