import { Box, Button, ButtonGroup, Field, FieldLabel, Margins, Pagination } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import { SecurityLogDisplay } from './SecurityLogDisplayModal';
import { SettingSelect } from './SettingSelect';
import DateRangePicker from './forms/DateRangePicker';
import GenericNoResults from '../../../components/GenericNoResults';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingRow,
	GenericTableRow,
} from '../../../components/GenericTable';
import { usePagination } from '../../../components/GenericTable/hooks/usePagination';
import type { DateRange } from '../utils/dateRange';
import { createEndOfToday, createStartOfToday } from '../utils/dateRange';

const SecurityLogsTable = (): ReactElement => {
	const { t } = useTranslation();
	const [setting, setSetting] = useState('');

	const setModal = useSetModal();

	const [dateRange, setDateRange] = useState<DateRange>(() => ({
		start: createStartOfToday(),
		end: createEndOfToday(),
	}));

	const [query, setQuery] = useState({
		start: new Date(0).toISOString(),
		end: new Date().toISOString(),
		settingId: '',
	});

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	// const handleExportJson = () => {
	// 	return undefined;
	// };

	const handleClearFilters = () => {
		setSetting('');
		setDateRange({ start: createStartOfToday(), end: createEndOfToday() });
		setQuery({
			start: new Date(0).toISOString(),
			end: new Date().toISOString(),
			settingId: '',
		});
		onSetCurrent(0);
	};

	const handleApplyFilters = () => {
		const { start, end } = dateRange;
		setQuery({
			start: start?.toISOString() ?? new Date(0).toISOString(),
			end: end?.toISOString() ?? new Date().toISOString(),
			settingId: setting,
		});
		onSetCurrent(0);
	};

	const handleItemClick = ({
		actor,
		timestamp,
		setting,
		changedFrom,
		changedTo,
	}: {
		actor: string;
		timestamp: string;
		setting: unknown;
		changedFrom: string;
		changedTo: string;
	}) => {
		setModal(
			<SecurityLogDisplay
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
		queryKey: ['audit.settings', query, itemsPerPage, current],

		queryFn: async () => {
			return getAudits({ ...query, ...(itemsPerPage && { count: itemsPerPage }), ...(current && { offset: current }) });
		},
	});

	const headers = (
		<>
			<GenericTableHeaderCell>{t('Actor')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Timestamp')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Setting')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Changed_from')}</GenericTableHeaderCell>
			<GenericTableHeaderCell>{t('Changed_to')}</GenericTableHeaderCell>
		</>
	);

	return (
		<>
			<Box mb={16} display='flex' flexWrap='nowrap' alignItems='flex-end'>
				<Field flexShrink={1}>
					<Margins inline={6}>
						<FieldLabel>{t('Date')}</FieldLabel>
						<DateRangePicker display='flex' flexGrow={1} value={dateRange} onChange={setDateRange} />
					</Margins>
				</Field>
				<Field width={300}>
					<Margins inline={6}>
						<FieldLabel>{t('Setting')}</FieldLabel>
						<SettingSelect value={setting} onChange={setSetting} />
					</Margins>
				</Field>
				<ButtonGroup>
					<Margins inline={6}>
						{/* <Button secondary onClick={handleExportJson}>
							{t('Export_JSON')}
						</Button> */}
						<Button secondary onClick={handleClearFilters}>
							{t('Clear_filters')}
						</Button>
						<Button primary onClick={handleApplyFilters}>
							{t('Apply_filters')}
						</Button>
					</Margins>
				</ButtonGroup>
			</Box>

			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
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
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						{data.events.map((item) => (
							<GenericTableRow
								key={item.ts}
								role='link'
								action
								tabIndex={0}
								onClick={() =>
									handleItemClick({
										actor: item.actor.type === 'user' ? item.actor.username : item.actor.type,
										timestamp: new Date(item.ts).toDateString(),
										setting: item.data[0].value,
										changedFrom: String(item.data[1].value),
										changedTo: String(item.data[2].value),
									})
								}
							>
								<GenericTableCell withTruncatedText>
									<Box display='flex' alignItems='center'>
										{item.actor.type === 'user' && (
											<Box mie={4}>
												<UserAvatar size='x24' username={item.actor.username} />
											</Box>
										)}
										<Box fontScale='p2m' withTruncatedText color='default'>
											{item.actor.type === 'user' ? item.actor.username : item.actor.type}
										</Box>
									</Box>
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{item.ts}</GenericTableCell>
								<GenericTableCell withTruncatedText title={t(String(item.data[0].value))}>
									{String(item.data[0].value)}
								</GenericTableCell>
								<GenericTableCell withTruncatedText>{String(item.data[1].value)}</GenericTableCell>
								<GenericTableCell withTruncatedText>{String(item.data[2].value)}</GenericTableCell>
							</GenericTableRow>
						))}
					</GenericTableBody>
				</GenericTable>
			)}
			<Pagination
				divider
				current={current}
				itemsPerPage={itemsPerPage}
				count={data?.total || 0}
				onSetItemsPerPage={onSetItemsPerPage}
				onSetCurrent={onSetCurrent}
				{...paginationProps}
			/>
		</>
	);
};

export default SecurityLogsTable;
