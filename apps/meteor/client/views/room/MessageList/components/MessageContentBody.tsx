import { IMessage } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box } from '@rocket.chat/fuselage';
import colors from '@rocket.chat/fuselage-tokens/colors';
import React, { ReactElement } from 'react';

import Markup from '../../../../components/gazzodown/Markup';
import { MarkupInteractionContext } from '../../../../components/gazzodown/MarkupInteractionContext';
import { useMessageActions } from '../../contexts/MessageContext';
import { useParsedMessage } from '../hooks/useParsedMessage';

type MessageContentBodyProps = {
	message: IMessage;
};

const MessageContentBody = ({ message }: MessageContentBodyProps): ReactElement => {
	const tokens = useParsedMessage(message);

	const {
		actions: { openRoom, openUserCard },
	} = useMessageActions();

	return (
		<Box
			className={css`
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
			`}
		>
			<MarkupInteractionContext.Provider
				value={{
					mentions: message?.mentions ?? [],
					channels: message?.channels ?? [],
					onUserMentionClick: openUserCard,
					onChannelMentionClick: openRoom,
				}}
			>
				<Markup tokens={tokens} />
			</MarkupInteractionContext.Provider>
		</Box>
	);
};

export default MessageContentBody;
