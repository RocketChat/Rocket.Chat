import { css } from '@rocket.chat/css-in-js';
import { MessageBody, Box, Palette, Skeleton } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import React, { Suspense } from 'react';

import type { MessageWithMdEnforced } from '../../lib/parseMessageTextToAstMarkdown';
import GazzodownText from '../GazzodownText';

type MessageContentBodyProps = Pick<MessageWithMdEnforced, 'mentions' | 'channels' | 'md'> & {
	searchText?: string;
};

const MessageContentBody = ({ mentions, channels, md, searchText }: MessageContentBodyProps) => {
	// TODO: this style should go to Fuselage <MessageBody> repository
	const messageBodyAdditionalStyles = css`
		> blockquote {
			padding-inline: 8px;
			border: 1px solid ${Palette.stroke['stroke-extra-light']};
			border-radius: 2px;
			background-color: ${Palette.surface['surface-tint']};
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
		a {
			color: ${Palette.text['font-info']};
			&:hover {
				text-decoration: underline;
			}
			&:focus {
				border: 2px solid ${Palette.stroke['stroke-extra-light-highlight']};
				border-radius: 2px;
			}
		}
	`;

	return (
		<MessageBody data-qa-type='message-body'>
			<Box className={messageBodyAdditionalStyles}>
				<Suspense fallback={<Skeleton />}>
					<GazzodownText channels={channels} mentions={mentions} searchText={searchText}>
						<Markup tokens={md} />
					</GazzodownText>
				</Suspense>
			</Box>
		</MessageBody>
	);
};

export default MessageContentBody;
