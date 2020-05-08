import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Modal, Icon, Box, Margins } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';

import { ChatMessage } from '../../../models/client';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { roomTypes, APIClient } from '../../../utils/client';
import { call } from '../../../ui-utils/client';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import { filterMarkdown } from '../../../markdown/lib/markdown';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

const style = {
	position: 'absolute',
	top: 0,
	right: 0,
	maxWidth: '855px',
	borderRadius: '8px',
	overflow: 'hidden',
	bottom: 0,
	zIndex: 100,
};

export default function ThreadComponent({ mid, rid, jump, room, ...props }) {
	const t = useTranslation();
	const channelRoute = useRoute(roomTypes.getConfig(room.t).route.name);
	const [mainMessage, setMainMessage] = useState({});

	const ref = useRef();
	const uid = useMemo(() => Meteor.userId(), []);
	const following = mainMessage.replies && mainMessage.replies.includes(uid);
	const actionId = useMemo(() => (following ? 'unfollow' : 'follow'), [uid, mainMessage && mainMessage.replies]);
	const button = useMemo(() => (actionId === 'follow' ? 'bell-off' : 'bell'), [actionId]);
	const actionLabel = t(actionId === 'follow' ? 'Not_Following' : 'Following');
	const headerTitle = useMemo(() => mainMessage.msg && filterMarkdown(mainMessage.msg), [mainMessage.msg]);

	const handleFollowButton = useCallback(() => call(actionId === 'follow' ? 'followMessage' : 'unfollowMessage', { mid }), [actionId]);
	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid } : { name: room.name });
	}, [channelRoute, room.t, room.name]);

	useEffect(() => {
		const tracker = Tracker.autorun(async () => {
			const msg = ChatMessage.findOne({ _id: mid }, { fields: { replies: 1, rid: 1, mid: 1, u: 1, msg: 1, ts: 1 } }) || (await APIClient.v1.get('chat.getMessage', { msgId: mid })).message;
			if (!msg) {
				return;
			}
			setMainMessage(msg);
		});
		return () => tracker.stop();
	}, [mid]);

	useEffect(() => {
		const view = mainMessage.rid && ref.current && Blaze.renderWithData(Template.thread, { mainMessage, jump, following, ...props }, ref.current);
		return () => view && Blaze.remove(view);
	}, [ref.current, mainMessage.rid, mainMessage.msg]);


	if (!mainMessage.rid) {
		return <>
			<Modal.Backdrop onClick={handleClose}/>
			<VerticalBar.Skeleton width='full' style={style}/>
		</>;
	}

	return <>
		<Modal.Backdrop onClick={handleClose}/>
		<VerticalBar width='full' style={style} display='flex' flexDirection='column'>
			<VerticalBar.Header pb='x24'>
				<Margins inline='x4'>
					<Icon name='thread' size='x20'/>
					<Box flexShrink={1} flexGrow={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{headerTitle}</Box>
					<VerticalBar.Button onClick={handleFollowButton} aria-label={actionLabel}><Icon name={button} size='x20'/></VerticalBar.Button><VerticalBar.Close aria-label={t('Close')} onClick={handleClose}/>
				</Margins>
			</VerticalBar.Header>
			<VerticalBar.Content paddingInline={0} flexShrink={1} flexGrow={1} ref={ref}/>
		</VerticalBar>
	</>;
}
