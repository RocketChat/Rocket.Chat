import { Accordion, Box, Button, ButtonGroup, Icon, Skeleton } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import MarkdownText from '../../components/MarkdownText';
import Page from '../../components/Page';
import AccordionHeader from './components/body/AccordionHeader';
import ResultMessage from './components/body/ResultMessage';
import MessageList from './components/messages/MessageList';
import { useUnreads } from './hooks/useUnreads';

const UnreadsPage: FC = () => {
	const t = useTranslation();

	const [loading, error, unreads] = useUnreads();

	const totalMessages = useMemo(() => {
		let total = 0;

		unreads.forEach((room) => {
			total += room?.messages?.length || 0;
		});

		return total;
	}, [unreads]);

	return (
		<Page>
			<Page.Header
				title={
					<>
						<Header.Content.Row>
							<Header.Title is='h1'>{t('Unread_Messages')}</Header.Title>
						</Header.Content.Row>
						<Header.Content.Row>
							<Header.Subtitle is='h2'>
								<MarkdownText
									parseEmoji={true}
									variant='inlineWithoutBreaks'
									withTruncatedText
									content={t('Total_unreads').replace('{messages}', totalMessages.toString())}
								/>
							</Header.Subtitle>
						</Header.Content.Row>
					</>
				}
			>
				<ButtonGroup>
					<Button
						onClick={(): void => {
							console.log('test');
						}}
					>
						<Icon name={'flag'} size='x20' margin='4x' />
						<span style={{ marginLeft: '10px' }}>{'Mark All Unread'}</span>
					</Button>
				</ButtonGroup>
			</Page.Header>

			<Page.Content>
				<Page.ScrollableContentWithShadow>
					<Box marginBlock='none' marginInline='auto' width='full'>
						{error && !loading && <ResultMessage />}
						{!unreads.length && !loading && <ResultMessage empty />}
						{unreads.length && !loading ? (
							<Accordion borderBlockStyle='unset'>
								{unreads.map((room) => (
									<Accordion.Item key={room._id} title={<AccordionHeader room={room} />}>
										<MessageList rid={room._id} messages={room.messages} />
									</Accordion.Item>
								))}
							</Accordion>
						) : (
							<Box is='p' color='hint' fontScale='p2'>
								<Skeleton />
								<Skeleton />
								<Skeleton width='75%' />
							</Box>
						)}
					</Box>
				</Page.ScrollableContentWithShadow>
			</Page.Content>
		</Page>
	);
};

export default UnreadsPage;
