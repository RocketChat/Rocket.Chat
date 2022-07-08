import { CheckBox, Table, Tag, Pagination } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { useState, useCallback, FC, Dispatch, SetStateAction, ChangeEvent } from 'react';

type ChannelDescriptor = {
	channel_id: string;
	name: string;
	is_archived: boolean;
	do_import: boolean;
};

type PrepareChannelsProps = {
	channelsCount: number;
	channels: ChannelDescriptor[];
	setChannels: Dispatch<SetStateAction<ChannelDescriptor[]>>;
};

const PrepareChannels: FC<PrepareChannelsProps> = ({ channels, channelsCount, setChannels }) => {
	const t = useTranslation();
	const [current, setCurrent] = useState(0);
	const [itemsPerPage, setItemsPerPage] = useState<25 | 50 | 100>(25);
	const showingResultsLabel = useCallback(
		({ count, current, itemsPerPage }) => t('Showing_results_of', current + 1, Math.min(current + itemsPerPage, count), count),
		[t],
	);
	const itemsPerPageLabel = useCallback(() => t('Items_per_page:'), [t]);

	if (!channels.length) {
		return null;
	}

	return (
		<>
			<Table>
				<Table.Head>
					<Table.Row>
						<Table.Cell width='x36'>
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
						</Table.Cell>
						<Table.Cell is='th'>{t('Name')}</Table.Cell>
						<Table.Cell is='th' align='end'></Table.Cell>
					</Table.Row>
				</Table.Head>
				<Table.Body>
					{channels.slice(current, current + itemsPerPage).map((channel) => (
						<Table.Row key={channel.channel_id}>
							<Table.Cell width='x36'>
								<CheckBox
									checked={channel.do_import}
									onChange={(event: ChangeEvent<HTMLInputElement>): void => {
										const { checked } = event.currentTarget;
										setChannels((channels) =>
											channels.map((_channel) => (_channel === channel ? { ..._channel, do_import: checked } : _channel)),
										);
									}}
								/>
							</Table.Cell>
							<Table.Cell>{channel.name}</Table.Cell>
							<Table.Cell align='end'>{channel.is_archived && <Tag variant='danger'>{t('Importer_Archived')}</Tag>}</Table.Cell>
						</Table.Row>
					))}
				</Table.Body>
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
