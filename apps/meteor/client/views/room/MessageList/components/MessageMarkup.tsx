import { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, MessageBody } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import { MarkupInteractionContext, Markup, UserMention, ChannelMention } from '@rocket.chat/gazzodown';
import { Root } from '@rocket.chat/message-parser';
import { escapeRegExp } from '@rocket.chat/string-helpers';
import React, { ReactElement, useCallback, useMemo } from 'react';

import { emoji } from '../../../../../app/emoji/client';
import { useMessageActions } from '../../contexts/MessageContext';
import { useMessageListHighlights } from '../contexts/MessageListContext';

type MessageMarkupProps = {
	message?: IMessage;
	tokens: Root;
};

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

const MessageMarkup = ({ message, tokens }: MessageMarkupProps): ReactElement => {
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

			return message?.mentions?.find(({ username }) => username === mention);
		},
		[message?.mentions],
	);

	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	const onUserMentionClick = useCallback(
		({ username }: UserMention) => {
			if (!username) {
				return;
			}

			return openUserCard(username);
		},
		[openUserCard],
	);

	const resolveChannelMention = useCallback(
		(mention: string) => message?.channels?.find(({ name }) => name === mention),
		[message?.channels],
	);

	const onChannelMentionClick = useCallback(({ _id: rid }: ChannelMention) => openRoom(rid), [openRoom]);

	// TODO:  this style should go to Fuselage <MessageBody> repository
	const messageBodyAditionalStyles = css`
		> blockquote {
			padding-inline: 8px;
			border-radius: 2px;
			border-width: 2px;
			border-style: solid;
			background-color: var(--rcx-color-neutral-100, ${colors.n100});
			border-color: var(--rcx-color-neutral-200, ${colors.n200});
			border-inline-start-color: var(--rcx-color-neutral-600, ${colors.n600});

			&:hover,
			&:focus {
				background-color: var(--rcx-color-neutral-200, ${colors.n200});
				border-color: var(--rcx-color-neutral-300, ${colors.n300});
				border-inline-start-color: var(--rcx-color-neutral-600, ${colors.n600});
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

	return (
		<MessageBody>
			<Box className={messageBodyAditionalStyles}>
				<MarkupInteractionContext.Provider
					value={{
						detectEmoji,
						highlightRegex,
						resolveUserMention,
						onUserMentionClick,
						resolveChannelMention,
						onChannelMentionClick,
					}}
				>
					<Markup tokens={tokens} />
				</MarkupInteractionContext.Provider>
			</Box>
		</MessageBody>
	);
};

export default MessageMarkup;
