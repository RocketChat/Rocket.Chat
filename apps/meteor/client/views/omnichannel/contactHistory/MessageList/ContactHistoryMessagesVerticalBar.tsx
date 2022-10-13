import { Box, Callout, Icon, Margins, TextInput, Throbber } from '@rocket.chat/fuselage';
import { useSetting, useTranslation } from '@rocket.chat/ui-contexts';
import React, { ChangeEvent, Dispatch, ReactElement, SetStateAction, useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';

import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import VerticalBar from '../../../../components/VerticalBar';
import { useRecordList } from '../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../lib/asyncState';
import { isMessageNewDay } from '../../../room/MessageList/lib/isMessageNewDay';
import { isMessageSequential } from '../../../room/MessageList/lib/isMessageSequential';
import ContactHistoryMessage from './ContactHistoryMessage';
import { useHistoryMessageList } from './useHistoryMessageList';

const ContactHistoryMessagesVerticalBar = ({
	chatId,
	setChatId,
	close,
}: {
	chatId: string;
	setChatId: Dispatch<SetStateAction<string>>;
	close: () => void;
}): ReactElement => {
	const [text, setText] = useState('');
	const t = useTranslation();
	const { itemsList: messageList, loadMoreItems } = useHistoryMessageList(
		useMemo(() => ({ roomId: chatId, filter: text }), [chatId, text]),
	);

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setText(event.currentTarget.value);
	};

	const { phase, error, items: messages, itemCount: totalItemCount } = useRecordList(messageList);
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));

	return (
		<>
			<VerticalBar.Header>
				<VerticalBar.Action onClick={(): void => setChatId('')} title={t('Back')} name='arrow-back' />
				<VerticalBar.Icon name='history' />
				<VerticalBar.Text>{t('Chat_History')}</VerticalBar.Text>
				<VerticalBar.Close onClick={close} />
			</VerticalBar.Header>

			<VerticalBar.Content paddingInline={0}>
				<Box
					display='flex'
					flexDirection='row'
					p='x24'
					borderBlockEndWidth='x2'
					borderBlockEndStyle='solid'
					borderBlockEndColor='neutral-200'
					flexShrink={0}
				>
					<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline='x4'>
							<TextInput
								placeholder={t('Search')}
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
					<Callout mi='x24' type='danger'>
						{error.toString()}
					</Callout>
				)}
				{phase !== AsyncStatePhase.LOADING && totalItemCount === 0 && (
					<Box p='x24' color='neutral-600' textAlign='center' width='full'>
						{t('No_results_found')}
					</Box>
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
							data={messages}
							components={{ Scroller: ScrollableContentWrapper as any }}
							itemContent={(index, data): ReactElement => {
								const lastMessage = messages[index - 1];
								const isSequential = isMessageSequential(data, lastMessage, messageGroupingPeriod);
								const isNewDay = isMessageNewDay(data, lastMessage);
								return <ContactHistoryMessage message={data} sequential={isSequential} isNewDay={isNewDay} />;
							}}
						/>
					)}
				</Box>
			</VerticalBar.Content>
		</>
	);
};

export default ContactHistoryMessagesVerticalBar;
