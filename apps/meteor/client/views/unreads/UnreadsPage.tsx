import { useEndpoint } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { FC, memo, useEffect, useMemo, useState } from 'react';

import { MessageAction } from '../../../app/ui-utils/client/lib/MessageAction';
import Page from '../../components/Page';
import PageSkeleton from '../../components/PageSkeleton';
import { MessageWithMdEnforced } from '../room/MessageList/lib/parseMessageTextToAstMarkdown';
import ResultMessage from './components/body/ResultMessage';
import UnreadsBody from './components/body/UnreadsBody';
import UnreadsHeader from './components/headers/UnreadsHeader';
import { useUnreads } from './hooks/useUnreads';

import './styles/unreadsPage.css';

const UnreadsPage: FC = () => {
	const readMessages = useEndpoint('POST', '/v1/subscriptions.read');
	const [loading, error, unreads, fetchMessages] = useUnreads();
	const [expandedItem, setExpandedItem] = useState(null);
	const [sortBy, setSortBy] = useState('Activity');
	const [activeMessages, setActiveMessages] = useState<MessageWithMdEnforced[]>([]);

	const totalMessages = useMemo(() => {
		let total = 0;

		unreads?.forEach((room) => {
			total += room?.unread + (room?.tunread?.length || 0);
		});

		return total;
	}, [unreads]);

	const sortedRooms = useMemo(() => {
		const sortedRooms =
			unreads?.sort((a: any, b: any) => (sortBy !== 'Activity' ? a?.name?.localeCompare(b?.name) : b?.lm - a?.lm)) ?? unreads;

		return sortedRooms;
	}, [sortBy, unreads]);

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

	async function handleRedirect(): Promise<void> {
		if (activeMessages.length === 0) return;

		const permalink = await MessageAction.getPermaLink(activeMessages[0]._id);

		const urlWithoutProtocol = permalink.slice(permalink.indexOf('//') + 2);
		const messageUrl = urlWithoutProtocol.slice(urlWithoutProtocol.indexOf('/'));

		FlowRouter.go(messageUrl);
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
		<Page padding={0}>
			{error && !loading && <ResultMessage />}
			{unreads && !unreads.length && !loading && <ResultMessage empty />}
			{!!loading && <PageSkeleton />}
			{unreads && unreads.length > 0 && !loading && (
				<>
					<Page.Header
						className='unreadsSectionHeader'
						title={
							<UnreadsHeader
								totalMessages={totalMessages}
								totalRooms={unreads.length}
								handleMarkAll={(): Promise<void> => handleMarkAll()}
								sortBy={sortBy}
								setSortBy={(sortBy: string): void => setSortBy(sortBy)}
							/>
						}
					/>
					<Page.ScrollableContentWithShadow padding={0}>
						<UnreadsBody
							sortedRooms={sortedRooms}
							expandedItem={expandedItem}
							activeMessages={activeMessages}
							handleRedirect={(): Promise<void> => handleRedirect()}
							handleMark={(id: string): Promise<void> => handleMark(id)}
							getMessages={(room: any): Promise<void> => getMessages(room)}
						/>
					</Page.ScrollableContentWithShadow>
				</>
			)}
		</Page>
	);
};

export default memo(UnreadsPage);
