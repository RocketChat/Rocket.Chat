import { Accordion, Box, Button, ButtonGroup, FieldGroup, Icon, Skeleton } from '@rocket.chat/fuselage';
import { Header } from '@rocket.chat/ui-client';
import { useTranslation } from '@rocket.chat/ui-contexts';
import React, { FC, useMemo } from 'react';

import MarkdownText from '../../components/MarkdownText';
import Page from '../../components/Page';
import AccordionHeader from './components/body/AccordionHeader';
import BodyError from './components/body/BodyError';
import EmptyBody from './components/body/EmptyBody';
import Message from './components/messages/Message';
import { useUnreads } from './hooks/useUnreads';

const UnreadsPage: FC = () => {
	const t = useTranslation();

	const [loading, error, unreads] = useUnreads();

	const totals = useMemo(() => {
		const totals = {
			messages: 0,
			threads: 0,
		};

		unreads.forEach((room) => {
			totals.messages += room?.messages?.length || 0;
			totals.threads += room?.threads?.length || 0;
		});

		return totals;
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
									content={t('Total_unreads')
										.replace('{messages}', totals.messages.toString())
										.replace('{threads}', totals.threads.toString())}
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
				<Box marginBlock='none' marginInline='auto' width='full'>
					{error && !loading && <BodyError />}
					{!unreads.length && !loading && <EmptyBody />}
					{unreads.length && !loading ? (
						unreads.map((room) => (
							<Box key={room.rid} color='hint' fontScale='p2'>
								<Accordion borderBlockStyle='unset'>
									<Accordion.Item title={<AccordionHeader room={room} />}>
										<Box color='hint' fontScale='p2'>
											{room.messages && (
												<FieldGroup>
													{room.messages.map((msg: any) => (
														<Message key={msg._id} id={msg._id} message={msg} sequential={true} all={true} mention={false} unread={true} />
													))}
												</FieldGroup>
											)}
											{room?.threads.map(
												(thread: any) =>
													thread?.messages && (
														<FieldGroup key={thread._id}>
															{thread.messages.map((msg: any) => (
																<Message
																	key={msg._id}
																	id={msg._id}
																	message={msg}
																	sequential={true}
																	all={true}
																	mention={false}
																	unread={true}
																/>
															))}
														</FieldGroup>
													),
											)}
										</Box>
									</Accordion.Item>
								</Accordion>
							</Box>
						))
					) : (
						<Box is='p' color='hint' fontScale='p2'>
							<Skeleton />
							<Skeleton />
							<Skeleton width='75%' />
						</Box>
					)}
				</Box>
			</Page.Content>
		</Page>
	);
};

export default UnreadsPage;
