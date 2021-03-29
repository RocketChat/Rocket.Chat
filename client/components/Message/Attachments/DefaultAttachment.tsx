import React, { ComponentProps, FC, ReactNode } from 'react';

import { AttachmentProps } from '.';
import MarkdownText from '../../MarkdownText';
import { ActionAttachment, ActionAttachmentProps } from './ActionAttachtment';
import Attachment from './Attachment';
import FieldsAttachment from './FieldsAttachment';
import { Dimensions } from './components/Dimensions';
import { useCollapse } from './hooks/useCollapse';

type MarkdownFields = 'text' | 'pretext' | 'fields';

type DefaultAttachmentProps = {
	collapsed?: true;

	author_icon?: string;
	author_link?: string;
	author_name?: string;

	// TODO: replace this component props type with a payload-based type because
	// `value` comes as `string` and is passed as `ReactNode`
	fields: ComponentProps<typeof FieldsAttachment>['fields'];

	// footer
	// footer_icon

	image_url?: string;
	image_dimensions?: Dimensions;

	mrkdwn_in?: Array<MarkdownFields>;
	pretext?: string;
	text?: string;

	thumb_url?: string;

	title?: string;
	title_link?: string;

	ts?: Date;

	color?: string;
};

const isActionAttachment = (attachment: AttachmentProps): attachment is ActionAttachmentProps =>
	'actions' in attachment;

const applyMarkdownIfRequires = (
	list: DefaultAttachmentProps['mrkdwn_in'] = ['text', 'pretext'],
	key: MarkdownFields,
	text: string,
): ReactNode => (list?.includes(key) ? <MarkdownText variant='inline' content={text} /> : text);

const DefaultAttachment: FC<DefaultAttachmentProps> = (attachment) => {
	const [collapsed, collapse] = useCollapse(!!attachment.collapsed);

	return (
		<Attachment.Block
			color={attachment.color}
			pre={
				attachment.pretext && (
					<Attachment.Text>
						{applyMarkdownIfRequires(attachment.mrkdwn_in, 'pretext', attachment.pretext)}
					</Attachment.Text>
				)
			}
		>
			<Attachment.Content>
				{attachment.author_name && (
					<Attachment.Author>
						{attachment.author_icon && <Attachment.AuthorAvatar url={attachment.author_icon} />}
						<Attachment.AuthorName
							{...(attachment.author_link && {
								is: 'a',
								href: attachment.author_link,
								target: '_blank',
								color: undefined,
							})}
						>
							{attachment.author_name}
						</Attachment.AuthorName>
					</Attachment.Author>
				)}
				{attachment.title && (
					<Attachment.Row>
						<Attachment.Title
							{...(attachment.title_link && {
								is: 'a',
								href: attachment.title_link,
								target: '_blank',
								color: undefined,
							})}
						>
							{attachment.title}
						</Attachment.Title>{' '}
						{collapse}
					</Attachment.Row>
				)}
				{!collapsed && (
					<>
						{attachment.text && (
							<Attachment.Text>
								{applyMarkdownIfRequires(attachment.mrkdwn_in, 'text', attachment.text)}
							</Attachment.Text>
						)}
						{/* {attachment.fields && <FieldsAttachment fields={attachment.mrkdwn_in?.includes('fields') ? attachment.fields.map(({ value, ...rest }) => ({ ...rest, value: <MarkdownText withRichContent={null} content={value} /> })) : attachment.fields} />} */}
						{attachment.fields && (
							<FieldsAttachment
								fields={attachment.fields.map((field) => {
									if (!field.value) {
										return field;
									}

									const { value, ...rest } = field;

									const cleanValue = (value as string).replace(/(.*)/g, (line: string) => {
										if (line.trim() === '') {
											return `${line}  <br/>`;
										}
										return `${line}  `;
									});
									return { ...rest, value: <MarkdownText variant='inline' content={cleanValue} /> };
								})}
							/>
						)}
						{attachment.image_url && (
							<Attachment.Image
								{...(attachment.image_dimensions as any)}
								src={attachment.image_url}
							/>
						)}
						{/* DEPRECATED */}
						{isActionAttachment(attachment) && <ActionAttachment {...attachment} />}
					</>
				)}
			</Attachment.Content>
			{attachment.thumb_url && <Attachment.Thumb url={attachment.thumb_url} />}
		</Attachment.Block>
	);
};

export default DefaultAttachment;
