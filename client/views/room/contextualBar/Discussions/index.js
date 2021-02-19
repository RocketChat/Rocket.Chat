import { FlowRouter } from 'meteor/kadira:flow-router';
import React, { useCallback, useMemo, useState, memo } from 'react';
import { Box, Icon, TextInput, Callout } from '@rocket.chat/fuselage';
import { Virtuoso } from 'react-virtuoso';
import { useDebouncedValue, useResizeObserver, useAutoFocus } from '@rocket.chat/fuselage-hooks';

import VerticalBar from '../../../../components/VerticalBar';
import { useTranslation } from '../../../../contexts/TranslationContext';
import { useUserId, useUserSubscription } from '../../../../contexts/UserContext';
import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import { useUserRoom } from '../../hooks/useUserRoom';
import { useSetting } from '../../../../contexts/SettingsContext';
import DiscussionListMessage from './components/Message';
import { clickableItem } from '../../../../lib/clickableItem';
import { escapeHTML } from '../../../../../lib/escapeHTML';
import { AsyncStatePhase } from '../../../../hooks/useAsyncState';
import { useTabBarClose } from '../../providers/ToolboxProvider';
import { renderMessageBody } from '../../../../lib/renderMessageBody';
import ScrollableContentWrapper from '../../../../components/ScrollableContentWrapper';
import { useDiscussionsList } from './useDiscussionsList';
import { useRecordList } from '../../../../hooks/lists/useRecordList';

function mapProps(WrappedComponent) {
	return ({ msg, username, tcount, ts, ...props }) => <WrappedComponent replies={tcount} username={username} msg={msg} ts={ts} {...props}/>;
}

const Discussion = React.memo(mapProps(clickableItem(DiscussionListMessage)));


const subscriptionFields = { tunread: 1, tunreadUser: 1, tunreadGroup: 1 };
const roomFields = { t: 1, name: 1 };

export function withData(WrappedComponent) {
	return ({ rid, ...props }) => {
		const room = useUserRoom(rid, roomFields);
		const subscription = useUserSubscription(rid, subscriptionFields);
		const userId = useUserId();
		const onClose = useTabBarClose();

		const [text, setText] = useState('');
		const debouncedText = useDebouncedValue(text, 400);

		const options = useMemo(() => ({
			rid,
			text: debouncedText,
		}), [rid, debouncedText]);

		const {
			discussionsList,
			initialItemCount,
			loadMoreItems,
		} = useDiscussionsList(options, userId);
		const { phase, error, items: discussions, itemCount: totalItemCount } = useRecordList(discussionsList);

		const handleTextChange = useCallback((e) => {
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
			total={totalItemCount}
			initial={initialItemCount}
			loading={phase === AsyncStatePhase.LOADING}
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
	discussion,
	showRealNames,
	userId,
	onClick,
}) {
	const t = useTranslation();
	const formatDate = useTimeAgo();

	const msg = normalizeThreadMessage(discussion);

	const { name = discussion.u.username } = discussion.u;

	return <Discussion
		replies={discussion.replies}
		dcount={discussion.dcount}
		dlm={discussion.dlm}
		name={showRealNames ? name : discussion.u.username }
		username={ discussion.u.username }
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

	const t = useTranslation();
	const inputRef = useAutoFocus(true);
	const onClick = useCallback((e) => {
		const { drid } = e.currentTarget.dataset;
		FlowRouter.goToRoomById(drid);
	}, []);
	const {
		ref,
		contentBoxSize: { inlineSize = 378, blockSize = 1 } = {},
	} = useResizeObserver({ debounceDelay: 200 });
	return <>
		<VerticalBar.Header>
			<VerticalBar.Icon name='discussion'/>
			<Box flexShrink={1} flexGrow={1} withTruncatedText mi='x8'>{t('Discussions')}</Box>
			<VerticalBar.Close onClick={onClose}/>
		</VerticalBar.Header>
		<VerticalBar.Content paddingInline={0} ref={ref}>
			<Box display='flex' flexDirection='row' p='x24' borderBlockEndWidth='x2' borderBlockEndStyle='solid' borderBlockEndColor='neutral-200' flexShrink={0}>
				<TextInput placeholder={t('Search_Messages')} value={text} onChange={setText} ref={inputRef} addon={<Icon name='magnifier' size='x20'/>}/>
			</Box>
			<Box flexGrow={1} flexShrink={1} overflow='hidden' display='flex'>
				{error && <Callout mi='x24' type='danger'>{error.toString()}</Callout>}
				{total === 0 && <Box p='x24'>{t('No_Discussions_found')}</Box>}
				{!error && total > 0 && discussions.length > 0 && <>
					<Virtuoso
						style={{ height: blockSize, width: inlineSize, overflow: 'hidden' }}
						totalCount={total}
						endReached={ loading ? () => {} : (start) => loadMoreItems(start, Math.min(50, total - start))}
						overscan={25}
						data={discussions}
						components={{ Scroller: ScrollableContentWrapper }}
						itemContent={(index, data) => <Row
							discussion={data}
							showRealNames={showRealNames}
							userId={userId}
							onClick={onClick}
						/>}
					/>
				</>
				}
			</Box>
		</VerticalBar.Content>
	</>;
}

export default withData(DiscussionList);
