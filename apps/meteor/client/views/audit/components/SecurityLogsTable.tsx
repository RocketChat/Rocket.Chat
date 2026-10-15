import type { IAuditServerAppActor, IAuditServerSystemActor, IAuditServerUserActor } from '@rocket.chat/core-typings';
import { Box, Button, Field, FieldLabel, Pagination, Text } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
	usePagination,
	GenericNoResults,
} from '@rocket.chat/ui-client';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns/format';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import SecurityLogDisplayModal from './SecurityLogDisplayModal';
import { SettingSelect } from './SettingSelect';
import DateRangePicker from './forms/DateRangePicker';
import type { DateRange } from '../utils/dateRange';
import { getTypeTranslation } from '../utils/getAppTypeTranslation';

const SecurityLogsTable = () => {
	const { t } = useTranslation();
	const [setting, setSetting] = useState('');

	const setModal = useSetModal();

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: undefined,
		end: undefined,
	}));

	const [query, setQuery] = useState({
		start: new Date(0).toISOString(),
		end: new Date().toISOString(),
		settingId: '',
	});

	const { paginatedQuery, queryKey, paginationProps } = usePagination({ query, getQueryKey: (query) => ['audit.settings', query] });

	const handleClearFilters = () => {
		setSetting('');
		setDateRange({ start: undefined, end: undefined });
		setQuery({
			start: new Date(0).toISOString(),
			end: new Date().toISOString(),
			settingId: '',
		});
	};

	const handleApplyFilters = () => {
		const { start, end } = dateRange;
		setQuery({
			start: start?.toISOString() ?? new Date(0).toISOString(),
			end: end?.toISOString() ?? new Date().toISOString(),
			settingId: setting,
		});
	};

	const handleItemClick = ({
		actor,
		timestamp,
		setting,
		changedFrom,
		changedTo,
	}: {
		actor: IAuditServerUserActor | IAuditServerSystemActor | IAuditServerAppActor;
		timestamp: string;
		setting: unknown;
		changedFrom: string;
		changedTo: string;
	}) => {
		setModal(
			<SecurityLogDisplayModal
				timestamp={timestamp}
				actor={actor}
				setting={String(setting)}
				changedFrom={changedFrom}
				changedTo={changedTo}
				onCancel={() => setModal(null)}
			/>,
		);
	};

	const getAudits = useEndpoint('GET', '/v1/audit.settings');

	const { data, isLoading, isSuccess } = useQuery({
		queryKey,

		queryFn: async () => {
			return getAudits(paginatedQuery);
		},
	});

	return (
		<>
			<Box marginBlock={16} display='flex' flexWrap='wrap' alignItems='flex-end'>
				<Box flexGrow={1}>
					<Field>
						<Box display='flex' flexDirection='column' paddingInline='x4'>
							<FieldLabel>{t('Date')}</FieldLabel>
							<DateRangePicker flexGrow={1} value={dateRange} onChange={setDateRange} />
						</Box>
					</Field>
				</Box>
				<Box width={300} flexShrink={0}>
					<Field>
						<Box display='flex' flexDirection='column' paddingInline='x4'>
							<FieldLabel>{t('Setting')}</FieldLabel>
							<SettingSelect value={setting} onChange={setSetting} />
						</Box>
					</Field>
				</Box>
				<Box role='group' display='flex' alignItems='center' gap='x20' paddingInline='x4' paddingBlockStart='x12'>
					<Button variant='secondary' onClick={handleClearFilters}>
						{t('Clear_filters')}
					</Button>
					<Button variant='primary' onClick={handleApplyFilters}>
						{t('Apply_filters')}
					</Button>
				</Box>
			</Box>

			{isLoading && (
				<GenericTable>
					<GenericTableHeader>
						<GenericTableHeaderCell>{t('Actor')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Setting')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Changed_from')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Changed_to')}</GenericTableHeaderCell>
					</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingRow cols={5} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && data.total === 0 && (
				<GenericNoResults
					title={t('No_results_found')}
					description={t('Try_different_filters')}
					buttonTitle={t('Clear_filters')}
					buttonAction={handleClearFilters}
				/>
			)}
			{isSuccess && data.total > 0 && (
				<GenericTable striped>
					<GenericTableHeader>
						<GenericTableHeaderCell>{t('Actor')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Setting')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Changed_from')}</GenericTableHeaderCell>
						<GenericTableHeaderCell>{t('Changed_to')}</GenericTableHeaderCell>
					</GenericTableHeader>
					<GenericTableBody>
						{data.events.map((item) => {
							const setting = item.data.find((item) => item.key === 'id')?.value;
							const previous = item.data.find((item) => item.key === 'previous')?.value || t('Empty');
							const current = item.data.find((item) => item.key === 'current')?.value || t('Empty');
							return (
								<GenericTableRow
									key={item._id}
									role='link'
									action
									tabIndex={0}
									onClick={() =>
										handleItemClick({
											actor: item.actor,
											timestamp: item.ts,
											setting,
											changedFrom: String(previous),
											changedTo: String(current),
										})
									}
								>
									<GenericTableCell truncate>
										<Box display='flex' alignItems='center' minHeight={28}>
											{item.actor.type === 'user' && (
												<Box marginInlineEnd={4}>
													<UserAvatar size='x24' userId={item.actor._id} />
												</Box>
											)}
											<Text fontScale='p2m' truncate color='default'>
												{item.actor.type === 'user' ? item.actor.username : t(getTypeTranslation(item.actor.type))}
											</Text>
										</Box>
									</GenericTableCell>
									<GenericTableCell truncate>{format(new Date(item.ts), 'MMMM d yyyy, h:mm:ss a')}</GenericTableCell>
									<GenericTableCell truncate title={setting && String(setting)}>
										{setting && String(setting)}
									</GenericTableCell>
									<GenericTableCell truncate>{String(previous)}</GenericTableCell>
									<GenericTableCell truncate>{String(current)}</GenericTableCell>
								</GenericTableRow>
							);
						})}
					</GenericTableBody>
				</GenericTable>
			)}
			<Pagination divider {...paginationProps} />
		</>
	);
};

export default SecurityLogsTable;
