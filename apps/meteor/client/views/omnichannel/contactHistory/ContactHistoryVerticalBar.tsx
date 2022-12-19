import { Box, Margins, TextInput, Icon, Throbber, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../components/VerticalBar';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import ContactHistoryItem from './ContactHistoryItem';
import { useHistoryList } from './useHistoryList';

const ContactHistoryVerticalBar = ({
	setChatId,
	close,
}: {
	setChatId: Dispatch<SetStateAction<string>>;
	close: () => void;
}): ReactElement => {
	const [text, setText] = useState('');
	const t = useTranslation();
	const room = useOmnichannelRoom();
	const { itemsList: historyList, loadMoreItems } = useHistoryList(
		useMemo(() => ({ roomId: room._id, filter: text, visitorId: room.v._id }), [room, text]),
	);

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setText(event.currentTarget.value);
	};

	const { phase, error, items: history, itemCount: totalItemCount } = useRecordList(historyList);

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Icon name='history' />
				<VerticalBar.Text>{t('Contact_Chat_History')}</VerticalBar.Text>
				<VerticalBar.Close onClick={close} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0}>
				<Box
					display='flex'
					flexDirection='row'
					p='x24'
					borderBlockEndWidth='x2'
					borderBlockEndStyle='solid'
					borderBlockEndColor='extra-light'
					flexShrink={0}
				>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search_Chat_History')}
								value={text}
								onChange={handleSearchChange}
								addon={<Icon name='magnifier' size='x20' />}
							/>
						</Margins>
					</Box>
				</Box>
				{phase === AsyncStatePhase.LOADING && (
					<Box pi='x24' pb='x12'>
						<Throbber size='x12' />
					</Box>
				)}
				{error && (
					<States>
						<StatesIcon name='warning' variation='danger' />
						<StatesTitle>{t('Something_went_wrong')}</StatesTitle>
						<StatesSubtitle>{error.toString()}</StatesSubtitle>
					</States>
				)}
				{phase !== AsyncStatePhase.LOADING && totalItemCount === 0 && (
					<States>
						<StatesIcon name='magnifier' />
						<StatesTitle>{t('No_results_found')}</StatesTitle>
					</States>
				)}
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
					{!error && totalItemCount > 0 && history.length > 0 && (
						<Virtuoso
							totalCount={totalItemCount}
							endReached={
								phase === AsyncStatePhase.LOADING
									? (): void => undefined
									: (start): unknown => loadMoreItems(start, Math.min(50, totalItemCount - start))
							}
							overscan={25}
							data={history}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(index, data): ReactElement => <ContactHistoryItem key={index} history={data} setChatId={setChatId} />}
						/>
					)}
				</Box>
			</VerticalBar.Content>
		</>
	);
};

export default ContactHistoryVerticalBar;
