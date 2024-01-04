import { Box, Margins, TextInput, Icon, Throbber, States, StatesIcon, StatesTitle, StatesSubtitle } from '@rocket.chat/fuselage';
import { useTranslation } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, Dispatch, ReactElement, SetStateAction } from 'react';
import React, { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import {
	ContextualbarHeader,
	ContextualbarContent,
	ContextualbarTitle,
	ContextualbarIcon,
	ContextualbarClose,
	ContextualbarEmptyContent,
} from '../../../components/Contextualbar';
import ScrollableContentWrapper from '../../../components/ScrollableContentWrapper';
import { useRecordList } from '../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../lib/asyncState';
import { useOmnichannelRoom } from '../../room/contexts/RoomContext';
import ContactHistoryItem from './ContactHistoryItem';
import { useHistoryList } from './useHistoryList';

const ContactHistoryList = ({ setChatId, close }: { setChatId: Dispatch<SetStateAction<string>>; close: () => void }): ReactElement => {
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
			<ContextualbarHeader>
				<ContextualbarIcon name='history' />
				<ContextualbarTitle>{t('Contact_Chat_History')}</ContextualbarTitle>
				<ContextualbarClose onClick={close} />
			</ContextualbarHeader>

			<ContextualbarContent paddingInline={0}>
				<Box
					display='flex'
					flexDirection='row'
					p={24}
					borderBlockEndWidth='default'
					borderBlockEndStyle='solid'
					borderBlockEndColor='extra-light'
					flexShrink={0}
				>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline={4}>
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
					<Box pi={24} pb={12}>
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
				{phase !== AsyncStatePhase.LOADING && totalItemCount === 0 && <ContextualbarEmptyContent title={t('No_results_found')} />}
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
			</ContextualbarContent>
		</>
	);
};

export default ContactHistoryList;
