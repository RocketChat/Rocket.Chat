import type { ICronHistoryItem, Serialized } from '@rocket.chat/core-typings';
import { Box, Pagination, Tag } from '@rocket.chat/fuselage';
import { useMediaQuery } from '@rocket.chat/fuselage-hooks';
import {
	GenericTable,
	GenericTableBody,
	GenericTableCell,
	GenericTableHeader,
	GenericTableHeaderCell,
	GenericTableLoadingTable,
	GenericTableRow,
	usePagination,
} from '@rocket.chat/ui-client';
import { useEndpoint } from '@rocket.chat/ui-contexts';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

import { formatDuration, STATUS_LABEL, statusVariant } from './helpers';
import GenericNoResults from '../../../components/GenericNoResults';
import { useFormatDateAndTime } from '../../../hooks/useFormatDateAndTime';

const HISTORY_TYPE_LABELS = {
	system: 'System',
	app: 'Apps',
	omnichannel: 'Omnichannel',
} as const;

const deriveResult = (entry: Serialized<ICronHistoryItem>): 'running' | 'completed' | 'failed' => {
	if (entry.error) {
		return 'failed';
	}
	if (!entry.finishedAt) {
		return 'running';
	}
	return 'completed';
};

const RecentHistoryTable = () => {
	const { t } = useTranslation();
	const formatDateAndTime = useFormatDateAndTime();
	const isDesktopOrLarger = useMediaQuery('(min-width: 1024px)');
	const { current, itemsPerPage, setItemsPerPage, setCurrent, ...paginationProps } = usePagination();

	const getHistory = useEndpoint('GET', '/v1/cron.history');

	const { data, isLoading, isSuccess, isError } = useQuery({
		queryKey: ['cron-history-all', itemsPerPage, current],
		queryFn: () => getHistory({ count: itemsPerPage, offset: current }),
		meta: {
			apiErrorToastMessage: true,
		},
	});

	const history = data?.history || [];

	const headers = (
		<>
			<GenericTableHeaderCell width='x300'>{t('Name')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x120'>{t('Type')}</GenericTableHeaderCell>
			<GenericTableHeaderCell width='x120'>{t('Result')}</GenericTableHeaderCell>
			{isDesktopOrLarger && (
				<>
					<GenericTableHeaderCell>{t('Started_At')}</GenericTableHeaderCell>
					<GenericTableHeaderCell>{t('Duration')}</GenericTableHeaderCell>
				</>
			)}
		</>
	);

	return (
		<>
			{isError && (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults icon='warning' title={t('Something_went_wrong')} />
				</Box>
			)}
			{isSuccess && history.length === 0 && (
				<Box display='flex' justifyContent='center' height='full'>
					<GenericNoResults title={t('No_history_available')} />
				</Box>
			)}
			{isLoading && (
				<GenericTable>
					<GenericTableHeader>{headers}</GenericTableHeader>
					<GenericTableBody>
						<GenericTableLoadingTable headerCells={isDesktopOrLarger ? 5 : 3} />
					</GenericTableBody>
				</GenericTable>
			)}
			{isSuccess && history.length > 0 && (
				<>
					<GenericTable>
						<GenericTableHeader>{headers}</GenericTableHeader>
						<GenericTableBody>
							{history.map((entry) => {
								const entryResult = deriveResult(entry);
								return (
									<GenericTableRow key={entry._id}>
										<GenericTableCell withTruncatedText fontScale='p2'>
											{entry.name}
										</GenericTableCell>
										<GenericTableCell>
											<Box fontScale='p2'>{entry.type ? t(HISTORY_TYPE_LABELS[entry.type]) : ''}</Box>
										</GenericTableCell>
										<GenericTableCell>
											<Box display='flex'>
												<Tag variant={statusVariant(entryResult)}>{t(STATUS_LABEL[entryResult])}</Tag>
											</Box>
										</GenericTableCell>
										{isDesktopOrLarger && (
											<>
												<GenericTableCell withTruncatedText>{entry.startedAt ? formatDateAndTime(entry.startedAt) : ''}</GenericTableCell>
												<GenericTableCell withTruncatedText>{formatDuration(entry.startedAt, entry.finishedAt)}</GenericTableCell>
											</>
										)}
									</GenericTableRow>
								);
							})}
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

export default RecentHistoryTable;
