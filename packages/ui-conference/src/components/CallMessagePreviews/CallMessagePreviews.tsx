import { VisuallyHidden } from '@react-aria/visually-hidden';
import { getUserDisplayName } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { useStyle } from '@rocket.chat/fuselage';
import type { MouseEvent, Ref } from 'react';
import { useTranslation } from 'react-i18next';

import CallMessagePreview from './CallMessagePreview.js';
import { useConferenceViewer } from '../../context/ConferenceContext.js';
import type { ConferenceNewMessage } from '../../context/definitions.js';

const listStyles = css`
	display: flex;
	flex-direction: column;
	gap: 0.5rem;
	margin: 0;
	padding: 0;
	list-style: none;
`;

export type CallMessagePreviewsProps = {
	messages: ConferenceNewMessage[];
	/** One line per message and tighter spacing, for a window with little room over the call. */
	compact?: boolean;
	onOpen: (mid: string) => void;
	onDismiss: (mid: string) => void;
	/** Where the keyboard's focus goes when the last preview it was on is dismissed. */
	onFocusLeave?: () => void;
	/** The list of previews, which is only there while there is one to show. */
	ref?: Ref<HTMLUListElement>;
};

/** The chat messages previewed over the call, each announced once as it arrives. */
const CallMessagePreviews = ({ messages, compact, onOpen, onDismiss, onFocusLeave, ref }: CallMessagePreviewsProps) => {
	const { t } = useTranslation();
	const { useRealName } = useConferenceViewer();
	const listClassName = useStyle(listStyles);

	const previews = messages.map(({ _id, username, name, text }) => ({
		_id,
		username,
		name: getUserDisplayName(name, username, useRealName) ?? username,
		text: text ?? t('Encrypted_message_preview_unavailable'),
	}));

	const handleDismiss = (mid: string) => (event?: MouseEvent<HTMLElement>) => {
		// A click with no pointer behind it came from the keyboard, whose focus would go with the preview.
		if (event?.detail === 0) {
			const preview = event.currentTarget.closest('li');
			const neighbour = preview?.nextElementSibling ?? preview?.previousElementSibling;
			const target = neighbour?.querySelector('button');

			if (target) {
				target.focus();
			} else {
				onFocusLeave?.();
			}
		}

		onDismiss(mid);
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
				<ul ref={ref} aria-label={t('New_messages')} className={listClassName}>
					{previews.map(({ _id, username, name, text }) => (
						<CallMessagePreview
							key={_id}
							username={username}
							name={name}
							compact={compact}
							onOpen={() => onOpen(_id)}
							onDismiss={handleDismiss(_id)}
						>
							{text}
						</CallMessagePreview>
					))}
				</ul>
			)}
		</>
	);
};

export default CallMessagePreviews;
