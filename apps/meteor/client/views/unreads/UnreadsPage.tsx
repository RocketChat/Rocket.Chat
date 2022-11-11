import { Accordion, Box, Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import Page from '../../components/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { MessageWithMdEnforced } from '../room/MessageList/lib/parseMessageTextToAstMarkdown';
import ResultMessage from './components/body/ResultMessage';
import AccordionHeader from './components/headers/AccordionHeader';
import UnreadsHeader from './components/headers/UnreadsHeader';
import MessageList from './components/messages/MessageList';
import { useUnreads } from './hooks/useUnreads';

import './styles/accordion.css';

const UnreadsPage: FC = () => {
	const t = useTranslation();
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const [loading, error, unreads, fetchMessages] = useUnreads();
	const [expandedItem, setExpandedItem] = useState(null);
	const [activeMessages, setActiveMessages] = useState<MessageWithMdEnforced[]>([]);

	const totalMessages = useMemo(() => {
		let total = 0;

		unreads?.forEach((room) => {
			total += room?.unread + (room?.tunread?.length || 0);
		});

		return total;
	}, [unreads]);

	async function handleMarkAll(): Promise<void> {
		if (unreads) await Promise.all(unreads.map((room) => readMessages({ rid: room.rid })));
		setExpandedItem(null);
		setActiveMessages([]);
	}

	async function handleMark(rid: string): Promise<void> {
		await readMessages({ rid });
		setExpandedItem(null);
		setActiveMessages([]);
	}

	async function getMessages(room: any): Promise<void> {
		if (expandedItem === room._id) {
			setExpandedItem(null);
			setActiveMessages([]);
			return;
		}
		const messages = await fetchMessages(room);
		setExpandedItem(room._id);
		setActiveMessages(messages);
	}

	useEffect(() => {
		unreads?.forEach(async (room) => {
			if (expandedItem === room._id) {
				const messages = await fetchMessages(room);
				setExpandedItem(room._id);
				setActiveMessages(messages);
			}
		});
	}, [unreads, expandedItem, fetchMessages]);

	return (
		<Page>
			{error && !loading && <ResultMessage />}
			{unreads && !unreads.length && !loading && <ResultMessage empty />}
			{!!loading && <PageSkeleton />}
			{unreads && unreads.length > 0 && !loading && (
				<>
					<Page.Header
						title={
							<UnreadsHeader
								totalMessages={totalMessages}
								totalRooms={unreads.length}
								handleMarkAll={(): Promise<void> => handleMarkAll()}
							/>
						}
					/>
					<Page.ScrollableContentWithShadow>
						<Box marginBlock='none' paddingBlock='none' marginInline='auto' width='full'>
							<Accordion borderBlockStyle='unset'>
								{unreads.map((room) => (
									<Accordion.Item
										key={room._id}
										className='unreadsAccordionHeader'
										title={<AccordionHeader room={room} />}
										expanded={expandedItem === room._id}
										onToggle={(): void => {
											getMessages(room);
										}}
									>
										<ButtonGroup flexDirection='row' justifyContent={'flex-end'}>
											<Button onClick={(): Promise<void> => handleMark(room.rid)}>
												<Icon name={'flag'} size='x20' margin='4x' />
												<span style={{ marginLeft: '10px' }}>{t('Mark_read')}</span>
											</Button>
										</ButtonGroup>
										<MessageList messages={activeMessages} rid={room.rid} />
									</Accordion.Item>
								))}
							</Accordion>
						</Box>
					</Page.ScrollableContentWithShadow>
				</>
			)}
		</Page>
	);
};

export default memo(UnreadsPage);
