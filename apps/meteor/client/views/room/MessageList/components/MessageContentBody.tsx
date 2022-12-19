import { css } from '@rocket.chat/css-in-js';
import { MessageBody, Box, Palette } from '@rocket.chat/fuselage';
import type { UserMention, ChannelMention } from '@rocket.chat/gazzodown';
import { MarkupInteractionContext, Markup } from '@rocket.chat/gazzodown';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import { useLayout, useUserPreference } from '@rocket.chat/ui-contexts';
import { FlowRouter } from 'meteor/kadira:flow-router';
import type { ReactElement, UIEvent } from 'react';
import React, { useCallback, useMemo } from 'react';

import { emoji } from '../../../../../app/emoji/client';
import { fireGlobalEvent } from '../../../../lib/utils/fireGlobalEvent';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageListHighlights } from '../contexts/MessageListContext';
import type { MessageWithMdEnforced } from '../lib/parseMessageTextToAstMarkdown';

type MessageContentBodyProps = Pick<MessageWithMdEnforced, 'mentions' | 'channels' | 'md'>;

const detectEmoji = (text: string): { name: string; className: string; image?: string; content: string }[] => {
	const html = Object.values(emoji.packages)
		.reverse()
		.reduce((html, { render }) => render(html), text);
	const div = document.createElement('div');
	div.innerHTML = html;
	return Array.from(div.querySelectorAll('span')).map((span) => ({
		name: span.title,
		className: span.className,
		image: span.style.backgroundImage || undefined,
		content: span.innerText,
	}));
};

const MessageContentBody = ({ mentions, channels, md }: MessageContentBodyProps): ReactElement => {
	const highlights = useMessageListHighlights();
	const highlightRegex = useMemo(() => {
		if (!highlights || !highlights.length) {
			return;
		}

		const alternatives = highlights.map(({ highlight }) => escapeRegExp(highlight)).join('|');
		const expression = `(?=^|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])(${alternatives})(?=$|\\b|[\\s\\n\\r\\t.,،'\\\"\\+!?:-])`;

		return (): RegExp => new RegExp(expression, 'gmi');
	}, [highlights]);

	const resolveUserMention = useCallback(
		(mention: string) => {
			if (mention === 'all' || mention === 'here') {
				return undefined;
			}

			return mentions?.find(({ username }) => username === mention);
		},
		[mentions],
	);

	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	const onUserMentionClick = useCallback(
		({ username }: UserMention) => {
			if (!username) {
				return;
			}

			return (event: UIEvent): void => {
				event.stopPropagation();
				openUserCard(username)(event);
			};
		},
		[openUserCard],
	);

	const resolveChannelMention = useCallback((mention: string) => channels?.find(({ name }) => name === mention), [channels]);

	const { isEmbedded } = useLayout();

	const onChannelMentionClick = useCallback(
		({ _id: rid }: ChannelMention) =>
			(event: UIEvent): void => {
				if (isEmbedded) {
					fireGlobalEvent('click-mention-link', {
						path: FlowRouter.path('channel', { name: rid }),
						channel: rid,
					});
				}

				event.stopPropagation();
				openRoom(rid)(event);
			},
		[isEmbedded, openRoom],
	);

	// TODO:  this style should go to Fuselage <MessageBody> repository
	const messageBodyAdditionalStyles = css`
		> blockquote {
			padding-inline: 8px;
			border-radius: 2px;
			border-width: 2px;
			border-style: solid;
			background-color: ${Palette.surface['surface-tint']};
			border-color: ${Palette.stroke['stroke-extra-light']};
			border-inline-start-color: ${Palette.stroke['stroke-medium']};

			&:hover,
			&:focus {
				background-color: ${Palette.surface['surface-hover']};
				border-color: ${Palette.stroke['stroke-light']};
				border-inline-start-color: ${Palette.stroke['stroke-medium']};
			}
		}
		> ul.task-list {
			> li::before {
				display: none;
			}

			> li > .rcx-check-box > .rcx-check-box__input:focus + .rcx-check-box__fake {
				z-index: 1;
			}

			list-style: none;
			margin-inline-start: 0;
			padding-inline-start: 0;
		}
	`;

	const convertAsciiToEmoji = useUserPreference<boolean>('convertAsciiEmoji', true);

	return (
		<MessageBody data-qa-type='message-body'>
			<Box className={messageBodyAdditionalStyles}>
				<MarkupInteractionContext.Provider
					value={{
						detectEmoji,
						highlightRegex,
						resolveUserMention,
						onUserMentionClick,
						resolveChannelMention,
						onChannelMentionClick,
						convertAsciiToEmoji,
					}}
				>
					<Markup tokens={md} />
				</MarkupInteractionContext.Provider>
			</Box>
		</MessageBody>
	);
};

export default MessageContentBody;
