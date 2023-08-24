import { Box, Icon, Margins, Pagination, Skeleton, Table, TableBody, TableCell, TableHead, TableRow, Tile } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import moment from 'moment';
import type { ReactElement } from 'react';
import React, { useMemo, useState } from 'react';

import Growth from '../../../../../../client/components/dataView/Growth';
import EngagementDashboardCardFilter from '../EngagementDashboardCardFilter';
import DownloadDataButton from '../dataView/DownloadDataButton';
import PeriodSelector from '../dataView/PeriodSelector';
import { usePeriodSelectorState } from '../dataView/usePeriodSelectorState';
import { useChannelsList } from './useChannelsList';

const ChannelsOverview = (): ReactElement => {
	const [period, periodSelectorProps] = usePeriodSelectorState('last 7 days', 'last 30 days', 'last 90 days');

	const t = useTranslation();

	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);

	const { data } = useChannelsList({
		period,
		offset: current,
		count: itemsPerPage,
	});

	const channels = useMemo(() => {
		if (!data) {
			return;
		}

		return data?.channels?.map(({ room: { t, name, usernames, ts, _updatedAt }, messages, diffFromLastWeek }) => ({
			t,
			name: name || usernames?.join(' × '),
			createdAt: ts,
			updatedAt: _updatedAt,
			messagesCount: messages,
			messagesVariation: diffFromLastWeek,
		}));
	}, [data]);

	return (
		<>
			<EngagementDashboardCardFilter>
				<PeriodSelector {...periodSelectorProps} />
				<DownloadDataButton
					attachmentName={`Channels_start_${data?.start}_end_${data?.end}`}
					headers={['Room type', 'Name', 'Messages', 'Last Update Date', 'Creation Date']}
					dataAvailable={!!data}
					dataExtractor={(): unknown[][] | undefined =>
						data?.channels?.map(({ room: { t, name, usernames, ts, _updatedAt }, messages }) => [
							t,
							name || usernames?.join(' × '),
							messages,
							_updatedAt,
							ts,
						])
					}
				/>
			</EngagementDashboardCardFilter>
			<Box>
				{channels && !channels.length && (
					<Tile fontScale='p1' color='hint' style={{ textAlign: 'center' }}>
						{t('No_data_found')}
					</Tile>
				)}
				{(!channels || channels.length) && (
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>#</TableCell>
								<TableCell>{t('Channel')}</TableCell>
								<TableCell>{t('Created')}</TableCell>
								<TableCell>{t('Last_active')}</TableCell>
								<TableCell>{t('Messages_sent')}</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{channels?.map(({ t, name, createdAt, updatedAt, messagesCount, messagesVariation }, i) => (
								<TableRow key={i}>
									<TableCell>{i + 1}.</TableCell>
									<TableCell>
										<Margins inlineEnd={4}>
											{(t === 'd' && <Icon name='at' />) || (t === 'p' && <Icon name='lock' />) || (t === 'c' && <Icon name='hashtag' />)}
										</Margins>
										{name}
									</TableCell>
									<TableCell>{moment(createdAt).format('L')}</TableCell>
									<TableCell>{moment(updatedAt).format('L')}</TableCell>
									<TableCell>
										{messagesCount} <Growth>{messagesVariation}</Growth>
									</TableCell>
								</TableRow>
							))}
							{!channels &&
								Array.from({ length: 5 }, (_, i) => (
									<TableRow key={i}>
										<TableCell>
											<Skeleton width='100%' />
										</TableCell>
										<TableCell>
											<Skeleton width='100%' />
										</TableCell>
										<TableCell>
											<Skeleton width='100%' />
										</TableCell>
										<TableCell>
											<Skeleton width='100%' />
										</TableCell>
										<TableCell>
											<Skeleton width='100%' />
										</TableCell>
									</TableRow>
								))}
						</TableBody>
					</Table>
				)}
				<Pagination
					current={current}
					itemsPerPage={itemsPerPage}
					itemsPerPageLabel={(): string => t('Items_per_page:')}
					showingResultsLabel={({ count, current, itemsPerPage }): string =>
						t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count)
					}
					count={data?.total || 0}
					onSetItemsPerPage={setItemsPerPage}
					onSetCurrent={setCurrent}
				/>
			</Box>
		</>
	);
};

export default ChannelsOverview;
