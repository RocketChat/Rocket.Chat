import { css } from '@rocket.chat/css-in-js';
import { Box, MessageBody, Palette } from '@rocket.chat/fuselage';
import { Markup } from '@rocket.chat/gazzodown';
import React from 'react';
import type { ReactElement } from 'react';

import GazzodownText from '../../../../../../components/GazzodownText';

type MessagePreviewProps = {
	md: any;
	channels: any[];
	mentions: any[];
	shadowPreviewRef: any;
	shadowPreviewStyle: any;
};

export const MessagePreview = ({ md, channels, mentions, shadowPreviewRef, shadowPreviewStyle }: MessagePreviewProps): ReactElement => {
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
		<div style={{ border: '1px solid black', width: '100%', height: '100%' }}>
			<article>
				<MessageBody data-qa-type='message-body'>
					<Box className={messageBodyAdditionalStyles}>
						<GazzodownText channels={channels} mentions={mentions}>
							<Markup tokens={md} />
						</GazzodownText>
					</Box>
				</MessageBody>
			</article>
			<div ref={shadowPreviewRef} style={shadowPreviewStyle} />
		</div>
	);
};
