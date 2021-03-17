import React, { FC } from 'react';

import { FieldsAttachment, FieldsAttachmentProps } from './FieldsAttachment';
import MarkdownText from '../../MarkdownText';
import { ActionAttachment, ActionAttachmentProps } from './ActionAttachtment';
import { Dimensions } from './components/Image';
import { Attachment } from './Attachment';
import { useCollapse } from './hooks/useCollapse';

import { AttachmentProps } from '.';

type MarkdownFields = 'text' | 'pretext' | 'fields';

export type DefaultAttachmentProps = {
	collapsed?: true;

	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields: FieldsAttachmentProps;

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: Dimensions;

	mrkdwn_in?: Array<MarkdownFields>;
	pretext?: string;
	text? : string;

	thumb_url?: string;

	title?: string;
	title_link?: string;

	ts?: Date;

	color?: string;
};

const isActionAttachment = (attachment: AttachmentProps): attachment is ActionAttachmentProps => 'actions' in attachment;

const applyMarkdownIfRequires = (list: DefaultAttachmentProps['mrkdwn_in'] = ['text', 'pretext']) => (key: MarkdownFields, text: string): JSX.Element | string => (list?.includes(key) ? <MarkdownText variant='inline' content={text}/> : text);

export const DefaultAttachment: FC<DefaultAttachmentProps> = (attachment) => {
	const applyMardownFor = applyMarkdownIfRequires(attachment.mrkdwn_in);
	const [collapsed, collapse] = useCollapse(!!attachment.collapsed);
	return <Attachment.Block color={attachment.color} pre={attachment.pretext && <Attachment.Text>{applyMardownFor('pretext', attachment.pretext)}</Attachment.Text>}>
		<Attachment.Content>
			{attachment.author_name && <Attachment.Author>
				{ attachment.author_icon && <Attachment.AuthorAvatar url={attachment.author_icon } />}
				<Attachment.AuthorName {...attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: undefined }}>{attachment.author_name}</Attachment.AuthorName>
			</Attachment.Author> }
			{attachment.title && <Attachment.Row><Attachment.Title {...attachment.title_link && { is: 'a', href: attachment.title_link, target: '_blank', color: undefined }}>{attachment.title}</Attachment.Title> {collapse}</Attachment.Row>}
			{!collapsed && <>
				{attachment.text && <Attachment.Text>{applyMardownFor('text', attachment.text)}</Attachment.Text>}
				{/* {attachment.fields && <FieldsAttachment fields={attachment.mrkdwn_in?.includes('fields') ? attachment.fields.map(({ value, ...rest }) => ({ ...rest, value: <MarkdownText withRichContent={null} content={value} /> })) : attachment.fields} />} */}
				{attachment.fields && <FieldsAttachment fields={attachment.fields.map(({ value, ...rest }) => {
					const cleanValue = (value as string).replace(/(.*)/g, (line: string) => {
						if (line.trim() === '') {
							return `${ line }  <br/>`;
						}
						return `${ line }  `;
					});
					return { ...rest, value: <MarkdownText variant='inline' content={cleanValue} /> };
				})} />}
				{attachment.image_url && <Attachment.Image {...attachment.image_dimensions as any} src={attachment.image_url} />}
				{/* DEPRECATED */}
				{isActionAttachment(attachment) && <ActionAttachment {...attachment} />}
			</>}
		</Attachment.Content>
		{attachment.thumb_url && <Attachment.Thumb url={attachment.thumb_url} /> }
	</Attachment.Block>;
};
