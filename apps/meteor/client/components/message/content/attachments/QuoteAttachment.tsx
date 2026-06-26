import type { MessageQuoteAttachment } from '@rocket.chat/core-typings';
import { css } from '@rocket.chat/css-in-js';
import { Divider, Palette } from '@rocket.chat/fuselage';
import { useUserPreference } from '@rocket.chat/ui-contexts';
import { useTranslation } from 'react-i18next';

import { useTimeAgo } from '../../../../hooks/useTimeAgo';
import MessageContentBody from '../../MessageContentBody';
import Attachments from '../Attachments';
import AttachmentAuthor from './structure/AttachmentAuthor';
import AttachmentAuthorAvatar from './structure/AttachmentAuthorAvatar';
import AttachmentAuthorMessageLink from './structure/AttachmentAuthorMessageLink';
import AttachmentAuthorName from './structure/AttachmentAuthorName';
import AttachmentAuthorTimestamp from './structure/AttachmentAuthorTimestamp';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentDetails from './structure/AttachmentDetails';
import AttachmentInner from './structure/AttachmentInner';

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

type QuoteAttachmentProps = {
	attachment: MessageQuoteAttachment;
};

export const QuoteAttachment = ({ attachment }: QuoteAttachmentProps) => {
	const { t } = useTranslation();
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
							{...(attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: 'default' })}
						>
							{attachment.author_name}
						</AttachmentAuthorName>
						{attachment.ts && (
							<>
								<Divider vertical />
								<AttachmentAuthorTimestamp>{formatTime(attachment.ts)}</AttachmentAuthorTimestamp>
							</>
						)}
						{attachment.message_link && (
							<>
								<Divider vertical />
								<AttachmentAuthorMessageLink href={attachment.message_link}>{t('Jump_to_message')}</AttachmentAuthorMessageLink>
							</>
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
