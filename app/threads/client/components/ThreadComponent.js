import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { Modal } from '@rocket.chat/fuselage';
import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Blaze } from 'meteor/blaze';
import { Tracker } from 'meteor/tracker';

import { ChatMessage } from '../../../models/client';
import { useRoute } from '../../../../client/contexts/RouterContext';
import { roomTypes, APIClient } from '../../../utils/client';
import { call, normalizeThreadMessage } from '../../../ui-utils/client';
import { useTranslation } from '../../../../client/contexts/TranslationContext';
import VerticalBar from '../../../../client/components/basic/VerticalBar';

export default function ThreadComponent({ mid, rid, jump, 	room, ...props }) {
	const t = useTranslation();
	const channelRoute = useRoute(roomTypes.getConfig(room.t).route.name);
	const [mainMessage, setMainMessage] = useState({});

	const [expanded, setExpand] = useState(false);

	const ref = useRef();
	const uid = useMemo(() => Meteor.userId(), []);


	const style = useMemo(() => ({
		position: 'absolute',
		top: 0,
		right: 0,
		maxWidth: '855px',
		...document.dir === 'rtl' ? { borderTopRightRadius: '4px' } : { borderTopLeftRadius: '4px' },
		overflow: 'hidden',
		bottom: 0,
		zIndex: 100,
	}), [document.dir]);
	const following = mainMessage.replies && mainMessage.replies.includes(uid);
	const actionId = useMemo(() => (following ? 'unfollow' : 'follow'), [uid, mainMessage && mainMessage.replies]);
	const button = useMemo(() => (actionId === 'follow' ? 'bell-off' : 'bell'), [actionId]);
	const actionLabel = t(actionId === 'follow' ? 'Not_Following' : 'Following');
	const headerTitle = useMemo(() => normalizeThreadMessage(mainMessage), [mainMessage._updatedAt]);

	const expandLabel = expanded ? 'collapse' : 'expand';
	const expandIcon = expanded ? 'arrow-collapse' : 'arrow-expand';

	const handleExpandButton = useCallback(() => {
		setExpand(!expanded);
	}, [expanded]);

	const handleFollowButton = useCallback(() => call(actionId === 'follow' ? 'followMessage' : 'unfollowMessage', { mid }), [actionId]);
	const handleClose = useCallback(() => {
		channelRoute.push(room.t === 'd' ? { rid } : { name: room.name });
	}, [channelRoute, room.t, room.name]);

	useEffect(() => {
		const tracker = Tracker.autorun(async () => {
			const msg = ChatMessage.findOne({ _id: mid }) || (await APIClient.v1.get('chat.getMessage', { msgId: mid })).message;
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
	}, [mainMessage.rid]);

	if (!mainMessage.rid) {
		return <>
			{expanded && <Modal.Backdrop onClick={handleClose}/> }
			<VerticalBar.Skeleton width='full' style={expanded && style}/>
		</>;
	}

	return <>
		{expanded && <Modal.Backdrop onClick={handleClose}/> }
		<VerticalBar rcx-thread-view width='full' style={expanded && style} display='flex' flexDirection='column' borderInlineStart='2px solid' borderInlineStartColor='neutral-200'>
			<VerticalBar.Header>
				<VerticalBar.Icon name='thread' />
				<VerticalBar.Text>{headerTitle}</VerticalBar.Text>
				<VerticalBar.Action aria-label={expandLabel} onClick={handleExpandButton} name={expandIcon}/>
				<VerticalBar.Action aria-label={actionLabel} onClick={handleFollowButton} name={button}/>
				<VerticalBar.Close aria-label={t('Close')} onClick={handleClose}/>
			</VerticalBar.Header>
			<VerticalBar.Content paddingInline={0} flexShrink={1} flexGrow={1} ref={ref}/>
		</VerticalBar>
	</>;
}
