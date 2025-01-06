import type { MarkdownFields, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { isActionAttachment } from '@rocket.chat/core-typings';
import type { ReactNode, ComponentProps, ReactElement } from 'react';

import { ActionAttachment } from './default/ActionAttachtment';
import FieldsAttachment from './default/FieldsAttachment';
import AttachmentAuthor from './structure/AttachmentAuthor';
import AttachmentAuthorAvatar from './structure/AttachmentAuthorAvatar';
import AttachmentAuthorName from './structure/AttachmentAuthorName';
import AttachmentBlock from './structure/AttachmentBlock';
import AttachmentContent from './structure/AttachmentContent';
import AttachmentImage from './structure/AttachmentImage';
import AttachmentRow from './structure/AttachmentRow';
import AttachmentText from './structure/AttachmentText';
import AttachmentThumb from './structure/AttachmentThumb';
import AttachmentTitle from './structure/AttachmentTitle';
import MarkdownText from '../../../MarkdownText';
import { useCollapse } from '../../hooks/useCollapse';

const applyMarkdownIfRequires = (
	list: MessageAttachmentDefault['mrkdwn_in'] = ['text', 'pretext'],
	key: MarkdownFields,
	text: string,
	variant: ComponentProps<typeof MarkdownText>['variant'] = 'inline',
): ReactNode => (list?.includes(key) ? <MarkdownText parseEmoji variant={variant} content={text} /> : text);

type DefaultAttachmentProps = MessageAttachmentDefault;

const DefaultAttachment = (attachment: DefaultAttachmentProps): ReactElement => {
	const [collapsed, collapse] = useCollapse(!!attachment.collapsed);

	return (
		<AttachmentBlock
			color={attachment.color}
			pre={
				attachment.pretext && (
					<AttachmentText>{applyMarkdownIfRequires(attachment.mrkdwn_in, 'pretext', attachment.pretext)}</AttachmentText>
				)
			}
		>
			<AttachmentContent>
				{attachment.author_name && (
					<AttachmentAuthor>
						{attachment.author_icon && <AttachmentAuthorAvatar url={attachment.author_icon} />}
						<AttachmentAuthorName
							{...(attachment.author_link && {
								is: 'a',
								href: attachment.author_link,
								target: '_blank',
								color: undefined,
							})}
						>
							{attachment.author_name}
						</AttachmentAuthorName>
					</AttachmentAuthor>
				)}
				{attachment.title && (
					<AttachmentRow>
						<AttachmentTitle
							{...(attachment.title_link && {
								is: 'a',
								href: attachment.title_link,
								target: '_blank',
								color: undefined,
							})}
						>
							{attachment.title}
						</AttachmentTitle>{' '}
						{collapse}
					</AttachmentRow>
				)}
				{!collapsed && (
					<>
						{attachment.text && (
							<AttachmentText>{applyMarkdownIfRequires(attachment.mrkdwn_in, 'text', attachment.text, 'document')}</AttachmentText>
						)}
						{/* {attachment.fields && <FieldsAttachment fields={attachment.mrkdwn_in?.includes('fields') ? attachment.fields.map(({ value, ...rest }) => ({ ...rest, value: <MarkdownText withRichContent={null} content={value} /> })) : attachment.fields} />} */}
						{attachment.fields && (
							<FieldsAttachment
								fields={attachment.fields.map((field) => {
									if (!field.value) {
										return field;
									}

									const { value, title, ...rest } = field;

									return {
										...rest,
										title: <MarkdownText variant='inline' parseEmoji content={title.replace(/(.*)/g, (line: string) => `${line}  `)} />,
										value: <MarkdownText variant='inline' parseEmoji content={value.replace(/(.*)/g, (line: string) => `${line}  `)} />,
									};
								})}
							/>
						)}
						{attachment.image_url && <AttachmentImage {...(attachment.image_dimensions as any)} src={attachment.image_url} />}
						{/* DEPRECATED */}
						{isActionAttachment(attachment) && <ActionAttachment {...attachment} />}
					</>
				)}
			</AttachmentContent>
			{attachment.thumb_url && <AttachmentThumb url={attachment.thumb_url} />}
		</AttachmentBlock>
	);
};

export default DefaultAttachment;
