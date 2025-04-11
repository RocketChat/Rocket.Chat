import type { IAuditServerAppActor, IAuditServerSystemActor, IAuditServerUserActor } from '@rocket.chat/core-typings';
import { Box, Button, ButtonGroup, Field, FieldLabel, Margins, Pagination } from '@rocket.chat/fuselage';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEndpoint, useSetModal } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { useState, type ReactElement } from 'react';
import { useTranslation } from 'react-i18next';

import SecurityLogDisplayModal from './SecurityLogDisplayModal';
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
import { getTypeTranslation } from '../utils/getAppTypeTranslation';

const SecurityLogsTable = (): ReactElement => {
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

	const { current, itemsPerPage, setItemsPerPage: onSetItemsPerPage, setCurrent: onSetCurrent, ...paginationProps } = usePagination();

	const handleClearFilters = () => {
		setSetting('');
		setDateRange({ start: undefined, end: undefined });
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
		queryKey: ['audit.settings', query, itemsPerPage, current],

		queryFn: async () => {
			return getAudits({ ...query, ...(itemsPerPage && { count: itemsPerPage }), ...(current && { offset: current }) });
		},
	});

	return (
		<>
			<Box mb={16} display='flex' flexWrap='wrap' alignItems='flex-end'>
				<Field width='unset' flexShrink={1} flexGrow={1}>
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
					<Margins blockStart={12} inline={6}>
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
									height={44}
									onClick={() =>
										handleItemClick({
											actor: item.actor,
											timestamp: new Date(item.ts).toDateString(),
											setting,
											changedFrom: String(previous),
											changedTo: String(current),
										})
									}
								>
									<GenericTableCell withTruncatedText>
										<Box display='flex' alignItems='center'>
											{item.actor.type === 'user' && (
												<Box mie={4}>
													<UserAvatar size='x24' userId={item.actor._id} />
												</Box>
											)}
											<Box fontScale='p2m' withTruncatedText color='default'>
												{item.actor.type === 'user' ? item.actor.username : t(getTypeTranslation(item.actor.type))}
											</Box>
										</Box>
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{format(new Date(item.ts), 'MMMM d yyyy, h:mm:ss a')}</GenericTableCell>
									<GenericTableCell withTruncatedText title={setting && String(setting)}>
										{setting && String(setting)}
									</GenericTableCell>
									<GenericTableCell withTruncatedText>{String(previous)}</GenericTableCell>
									<GenericTableCell withTruncatedText>{String(current)}</GenericTableCell>
								</GenericTableRow>
							);
						})}
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
