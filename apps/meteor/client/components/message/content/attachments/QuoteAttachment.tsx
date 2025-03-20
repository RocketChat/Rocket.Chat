import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Box, Palette } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import type { ReactElement } from 'react';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import MessageContentBody from '../../MessageContentBody';
import Attachments from '../Attachments';
import AttachmentAuthor from './structure/AttachmentAuthor';
import AttachmentAuthorAvatar from './structure/AttachmentAuthorAvatar';
import AttachmentAuthorName from './structure/AttachmentAuthorName';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentDetails from './structure/AttachmentDetails';
import AttachmentInner from './structure/AttachmentInner';

// TODO: remove this team collaboration
const quoteStyles = css`
	.rcx-attachment__details {
		.rcx-message-body {
			color: ${Palette.text['font-hint']};
		}
	}
	&:hover,
	&:focus {
		.rcx-attachment__details {
			background: ${Palette.surface['surface-hover']};
			border-color: ${Palette.stroke['stroke-light']};
			border-inline-start-color: ${Palette.stroke['stroke-medium']};
		}
	}
`;

type QuoteAttachmentProps = {
	attachment: MessageQuoteAttachment;
};

export const QuoteAttachment = ({ attachment }: QuoteAttachmentProps): ReactElement => {
	const formatTime = useTimeAgo();
	const displayAvatarPreference = useUserPreference<boolean>('displayAvatars');

	return (
		<>
			<AttachmentContent className={quoteStyles} width='full'>
				<AttachmentDetails
					is='blockquote'
					borderRadius='x2'
					borderWidth='default'
					borderStyle='solid'
					borderColor='extra-light'
					borderInlineStartColor='light'
				>
					<AttachmentAuthor>
						{displayAvatarPreference && <AttachmentAuthorAvatar url={attachment.author_icon} />}
						<AttachmentAuthorName
							{...(attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: 'hint' })}
						>
							{attachment.author_name}
						</AttachmentAuthorName>
						{attachment.ts && (
							<Box
								fontScale='c1'
								{...(attachment.message_link ? { is: 'a', href: attachment.message_link, color: 'hint' } : { color: 'hint' })}
							>
								{formatTime(attachment.ts)}
							</Box>
						)}
					</AttachmentAuthor>
					{attachment.attachments && (
						<AttachmentInner>
							<Attachments attachments={attachment.attachments} id={attachment.attachments[0]?.title_link} />
						</AttachmentInner>
					)}
					{attachment.md ? <MessageContentBody md={attachment.md} /> : attachment.text.substring(attachment.text.indexOf('\n') + 1)}
				</AttachmentDetails>
			</AttachmentContent>
		</>
	);
};
