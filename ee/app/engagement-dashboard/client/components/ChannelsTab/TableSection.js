import { Box, Icon, Margins, Pagination, Select, Skeleton, Table, Tile } from '@rocket.chat/fuselage';
import moment from 'moment';
import React, { useMemo, useState } from 'react';

import { useTranslation } from '../../../../../../client/contexts/TranslationContext';
import { useEndpointData } from '../../../../../../client/hooks/useEndpointData';
import Growth from '../../../../../../client/components/data/Growth';
import { Section } from '../Section';
import { ActionButton } from '../../../../../../client/components/basic/Buttons/ActionButton';
import { saveFile } from '../../../../../../client/lib/saveFile';

const convertDataToCSV = (data) => `// type, name, messagesCount, updatedAt, createdAt
${ data.map(({ createdAt, messagesCount, name, t, updatedAt }) => `${ t }, ${ name }, ${ messagesCount }, ${ updatedAt }, ${ createdAt }`).join('\n') }`;

export function TableSection() {
	const t = useTranslation();

	const periodOptions = useMemo(() => [
		['last 7 days', t('Last_7_days')],
		['last 30 days', t('Last_30_days')],
		['last 90 days', t('Last_90_days')],
	], [t]);

	const [periodId, setPeriodId] = useState('last 7 days');

	const period = useMemo(() => {
		switch (periodId) {
			case 'last 7 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(7, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};

			case 'last 30 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(30, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};

			case 'last 90 days':
				return {
					start: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(90, 'days'),
					end: moment().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).subtract(1),
				};
		}
	}, [periodId]);

	const handlePeriodChange = (periodId) => setPeriodId(periodId);

	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState(25);

	const params = useMemo(() => ({
		start: period.start.toISOString(),
		end: period.end.toISOString(),
		offset: current,
		count: itemsPerPage,
	}), [period, current, itemsPerPage]);

	const data = useEndpointData('engagement-dashboard/channels/list', params);

	const channels = useMemo(() => {
		if (!data) {
			return;
		}

		return data.channels.map(({
			room: { t, name, usernames, ts, _updatedAt },
			messages,
			diffFromLastWeek,
		}) => ({
			t,
			name: name || usernames.join(' × '),
			createdAt: ts,
			updatedAt: _updatedAt,
			messagesCount: messages,
			messagesVariation: diffFromLastWeek,
		}));
	}, [data]);

	const downloadData = () => {
		saveFile(convertDataToCSV(channels), `Channels_start_${ params.start }_end_${ params.end }.csv`);
	};

	return <Section filter={<><Select options={periodOptions} value={periodId} onChange={handlePeriodChange} /><ActionButton mis='x16' disabled={!channels} onClick={downloadData} aria-label={t('Download_Info')} icon='download'/></>}>
		<Box>
			{channels && !channels.length && <Tile fontScale='p1' color='info' style={{ textAlign: 'center' }}>
				{t('No_data_found')}
			</Tile>}
			{(!channels || channels.length)
			&& <Table>
				<Table.Head>
					<Table.Row>
						<Table.Cell>{'#'}</Table.Cell>
						<Table.Cell>{t('Channel')}</Table.Cell>
						<Table.Cell>{t('Created')}</Table.Cell>
						<Table.Cell>{t('Last_active')}</Table.Cell>
						<Table.Cell>{t('Messages_sent')}</Table.Cell>
					</Table.Row>
				</Table.Head>
				<Table.Body>
					{channels && channels.map(({ t, name, createdAt, updatedAt, messagesCount, messagesVariation }, i) =>
						<Table.Row key={i}>
							<Table.Cell>{i + 1}.</Table.Cell>
							<Table.Cell>
								<Margins inlineEnd='x4'>
									{(t === 'd' && <Icon name='at' />)
								|| (t === 'c' && <Icon name='lock' />)
								|| (t === 'p' && <Icon name='hashtag' />)}
								</Margins>
								{name}
							</Table.Cell>
							<Table.Cell>
								{moment(createdAt).format('L')}
							</Table.Cell>
							<Table.Cell>
								{moment(updatedAt).format('L')}
							</Table.Cell>
							<Table.Cell>
								{messagesCount} <Growth>{messagesVariation}</Growth>
							</Table.Cell>
						</Table.Row>)}
					{!channels && Array.from({ length: 5 }, (_, i) =>
						<Table.Row key={i}>
							<Table.Cell>
								<Skeleton width='100%' />
							</Table.Cell>
							<Table.Cell>
								<Skeleton width='100%' />
							</Table.Cell>
							<Table.Cell>
								<Skeleton width='100%' />
							</Table.Cell>
							<Table.Cell>
								<Skeleton width='100%' />
							</Table.Cell>
							<Table.Cell>
								<Skeleton width='100%' />
							</Table.Cell>
						</Table.Row>)}
				</Table.Body>
			</Table>}
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				itemsPerPageLabel={() => t('Items_per_page:')}
				showingResultsLabel={({ count, current, itemsPerPage }) =>
					t('Showing results %s - %s of %s', current + 1, Math.min(current + itemsPerPage, count), count)}
				count={(data && data.total) || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
			/>
		</Box>
	</Section>;
}
