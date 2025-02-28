import {
	Box,
	Button,
	ButtonGroup,
	ContextualbarFooter,
	Icon,
	IconButton,
	Margins,
	States,
	StatesIcon,
	StatesSubtitle,
	StatesTitle,
	TextInput,
	Throbber,
} from '@rocket.chat/fuselage';
import { useDebouncedValue, useResizeObserver } from '@rocket.chat/fuselage-hooks';
import { useSetting, useUserPreference, useUserId } from '@rocket.chat/ui-contexts';
import type { ChangeEvent, ReactElement } from 'react';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Virtuoso } from 'react-virtuoso';

import { ContextualbarContent, ContextualbarEmptyContent } from '../../../../../components/Contextualbar';
import { VirtualizedScrollbars } from '../../../../../components/CustomScrollbars';
import { useRecordList } from '../../../../../hooks/lists/useRecordList';
import { AsyncStatePhase } from '../../../../../lib/asyncState';
import { isMessageNewDay } from '../../../../room/MessageList/lib/isMessageNewDay';
import { isMessageSequential } from '../../../../room/MessageList/lib/isMessageSequential';
import ContactHistoryMessage from '../../../contactHistory/MessageList/ContactHistoryMessage';
import { useHistoryMessageList } from '../../../contactHistory/MessageList/useHistoryMessageList';

type ContactHistoryMessagesListProps = {
	chatId: string;
	onBack: () => void;
	onOpenRoom?: () => void;
};

const ContactInfoHistoryMessages = ({ chatId, onBack, onOpenRoom }: ContactHistoryMessagesListProps) => {
	const { t } = useTranslation();
	const [text, setText] = useState('');
	const showUserAvatar = !!useUserPreference<boolean>('displayAvatars');
	const userId = useUserId();

	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 1 } = {} } = useResizeObserver<HTMLElement>({
		debounceDelay: 200,
	});

	const query = useDebouncedValue(
		useMemo(() => ({ roomId: chatId, filter: text }), [chatId, text]),
		500,
	);

	const { itemsList: messageList, loadMoreItems } = useHistoryMessageList(query, userId);

	const handleSearchChange = (event: ChangeEvent<HTMLInputElement>): void => {
		setText(event.currentTarget.value);
	};

	const { phase, error, items: messages, itemCount: totalItemCount } = useRecordList(messageList);
	const messageGroupingPeriod = Number(useSetting('Message_GroupingPeriod'));

	return (
		<>
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
					<Box display='flex' alignItems='center' flexDirection='row' flexGrow={1} mi='neg-x4'>
						<Margins inline={4}>
							<TextInput
								placeholder={t('Search')}
								value={text}
								onChange={handleSearchChange}
								addon={<Icon name='magnifier' size='x20' />}
							/>
							<IconButton title={t('Back')} small icon='back' onClick={onBack} />
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
				<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex' ref={ref}>
					{!error && totalItemCount > 0 && history.length > 0 && (
						<VirtualizedScrollbars>
							<Virtuoso
								totalCount={totalItemCount}
								initialTopMostItemIndex={{ index: 'LAST' }}
								followOutput
								style={{
									height: blockSize,
									width: inlineSize,
								}}
								endReached={
									phase === AsyncStatePhase.LOADING
										? (): void => undefined
										: (start): void => {
												loadMoreItems(start, Math.min(50, totalItemCount - start));
											}
								}
								overscan={25}
								data={messages}
								itemContent={(index, data): ReactElement => {
									const lastMessage = messages[index - 1];
									const isSequential = isMessageSequential(data, lastMessage, messageGroupingPeriod);
									const isNewDay = isMessageNewDay(data, lastMessage);
									return (
										<ContactHistoryMessage message={data} sequential={isSequential} isNewDay={isNewDay} showUserAvatar={showUserAvatar} />
									);
								}}
							/>
						</VirtualizedScrollbars>
					)}
				</Box>
			</ContextualbarContent>
			{onOpenRoom && (
				<ContextualbarFooter>
					<ButtonGroup stretch>
						<Button onClick={onOpenRoom}>{t('Open_chat')}</Button>
					</ButtonGroup>
				</ContextualbarFooter>
			)}
		</>
	);
};

export default ContactInfoHistoryMessages;
