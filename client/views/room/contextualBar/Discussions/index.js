import { Mongo } from 'meteor/mongo';
import { Tracker } from 'meteor/tracker';
import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState, useEffect, useRef, memo } from 'react';
import { Box, Icon, TextInput, Callout } from '@rocket.chat/fuselage';
import { FixedSizeList as List } from 'react-window';
import InfiniteLoader from 'react-window-infinite-loader';
import { useDebouncedValue, useDebouncedState, useResizeObserver } from '@rocket.chat/fuselage-hooks';

import { getConfig } from '../../../../../app/ui-utils/client/config';
import { Messages } from '../../../../../app/models/client';
import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserId, useUserSubscription } from '../../../../contexts/UserContext';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { MessageSkeleton } from '../../components/Message';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useSetting } from '../../../../contexts/SettingsContext';
import DiscussionListMessage from './components/Message';
import { clickableItem } from '../../../../lib/clickableItem';
import { escapeHTML } from '../../../../../lib/escapeHTML';
import { useEndpointData } from '../../../../hooks/useEndpointData';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import { renderMessageBody } from '../../../../lib/renderMessageBody';

function mapProps(WrappedComponent) {
	return ({ msg, username, tcount, ts, ...props }) => <WrappedComponent replies={tcount} username={username} msg={msg} ts={ts} {...props}/>;
}

const Discussion = React.memo(mapProps(clickableItem(DiscussionListMessage)));

const Skeleton = React.memo(clickableItem(MessageSkeleton));

const LIST_SIZE = parseInt(getConfig('discussionListSize')) || 25;

const filterProps = ({ msg, drid, u, dcount, mentions, tcount, ts, _id, dlm, attachments, name }) => ({ ..._id && { _id }, drid, attachments, name, mentions, msg, u, dcount, tcount, ts: new Date(ts), dlm: new Date(dlm) });

const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(WrappedComponent) {
	return ({ rid, ...props }) => {
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);
		const userId = useUserId();
		const onClose = useTabBarClose();

		const [text, setText] = useState('');
		const [total, setTotal] = useState(LIST_SIZE);
		const [discussions, setDiscussions] = useDebouncedState([], 100);
		const Discussions = useRef(new Mongo.Collection(null));
		const ref = useRef();
		const [pagination, setPagination] = useState({ skip: 0, count: LIST_SIZE });

		const params = useMemo(() => ({ roomId: room._id, count: pagination.count, offset: pagination.skip, text }), [room._id, pagination.skip, pagination.count, text]);

		const { value: data, phase: state, error } = useEndpointData('chat.getDiscussions', useDebouncedValue(params, 400));

		const loadMoreItems = useCallback((skip, count) => {
			setPagination({ skip, count: count - skip });

			return new Promise((resolve) => { ref.current = resolve; });
		}, []);

		useEffect(() => () => Discussions.current.remove({}, () => {}), [text]);

		useEffect(() => {
			if (state !== AsyncStatePhase.RESOLVED || !data || !data.messages) {
				return;
			}

			data.messages.forEach(({ _id, ...message }) => {
				Discussions.current.upsert({ _id }, filterProps(message));
			});

			setTotal(data.total);
			ref.current && ref.current();
		}, [data, state]);

		useEffect(() => {
			const cursor = Messages.find({ rid: room._id, drid: { $exists: true } }).observe({
				added: ({ _id, ...message }) => {
					Discussions.current.upsert({ _id }, message);
				}, // Update message to re-render DOM
				changed: ({ _id, ...message }) => {
					Discussions.current.update({ _id }, message);
				}, // Update message to re-render DOM
				removed: ({ _id }) => {
					Discussions.current.remove(_id);
				},
			});
			return () => cursor.stop();
		}, [room._id]);


		useEffect(() => {
			const cursor = Tracker.autorun(() => {
				const query = {
				};
				setDiscussions(Discussions.current.find(query, { sort: { tlm: -1 } }).fetch().map(filterProps));
			});

			return () => cursor.stop();
		}, [room._id, setDiscussions, userId]);

		const handleTextChange = useCallback((e) => {
			setPagination({ skip: 0, count: LIST_SIZE });
			setText(e.currentTarget.value);
		}, []);

		return <WrappedComponent
			{...props}
			onClose={onClose}
			unread={subscription?.tunread}
			unreadUser={subscription?.tunreadUser}
			unreadGroup={subscription?.tunreadGroup}
			userId={userId}
			error={error}
			discussions={discussions}
			total={total}
			loading={state === AsyncStatePhase.LOADING}
			loadMoreItems={loadMoreItems}
			room={room}
			text={text}
			setText={handleTextChange}
		/>;
	};
}

export const normalizeThreadMessage = ({ ...message }) => {
	if (message.msg) {
		return renderMessageBody(message).replace(/<br\s?\\?>/g, ' ');
	}

	if (message.attachments) {
		const attachment = message.attachments.find((attachment) => attachment.title || attachment.description);

		if (attachment && attachment.description) {
			return escapeHTML(attachment.description);
		}

		if (attachment && attachment.title) {
			return escapeHTML(attachment.title);
		}
	}
};

const Row = memo(function Row({
	data,
	index,
	style,
	showRealNames,
	userId,
	onClick,
}) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	if (!data[index]) {
		return <Skeleton style={style}/>;
	}
	const discussion = data[index];
	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return <Discussion
		{ ...discussion }
		name={showRealNames ? name : discussion.u.username }
		username={ discussion.u.username }
		style={style}
		following={discussion.replies && discussion.replies.includes(userId)}
		data-drid={discussion.drid}
		msg={msg}
		t={t}
		formatDate={formatDate}
		onClick={onClick}
	/>;
});

export function DiscussionList({ total = 10, discussions = [], loadMoreItems, loading, onClose, error, userId, text, setText }) {
	const showRealNames = useSetting('UI_Use_Real_Name');
	const discussionsRef = useRef();

	const t = useTranslation();

	const onClick = useCallback((e) => {
		const { drid } = e.currentTarget.dataset;
		FlowRouter.goToRoomById(drid);
	}, []);

	discussionsRef.current = discussions;

	const rowRenderer = useCallback(({ data, index, style }) => <Row
		data={data}
		index={index}
		style={style}
		showRealNames={showRealNames}
		userId={userId}
		onClick={onClick}
	/>, [onClick, showRealNames, userId]);

	const isItemLoaded = useCallback((index) => index < discussionsRef.current.length, []);
	const { ref, contentBoxSize: { inlineSize = 378, blockSize = 750 } = {} } = useResizeObserver({ debounceDelay: 100 });

	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='discussion'/>
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('Discussions')}</Box>
			<VerticalBar.Close onClick={onClose}/>
		</VerticalBar.Header>
		<VerticalBar.Content paddingInline={0}>
			<Box display='flex' flexDirection='row' p='x24' borderBlockEndWidth='x2' borderBlockEndStyle='solid' borderBlockEndColor='neutral-200' flexShrink={0}>
				<TextInput placeholder={t('Search_Messages')} value={text} onChange={setText} addon={<Icon name='magnifier' size='x20'/>}/>
			</Box>
			<Box flexGrow={1} flexShrink={1} ref={ref} overflow='hidden' display='flex'>
				{error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}
				{total === 0 && <Box p='x24'>{t('No_Discussions_found')}</Box>}
				{!error && total > 0 && <InfiniteLoader
					isItemLoaded={isItemLoaded}
					itemCount={total}
					loadMoreItems={ loading ? () => {} : loadMoreItems}
				>
					{({ onItemsRendered, ref }) => (<List
						outerElementType={ScrollableContentWrapper}
						height={blockSize}
						width={inlineSize}
						itemCount={total}
						itemData={discussions}
						itemSize={124}
						ref={ref}
						minimumBatchSize={LIST_SIZE}
						onItemsRendered={onItemsRendered}
					>{rowRenderer}</List>
					)}
				</InfiniteLoader>}
			</Box>
		</VerticalBar.Content>
	</>;
}

export default withData(DiscussionList);
