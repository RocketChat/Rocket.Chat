import { VisuallyHidden } from '@react-aria/visually-hidden';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { UserAvatar } from '@rocket.chat/ui-avatar';
import type { Ref } from 'react';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';

import CallMessagePreview from './CallMessagePreview.js';
import CallMessagePreviewCompact from './CallMessagePreviewCompact.js';
import CallMessagePreviewList from './CallMessagePreviewList.js';
import { useConferenceViewer } from '../../context/ConferenceContext.js';
import type { ConferenceNewMessage } from '../../context/definitions.js';

export type CallMessagePreviewsProps = {
	messages: ConferenceNewMessage[];
	compact?: boolean;
	onOpen: (mid: string) => void;
	onDismiss: (mid: string) => void;
	/** Where the keyboard's focus goes when the last preview it was on is dismissed. */
	onFocusLeave?: () => void;
	ref?: Ref<HTMLUListElement>;
};

/** The chat messages previewed over the call, each announced once as it arrives. */
const CallMessagePreviews = ({ messages, compact, onOpen, onDismiss, onFocusLeave, ref }: CallMessagePreviewsProps) => {
	const { t } = useTranslation();
	const { useRealName } = useConferenceViewer();
	const items = useRef(new Map<string, HTMLLIElement>());
	const openButtons = useRef(new Map<string, HTMLButtonElement>());
	const Preview = compact ? CallMessagePreviewCompact : CallMessagePreview;

	const previews = messages.map(({ _id, username, name, text }) => ({
		_id,
		username,
		name: getUserDisplayName(name, username, useRealName) ?? username,
		text: text ?? t('Encrypted_message_preview_unavailable'),
	}));

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
			onFocusLeave?.();
		}
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
			{/* Apart from the list, and always mounted: a live region wrapping the buttons reads them out with every
			    message, and one that arrives already filled is not announced. */}
			<VisuallyHidden role='log'>
				{previews.map(({ _id, name, text }) => (
					<p key={_id}>{t('Chat_message_from_name', { name, message: text })}</p>
				))}
			</VisuallyHidden>
			{previews.length > 0 && (
				<CallMessagePreviewList ref={ref} aria-label={t('New_messages')}>
					{previews.map(({ _id, username, name, text }) => (
						<Preview
							key={_id}
							ref={register(items.current, _id)}
							openButtonRef={register(openButtons.current, _id)}
							avatar={<UserAvatar username={username} size={compact ? 'x28' : 'x36'} />}
							name={name}
							text={text}
							openLabel={t('Chat_message_from_name', { name, message: text })}
							dismissLabel={t('Dismiss_message_from_name', { name })}
							onOpen={() => onOpen(_id)}
							onDismiss={() => {
								handOffFocus(_id);
								onDismiss(_id);
							}}
						/>
					))}
				</CallMessagePreviewList>
			)}
		</>
	);
};

export default CallMessagePreviews;
