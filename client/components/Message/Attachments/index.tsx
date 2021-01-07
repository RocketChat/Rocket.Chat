import React, { FC, memo } from 'react';

import { FieldsAttachment, FieldsAttachmentProps } from './FieldsAttachment';
import { QuoteAttachment, QuoteAttachmentProps } from './QuoteAttachment';
import { Attachment } from './Attachment';
import { FileAttachmentProps, isFileAttachment, FileAttachment } from './Files';
import MarkdownText from '../../MarkdownText';
import { Dimensions } from './components/Image';
import { ActionAttachment, ActionAttachmentProps } from './ActionAttachtment';

type PossibleMarkdownFields = 'text' | 'pretext' | 'fields';

export type FileProp = {
	_id: string;
	name: string;
	type: string;
	format: string;
	size: number;
};


export type AttachmentProps = {
	author_icon?: string;
	author_link?: string;
	author_name?: string;

	fields: FieldsAttachmentProps;

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: Dimensions;

	mrkdwn_in?: Array<PossibleMarkdownFields>;
	pretext?: string;
	text? : string;

	thumb_url?: string;

	title?: string;
	title_link?: string;

	ts?: Date;

	color?: string;
}

export type AttachmentPropsGeneric = AttachmentProps | FileAttachmentProps | QuoteAttachmentProps | ActionAttachmentProps;

const isQuoteAttachment = (attachment: AttachmentPropsGeneric): attachment is QuoteAttachmentProps => 'message_link' in attachment;

const isActionAttachment = (attachment: AttachmentPropsGeneric): attachment is ActionAttachmentProps => 'actions' in attachment;

const applyMarkdownIfRequires = (list: AttachmentProps['mrkdwn_in']) => (key: PossibleMarkdownFields, text: string): JSX.Element | string => (list?.includes(key) ? <MarkdownText withRichContent={null} content={text}/> : text);

const Item: FC<{attachment: AttachmentPropsGeneric; file?: FileProp }> = memo(({ attachment, file = null }) => {
	if (isFileAttachment(attachment)) {
		return file && <FileAttachment {...attachment} file={file}/>;
	}

	if (isQuoteAttachment(attachment)) {
		return <QuoteAttachment {...attachment}/>;
	}

	const applyMardownFor = applyMarkdownIfRequires(attachment.mrkdwn_in);

	return <Attachment.Block color={attachment.color} pre={attachment.pretext && <Attachment.Text>{applyMardownFor('pretext', attachment.pretext)}</Attachment.Text>}>
		<Attachment.Content>
			{attachment.author_name && <Attachment.Author>
				{ attachment.author_icon && <Attachment.AuthorAvatar url={attachment.author_icon } />}
				<Attachment.AuthorName {...attachment.author_link && { is: 'a', href: attachment.author_link, target: '_blank', color: undefined }}>{attachment.author_name}</Attachment.AuthorName>
			</Attachment.Author> }
			{attachment.title && <Attachment.Title {...attachment.title_link && { is: 'a', href: attachment.title_link, target: '_blank', color: undefined }}>{attachment.title}</Attachment.Title> }
			{attachment.text && <Attachment.Text>{applyMardownFor('text', attachment.text)}</Attachment.Text>}
			{attachment.fields && <FieldsAttachment fields={attachment.mrkdwn_in?.includes('fields') ? attachment.fields.map(({ value, ...rest }) => ({ ...rest, value: <MarkdownText withRichContent={null} content={value} /> })) : attachment.fields} />}
			{attachment.image_url && <Attachment.Image {...attachment.image_dimensions as any} src={attachment.image_url} />}
			{/* DEPRECATED */}
			{isActionAttachment(attachment) && <ActionAttachment {...attachment} />}
		</Attachment.Content>
		{attachment.thumb_url && <Attachment.Thumb url={attachment.thumb_url} /> }
	</Attachment.Block>;
});

const Attachments: FC<{ attachments: Array<AttachmentPropsGeneric>; file?: FileProp}> = ({ attachments = null, file }): any => attachments && attachments.map((attachment, index) => <Item key={index} file={file} attachment={attachment} />);

export default Attachments;
