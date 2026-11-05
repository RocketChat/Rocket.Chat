import { getUserDisplayName } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { useStyle } from '@rocket.chat/fuselage';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

import TimedCallMessagePreview from './TimedCallMessagePreview';
import { useConferenceViewer } from '../../context/ConferenceContext';
import type { ConferenceIncomingMessage, ConferenceRoom } from '../../context/definitions';
import { MESSAGE_PREVIEWS_SHOWN } from '../../lib/constants';

const stackStyles = css`
	position: absolute;
	inset-block-start: 0.75rem;
	inset-inline-end: 0.75rem;
	z-index: 10;
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	width: min(20rem, calc(100% - 1.5rem));
	pointer-events: none;
`;

export type CallMessagePreviewsProps = {
	subscribe: NonNullable<ConferenceRoom['subscribeToIncomingMessages']>;
	chatVisible: boolean;
	onOpen: (mid: string) => void;
};

const CallMessagePreviews = ({ subscribe, chatVisible, onOpen }: CallMessagePreviewsProps) => {
	const { t } = useTranslation();
	const { useRealName } = useConferenceViewer();
	const [messages, setMessages] = useState<ConferenceIncomingMessage[]>([]);

	const show = useStableCallback((message: ConferenceIncomingMessage) => {
		if (!chatVisible) {
			setMessages((shown) => [...shown, message].slice(-MESSAGE_PREVIEWS_SHOWN));
		}
	});

	useEffect(() => subscribe(show), [subscribe, show]);

	useEffect(() => {
		if (chatVisible) {
			setMessages([]);
		}
	}, [chatVisible]);

	const dismiss = (mid: string) => setMessages((shown) => shown.filter(({ _id }) => _id !== mid));

	return (
		<div role='log' aria-label={t('New_messages')} className={useStyle(stackStyles)}>
			{messages.map(({ _id, username, name, preview }) => (
				<TimedCallMessagePreview
					key={_id}
					username={username}
					name={getUserDisplayName(name, username, useRealName) ?? username}
					onOpen={() => onOpen(_id)}
					onDismiss={() => dismiss(_id)}
				>
					{preview}
				</TimedCallMessagePreview>
			))}
		</div>
	);
};

export default CallMessagePreviews;
