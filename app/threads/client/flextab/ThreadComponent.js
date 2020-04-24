import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Modal, Icon, Box, Skeleton } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';

import { Page } from '../../../../client/components/basic/Page';
import { ChatMessage } from '../../../models/client';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { roomTypes } from '../../../utils/client';
import { call } from '../../../ui-utils/client';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { filterMarkdown } from '../../../markdown/lib/markdown';

const style = {
	position: 'absolute',
	top: 0,
	right: 0,
	width: '100%',
	maxWidth: '855px',
	borderRadius: '8px',
	overflow: 'hidden',
	bottom: 0,
	zIndex: 100,
};

export default function ThreadComponent({ mid, rid, room, ...props }) {
	const t = useTranslation();
	const channelRoute = useRoute(roomTypes.getConfig(room.t).route.name);
	const [mainMessage, setMainMessage] = useState({});

	const ref = useRef();
	const uid = useMemo(() => Meteor.userId(), []);
	const actionId = useMemo(() => (mainMessage.replies && mainMessage.replies.includes(uid) ? 'unfollow' : 'follow'), [uid, mainMessage && mainMessage.replies]);
	const button = useMemo(() => (actionId === 'follow' ? 'bell' : 'bell-off'), [actionId]);
	const actionLabel = t(actionId === 'follow' ? 'Follow_message' : 'Unfollow_message');
	const headerTitle = useMemo(() => mainMessage.msg && filterMarkdown(mainMessage.msg), [mainMessage.msg]);

	const handleFollowButton = useCallback(() => call(actionId === 'follow' ? 'followMessage' : 'unfollowMessage', { mid }), [actionId]);
	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid } : { name: room.name });
	}, [channelRoute, room.t, room.name]);

	useEffect(() => {
		const tracker = Tracker.autorun(() => {
			const msg = ChatMessage.findOne({ _id: mid }, { fields: { replies: 1, rid: 1, mid: 1, u: 1, msg: 1 } });
			if (!msg) {
				return;
			}
			setMainMessage(msg);
		});
		return () => tracker.stop();
	}, [mid]);

	useEffect(() => {
		const view = mainMessage.rid && ref.current && Blaze.renderWithData(Template.thread, { mainMessage, ...props }, ref.current);
		return () => view && Blaze.remove(view);
	}, [ref.current, mainMessage.rid, mainMessage.mid, mainMessage.msg]);

	return <>
		<Modal.Backdrop onClick={handleClose}/>
		<Page.VerticalBar style={style} display='flex' flexDirection='column'>
			<Page.VerticalBar.Header pb='x24'>
				<Icon name='thread' size='x20'/>
				<Box mi='x4'flexShrink={1} flexGrow={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headerTitle}</Box>
				<Page.VerticalBar.Button onClick={handleFollowButton} aria-label={actionLabel}><Icon name={button} size='x20'/></Page.VerticalBar.Button><Page.VerticalBar.Close aria-label={t('Close')} onClick={handleClose}/>
			</Page.VerticalBar.Header>
			{ !mainMessage.rid ? <Skeleton/> : <Page.VerticalBar.Content p={0} flexShrink={1} flexGrow={1} ref={ref}/> }
		</Page.VerticalBar>
	</>;
}
