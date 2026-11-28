import { VisuallyHidden } from '@react-aria/visually-hidden';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { useStableCallback } from '@rocket.chat/fuselage-hooks';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';

import CallMessagePreviewList from './CallMessagePreviewList.js';
import CallMessagePreviewTimed from './CallMessagePreviewTimed.js';
import { useConferenceRoom, useConferenceViewer } from '../../context/ConferenceContext.js';
import type { ConferenceNewMessage } from '../../context/definitions.js';
import { useHeld } from '../../hooks/useHeld.js';
import { MESSAGE_PREVIEWS_ANNOUNCED, MESSAGE_PREVIEWS_SHOWN, MESSAGE_PREVIEWS_SHOWN_COMPACT } from '../../lib/constants.js';

export type CallMessagePreviewsProps = {
	compact?: boolean;
	onOpen: (mid: string) => void;
	/** Where the keyboard's focus goes when the last preview it was on leaves. */
	onFocusLeave: () => void;
};

/**
 * The call chat's new messages, previewed over the call and announced as they arrive. While the previews are
 * held nothing leaves and nothing is replaced; newer messages wait for them to be let go.
 */
const CallMessagePreviews = ({ compact = false, onOpen, onFocusLeave }: CallMessagePreviewsProps) => {
	const { t } = useTranslation();
	const { onNewMessage } = useConferenceRoom();
	const { useRealName } = useConferenceViewer();
	const limit = compact ? MESSAGE_PREVIEWS_SHOWN_COMPACT : MESSAGE_PREVIEWS_SHOWN;

	const [shown, setShown] = useState<ConferenceNewMessage[]>([]);
	const [announced, setAnnounced] = useState<ConferenceNewMessage[]>([]);
	const [held, holdHandlers] = useHeld<HTMLUListElement>({ onRelease: () => setShown((shown) => shown.slice(-limit)) });

	const items = useRef(new Map<string, HTMLLIElement>());
	const openButtons = useRef(new Map<string, HTMLButtonElement>());

	const handleNewMessage = useStableCallback((message: ConferenceNewMessage) => {
		setAnnounced((announced) => [...announced, message].slice(-MESSAGE_PREVIEWS_ANNOUNCED));
		setShown((shown) => (held ? [...shown, message] : [...shown, message].slice(-limit)));
	});

	useEffect(() => onNewMessage(handleNewMessage), [onNewMessage, handleNewMessage]);

	const toPreview = ({ _id, username, name, text }: ConferenceNewMessage) => ({
		_id,
		username,
		name: getUserDisplayName(name, username, useRealName) ?? username,
		text: text ?? t('Encrypted_message_preview_unavailable'),
	});

	const previews = shown.slice(0, limit).map(toPreview);

	const handOffFocus = (mid: string) => {
		if (!items.current.get(mid)?.contains(document.activeElement)) {
			return;
		}

		const index = previews.findIndex(({ _id }) => _id === mid);
		const next = previews[index + 1] ?? previews[index - 1];
		const target = next && openButtons.current.get(next._id);

		if (target) {
			target.focus();
		} else {
			onFocusLeave();
		}
	};

	const remove = (mid: string) => {
		handOffFocus(mid);
		setShown((shown) => shown.filter(({ _id }) => _id !== mid));
	};

	const register =
		<T,>(map: Map<string, T>, mid: string) =>
		(node: T) => {
			map.set(mid, node);
			return () => {
				map.delete(mid);
			};
		};

	return (
		<>
			{/* Apart from the list: a live region wrapping the buttons reads them out with every message. */}
			<VisuallyHidden role='log'>
				{announced.map(toPreview).map(({ _id, name, text }) => (
					<p key={_id}>{t('Chat_message_from_name', { name, message: text })}</p>
				))}
			</VisuallyHidden>
			<CallMessagePreviewList aria-label={t('New_messages')} {...holdHandlers}>
				{previews.map(({ _id, username, name, text }) => (
					<CallMessagePreviewTimed
						key={_id}
						compact={compact}
						held={held}
						ref={register(items.current, _id)}
						openButtonRef={register(openButtons.current, _id)}
						avatar={<UserAvatar username={username} size={compact ? 'x28' : 'x36'} />}
						name={name}
						text={text}
						openLabel={t('Chat_message_from_name', { name, message: text })}
						dismissLabel={t('Dismiss_message_from_name', { name })}
						onOpen={() => onOpen(_id)}
						onDismiss={() => remove(_id)}
						onExpire={() => remove(_id)}
					/>
				))}
			</CallMessagePreviewList>
		</>
	);
};

export default CallMessagePreviews;
