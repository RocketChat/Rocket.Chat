import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import s from 'underscore.string';
import React, { useCallback, useMemo, useState, useEffect, useRef } from 'react';
import { Box, Icon, TextInput, Select, Margins, Callout } from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useDebouncedValue, useDebouncedState, useResizeObserver, useLocalStorage } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../../components/basic/VerticalBar';
import { useTranslation } from '../../../contexts/TranslationContext';
import { useRoute, useCurrentRoute } from '../../../contexts/RouterContext';
import { call, renderMessageBody } from '../../../../app/ui-utils/client';
import { useUserId, useUserSubscription } from '../../../contexts/UserContext';
import { Messages } from '../../../../app/models/client';
import { useEndpointDataExperimental, ENDPOINT_STATES } from '../../../hooks/useEndpointDataExperimental';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useSetting } from '../../../contexts/SettingsContext';
import { useTimeAgo } from '../../../hooks/useTimeAgo';
import { clickableItem } from '../../helpers/clickableItem';
import { MessageSkeleton } from '../../components/Message';
import ThreadListMessage from './components/Message';
import { getConfig } from '../../../../app/ui-utils/client/config';

function mapProps(WrappedComponent) {
	return ({ msg, username, replies, tcount, ts, ...props }) => <WrappedComponent replies={tcount} participants={replies.length} username={username} msg={msg} ts={ts} {...props}/>;
}

const Thread = React.memo(mapProps(clickableItem(ThreadListMessage)));

const Skeleton = React.memo(clickableItem(MessageSkeleton));

const LIST_SIZE = parseInt(getConfig('threadsListSize')) || 25;

const filterProps = ({ msg, u, replies, mentions, tcount, ts, _id, tlm, attachments }) => ({ ..._id && { _id }, attachments, mentions, msg, u, replies, tcount, ts: new Date(ts), tlm: new Date(tlm) });

const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(WrappedComponent) {
	return ({ rid, ...props }) => {
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);

		const userId = useUserId();
		const [type, setType] = useLocalStorage('thread-list-type', 'all');
		const [text, setText] = useState('');
		const [total, setTotal] = useState(LIST_SIZE);
		const [threads, setThreads] = useDebouncedState([], 100);
		const Threads = useRef(new Mongo.Collection(null));
		const ref = useRef();
		const [pagination, setPagination] = useState({ skip: 0, count: LIST_SIZE });

		const params = useMemo(() => ({ rid: room._id, count: pagination.count, offset: pagination.skip, type, text }), [room._id, pagination.skip, pagination.count, type, text]);

		const { data, state, error } = useEndpointDataExperimental('chat.getThreadsList', useDebouncedValue(params, 400));

		const loadMoreItems = useCallback((skip, count) => {
			setPagination({ skip, count: count - skip });

			return new Promise((resolve) => { ref.current = resolve; });
		}, []);

		useEffect(() => () => Threads.current.remove({}, () => {}), [text, type]);

		useEffect(() => {
			if (state !== ENDPOINT_STATES.DONE || !data || !data.threads) {
				return;
			}

			data.threads.forEach(({ _id, ...message }) => {
				Threads.current.upsert({ _id }, filterProps(message));
			});

			ref.current && ref.current();

			setTotal(data.total);
		}, [data, state]);

		useEffect(() => {
			const cursor = Messages.find({ rid: room._id, tcount: { $exists: true }, _hidden: { $ne: true } }).observe({
				added: ({ _id, ...message }) => {
					Threads.current.upsert({ _id }, message);
				}, // Update message to re-render DOM
				changed: ({ _id, ...message }) => {
					Threads.current.update({ _id }, message);
				}, // Update message to re-render DOM
				removed: ({ _id }) => {
					Threads.current.remove(_id);
				},
			});
			return () => cursor.stop();
		}, [room._id]);


		useEffect(() => {
			const cursor = Tracker.autorun(() => {
				const query = {
					...type === 'subscribed' && { replies: { $in: [userId] } },
				};
				setThreads(Threads.current.find(query, { sort: { tlm: -1 } }).fetch().map(filterProps));
			});

			return () => cursor.stop();
		}, [room._id, type, setThreads, userId]);

		const handleTextChange = useCallback((e) => {
			setPagination({ skip: 0, count: LIST_SIZE });
			setText(e.currentTarget.value);
		}, []);

		return <WrappedComponent
			{...props}
			unread={subscription?.tunread}
			unreadUser={subscription?.tunreadUser}
			unreadGroup={subscription?.tunreadGroup}
			userId={userId}
			error={error}
			threads={threads}
			total={total}
			loading={state === ENDPOINT_STATES.LOADING}
			loadMoreItems={loadMoreItems}
			room={room}
			text={text}
			setText={handleTextChange}
			type={type}
			setType={setType}
		/>;
	};
}

const handleFollowButton = (e) => {
	e.preventDefault();
	e.stopPropagation();
	call(![true, 'true'].includes(e.currentTarget.dataset.following) ? 'followMessage' : 'unfollowMessage', { mid: e.currentTarget.dataset.id });
};

export const normalizeThreadMessage = ({ ...message }) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return s.escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return s.escapeHTML(attachment.title);
		}
	}
};

export function ThreadList({ total = 10, threads = [], room, unread = [], unreadUser = [], unreadGroup = [], type, setType, loadMoreItems, loading, onClose, error, userId, text, setText }) {
	const showRealNames = useSetting('UI_Use_Real_Name');
	const threadsRef = useRef();

	const t = useTranslation();

	const [name] = useCurrentRoute();
	const channelRoute = useRoute(name);
	const onClick = useCallback((e) => {
		const { id: context } = e.currentTarget.dataset;
		channelRoute.push({
			tab: 'thread',
			context,
			rid: room._id,
			name: room.name,
		});
	}, [room._id, room.name]);

	const formatDate = useTimeAgo();

	const options = useMemo(() => [['all', t('All')], ['following', t('Following')], ['unread', t('Unread')]], []);

	threadsRef.current = threads;

	const rowRenderer = useCallback(React.memo(function rowRenderer({ data, index, style }) {
		if (!data[index]) {
			return <Skeleton style={style}/>;
		}
		const thread = data[index];
		const msg = normalizeThreadMessage(thread);

		const { name = thread.u.username } = thread.u;

		return <Thread
			{ ...thread }
			name={showRealNames ? name : thread.u.username }
			username={ thread.u.username }
			style={style}
			unread={unread.includes(thread._id)}
			mention={unreadUser.includes(thread._id)}
			all={unreadGroup.includes(thread._id)}
			following={thread.replies && thread.replies.includes(userId)}
			data-id={thread._id}
			msg={msg}
			t={t}
			formatDate={formatDate}
			handleFollowButton={handleFollowButton} onClick={onClick}
		/>;
	}), [unread, unreadUser, unreadGroup, showRealNames]);

	const isItemLoaded = useCallback((index) => index < threadsRef.current.length, []);
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <VerticalBar>
		<VerticalBar.Header>
			<Icon name='thread' size='x20'/>
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('Threads')}</Box>
			<VerticalBar.Close onClick={onClose}/>
		</VerticalBar.Header>
		<VerticalBar.Content paddingInline={0}>
			<Box display='flex' flexDirection='row' p='x24' borderBlockEndWidth='x2' borderBlockEndStyle='solid' borderBlockEndColor='neutral-200' flexShrink={0}>
				<Box display='flex' flexDirection='row' flexGrow={1} mi='neg-x8'>
					<Margins inline='x8'>
						<TextInput placeholder={t('Search_Messages')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
						<Select flexGrow={0} width='110px' onChange={setType} value={type} options={options} />
					</Margins>
				</Box>
			</Box>
			<Box flexGrow={1} flexShrink={1} ref={ref}>
				{error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}
				{total === 0 && <Box p='x24'>{t('No_Threads')}</Box>}
				<InfiniteLoader
					isItemLoaded={isItemLoaded}
					itemCount={total}
					loadMoreItems={ loading ? () => {} : loadMoreItems}
				>
					{({ onItemsRendered, ref }) => (<List
						height={blockSize}
						width={inlineSize}
						itemCount={total}
						itemData={threads}
						itemSize={124}
						ref={ref}
						minimumBatchSize={LIST_SIZE}
						onItemsRendered={onItemsRendered}
					>{rowRenderer}</List>
					)}
				</InfiniteLoader>
			</Box>
		</VerticalBar.Content>
	</VerticalBar>;
}

export default withData(ThreadList);
