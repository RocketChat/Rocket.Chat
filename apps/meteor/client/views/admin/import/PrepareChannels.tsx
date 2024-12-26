import { CheckBox, Table, Tag, Pagination, TableHead, TableRow, TableCell, TableBody } from '@rocket.chat/fuselage';
import type { Dispatch, SetStateAction, ChangeEvent } from 'react';
import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import type { ChannelDescriptor } from './ChannelDescriptor';

type PrepareChannelsProps = {
	channelsCount: number;
	channels: ChannelDescriptor[];
	setChannels: Dispatch<SetStateAction<ChannelDescriptor[]>>;
};

// TODO: review inner logic
const PrepareChannels = ({ channels, channelsCount, setChannels }: PrepareChannelsProps) => {
	const { t } = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);
	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }: { count: number; current: number; itemsPerPage: 25 | 50 | 100 }) =>
			t('Showing_results_of', { postProcess: 'sprintf', sprintf: [current + 1, Math.min(current + itemsPerPage, count), count] }),
		[t],
	);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	if (!channels.length) {
		return null;
	}

	return (
		<>
			<Table>
				<TableHead>
					<TableRow>
						<TableCell width='x36'>
							<CheckBox
								checked={channelsCount > 0}
								indeterminate={channelsCount > 0 && channelsCount !== channels.length}
								onChange={(): void => {
									setChannels((channels) => {
										const hasCheckedArchivedChannels = channels.some(({ is_archived, do_import }) => is_archived && do_import);
										const isChecking = channelsCount === 0;

										if (isChecking) {
											return channels.map((channel) => ({ ...channel, do_import: true }));
										}

										if (hasCheckedArchivedChannels) {
											return channels.map((channel) => (channel.is_archived ? { ...channel, do_import: false } : channel));
										}

										return channels.map((channel) => ({ ...channel, do_import: false }));
									});
								}}
							/>
						</TableCell>
						<TableCell is='th'>{t('Name')}</TableCell>
						<TableCell is='th' align='end'></TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					{channels.slice(current, current + itemsPerPage).map((channel) => (
						<TableRow key={channel.channel_id}>
							<TableCell width='x36'>
								<CheckBox
									checked={channel.do_import}
									onChange={(event: ChangeEvent<HTMLInputElement>): void => {
										const { checked } = event.currentTarget;
										setChannels((channels) =>
											channels.map((_channel) => (_channel === channel ? { ..._channel, do_import: checked } : _channel)),
										);
									}}
								/>
							</TableCell>
							<TableCell>{channel.name}</TableCell>
							<TableCell align='end'>{channel.is_archived && <Tag variant='danger'>{t('Importer_Archived')}</Tag>}</TableCell>
						</TableRow>
					))}
				</TableBody>
			</Table>
			<Pagination
				current={current}
				itemsPerPage={itemsPerPage}
				itemsPerPageLabel={itemsPerPageLabel}
				showingResultsLabel={showingResultsLabel}
				count={channels.length || 0}
				onSetItemsPerPage={setItemsPerPage}
				onSetCurrent={setCurrent}
			/>
		</>
	);
};

export default PrepareChannels;
