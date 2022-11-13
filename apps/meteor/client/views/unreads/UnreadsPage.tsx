import { Button, ButtonGroup, Icon } from '@rocket.chat/fuselage';
import { useEndpoint, useTranslation } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { MessageAction } from '../../../app/ui-utils/client/lib/MessageAction';
import Page from '../../components/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { MessageWithMdEnforced } from '../room/MessageList/lib/parseMessageTextToAstMarkdown';
import ResultMessage from './components/body/ResultMessage';
import UnreadsBody from './components/body/UnreadsBody';
import UnreadsHeader from './components/headers/UnreadsHeader';
import { IUnreadHistoryRoom, useUnreads } from './hooks/useUnreads';

import './styles/unreadsPage.css';

const maxLoading = 4000;

const UnreadsPage: FC = () => {
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const unreadMessages = useEndpoint('POST', '/v1/subscriptions.unread');
	const [loading, error, unreads, fetchMessages, { undoHistory, setUndoHistory }] = useUnreads();
	const t = useTranslation();
	const [expandedItem, setExpandedItem] = useState<string | null>(null);
	const [sortBy, setSortBy] = useState('Activity');
	const [activeMessages, setActiveMessages] = useState<MessageWithMdEnforced[]>([]);
	const [pageLoading, setPageLoading] = useState<boolean>(true);

	const totalMessages = useMemo(() => {
		let total = 0;

		unreads?.forEach((room) => {
			total += room?.unread + (room?.tunread?.length || 0);
		});

		return total;
	}, [unreads]);

	const sortedRooms = useMemo(
		() => unreads?.sort((a: any, b: any) => (sortBy !== 'Activity' ? a?.name?.localeCompare(b?.name) : b?.lm - a?.lm)),
		[unreads, sortBy],
	);

	async function handleMarkAll(): Promise<void> {
		setPageLoading(true);
		if (undoHistory.length) {
			await Promise.all(undoHistory.map((rid: string) => unreadMessages({ roomId: rid })));
			setUndoHistory([]);
		} else if (unreads) {
			setUndoHistory(unreads.map((room: IUnreadHistoryRoom) => room.rid));
			await Promise.all(unreads.map((room) => readMessages({ rid: room.rid })));
		}
		setExpandedItem(null);
		setActiveMessages([]);
	}

	async function handleMark(room: IUnreadHistoryRoom): Promise<void> {
		const index = undoHistory.findIndex((rid: string) => rid === room.rid);
		if (index >= 0) {
			await unreadMessages({ roomId: room.rid });
			undoHistory.splice(index, 1);
			setUndoHistory(undoHistory);
		} else {
			await readMessages({ rid: room.rid });
			setUndoHistory([...undoHistory, room.rid]);
		}
		setExpandedItem(null);
		setActiveMessages([]);
	}

	async function getMessages(room: IUnreadHistoryRoom): Promise<void> {
		if (expandedItem === room._id) {
			setExpandedItem(null);
			setActiveMessages([]);
		} else if (room.undo) {
			setExpandedItem(room._id);
			setActiveMessages([]);
		} else {
			setExpandedItem(room._id);
			const messages = await fetchMessages(room);
			setActiveMessages(messages);
		}
	}

	async function handleRedirect(): Promise<void> {
		if (activeMessages.length === 0) return;

		const permalink = await MessageAction.getPermaLink(activeMessages[0]._id);

		const urlWithoutProtocol = permalink.slice(permalink.indexOf('//') + 2);
		const messageUrl = urlWithoutProtocol.slice(urlWithoutProtocol.indexOf('/'));

		FlowRouter.go(messageUrl);
	}

	useEffect(() => {
		unreads?.some(async (room) => {
			if (expandedItem === room._id) {
				const messages = await fetchMessages(room);
				setExpandedItem(room._id);
				setActiveMessages(messages);
			}
		});
	}, [unreads, expandedItem, fetchMessages]);

	useEffect(() => {
		if (unreads?.length) setPageLoading(false);
	}, [unreads]);

	useEffect(() => {
		const loadingTimeout = setTimeout(() => {
			setPageLoading(false);
		}, maxLoading);

		return () => clearTimeout(loadingTimeout);
	}, []);

	if (error) {
		return (
			<Page>
				<Page.Header className='unreadsSectionHeader' title='' padding={'0 20px'} />
				<ResultMessage />
			</Page>
		);
	}

	if (loading || pageLoading) {
		return <PageSkeleton />;
	}

	if (!pageLoading && (!unreads || !unreads?.length || (unreads?.length && unreads?.length === undoHistory.length))) {
		return (
			<Page>
				<Page.Header className='unreadsSectionHeader' title='' padding={0} />
				<ResultMessage empty>
					{!!undoHistory.length && (
						<ButtonGroup
							padding={20}
							paddingBlockEnd={20}
							display='flex'
							flexDirection='row'
							justifyContent='center'
							alignItems='center'
							width='full'
						>
							<Button onClick={(): Promise<void> => handleMarkAll()}>
								<Icon name={'undo'} size='x20' margin='4x' />
								<span style={{ marginLeft: '10px' }}>{t('Undo')}</span>
							</Button>
						</ButtonGroup>
					)}
				</ResultMessage>
			</Page>
		);
	}

	return (
		<Page padding={0}>
			<Page.Header
				className='unreadsSectionHeader'
				margin={0}
				borderBlockEndWidth={0}
				color={'var(--color-gray)'}
				backgroundColor={'var(--color-dark)'}
				title={
					<UnreadsHeader
						totalMessages={totalMessages}
						totalRooms={unreads?.length || 0}
						handleMarkAll={(): Promise<void> => handleMarkAll()}
						sortBy={sortBy}
						setSortBy={(sortBy: string): void => setSortBy(sortBy)}
						hasUndo={!!undoHistory.length}
					/>
				}
			/>
			<Page.ScrollableContentWithShadow padding={0}>
				<UnreadsBody
					sortedRooms={sortedRooms}
					expandedItem={expandedItem}
					activeMessages={activeMessages}
					handleRedirect={(): Promise<void> => handleRedirect()}
					handleMark={(room): Promise<void> => handleMark(room)}
					getMessages={(room): Promise<void> => getMessages(room)}
				/>
			</Page.ScrollableContentWithShadow>
		</Page>
	);
};

export default memo(UnreadsPage);
