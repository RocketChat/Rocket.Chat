import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Palette } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import MessageContentBody from '../../MessageContentBody';
import Attachments from '../Attachments';
import type { AudioAttachmentSource } from './file/AudioAttachment';
import AttachmentAuthor from './structure/AttachmentAuthor';
import AttachmentAuthorAvatar from './structure/AttachmentAuthorAvatar';
import AttachmentAuthorName from './structure/AttachmentAuthorName';
import AttachmentAuthorTimestamp from './structure/AttachmentAuthorTimestamp';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentDetails from './structure/AttachmentDetails';
import AttachmentInner from './structure/AttachmentInner';
import AttachmentMessageLink from './structure/AttachmentMessageLink';
import { toPlainTextRoot } from '../../../../lib/toPlainTextRoot';

// TODO: remove this team collaboration
const quoteStyles = css`
	.rcx-attachment__details {
		.rcx-message-body {
			color: ${Palette.text['font-default']};
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

export type QuoteAttachmentProps = {
	attachment: MessageQuoteAttachment;
	source?: AudioAttachmentSource;
	/** This quote's own path, used to prefix its nested attachments' collapse-state keys. */
	path?: string;
};

export const QuoteAttachment = ({ attachment, source, path }: QuoteAttachmentProps) => {
	const formatTime = useTimeAgo();
	const displayAvatarPreference = useUserPreference<boolean>('displayAvatars');

	return (
		<>
			<AttachmentContent className={quoteStyles} width='full'>
				<AttachmentDetails
					is='blockquote'
					borderRadius='x4'
					borderWidth='default'
					borderStyle='solid'
					borderColor='extra-light'
					borderInlineStartColor='light'
				>
					<AttachmentAuthor>
						{displayAvatarPreference && <AttachmentAuthorAvatar url={attachment.author_icon} />}
						<AttachmentAuthorName
							{...(attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: 'default' })}
						>
							{attachment.author_name}
						</AttachmentAuthorName>
						{attachment.ts && (
							<AttachmentAuthorTimestamp href={attachment.message_link}>{formatTime(attachment.ts)}</AttachmentAuthorTimestamp>
						)}
						{attachment.message_link && <AttachmentMessageLink href={attachment.message_link} />}
					</AttachmentAuthor>
					{attachment.attachments && (
						<AttachmentInner>
							<Attachments
								attachments={attachment.attachments}
								id={attachment.attachments[0]?.title_link}
								source={source && { rid: source.rid, mid: source.mid, name: attachment.author_name }}
								keyPrefix={path}
							/>
						</AttachmentInner>
					)}
					<MessageContentBody md={attachment.md ?? toPlainTextRoot(attachment.text)} />
				</AttachmentDetails>
			</AttachmentContent>
		</>
	);
};
