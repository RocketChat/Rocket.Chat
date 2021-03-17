import React, { FC, memo } from 'react';
import { ActionButton, Box, BoxProps, ButtonProps, Avatar } from '@rocket.chat/fuselage';

import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';
import Image, { ImageProps } from './components/Image';
import { useAttachmentDimensions } from './context/AttachmentContext';
import { useTranslation } from '../../../contexts/TranslationContext';

export type AttachmentPropsBase = {
	title?: string;

	ts: Date;
	collapsed?: boolean;
	description?: string;

	title_link?: string;
	title_link_download: boolean;

};

const Row: FC<BoxProps> = (props) => <Box mi='neg-x2' mbe='x2' rcx-message-attachment display='flex' alignItems='center' {...props}/>;

const Title: FC<BoxProps> = (props) => <Box withTruncatedText mi='x2' fontScale='c1' color='hint' {...props}></Box>;
const TitleLink: FC<{ link: string; title?: string }> = ({ link, title }) => <Title is='a' href={`${ link }?donwload`} color={undefined} target='_blank' download={title} rel='noopener noreferrer'>{title}</Title>;
const Text: FC<BoxProps> = (props) => <Box mbe='x4' mi='x2' fontScale='p1' color='default' {...props}></Box>;

const Size: FC<BoxProps & { size: number }> = ({ size, ...props }) => {
	const format = useFormatMemorySize();
	return <Title flexShrink={0} {...props}>({format(size)})</Title>;
};

const Action: FC<ButtonProps & { icon: string }> = (props) => <ActionButton mi='x2' mini ghost {...props} />;
const Collapse: FC<ButtonProps & { collapsed?: boolean }> = ({ collapsed = false, ...props }) => {
	const t = useTranslation();
	return <Action title={collapsed ? t('Uncollapse') : t('Collapse')}icon={ !collapsed ? 'chevron-down' : 'chevron-left' }{...props} />;
};

const Download: FC<ButtonProps & { href: string }> = ({ title, href, ...props }) => {
	const t = useTranslation();
	return <Action icon='download' href={`${ href }?download`} title={t('Download')} is='a' target='_blank' rel='noopener noreferrer' download={title} {...props} />;
};

const Content: FC<BoxProps> = ({ ...props }) => <Box rcx-attachment__content width='full' mb='x4' {...props} />;
const Details: FC<BoxProps> = ({ ...props }) => <Box rcx-attachment__details fontScale='p1' color='info' bg='neutral-100' pi='x16' pb='x16' {...props}/>;
const Inner: FC<BoxProps> = ({ ...props }) => <Box {...props}/>;

const Block: FC<{ pre?: JSX.Element | string; color?: string }> = ({ pre, color = 'neutral-600', children }) => <Attachment>{pre}<Box display='flex' flexDirection='row' pis='x16' borderRadius='x2' borderInlineStartStyle='solid' borderInlineStartWidth='x2' borderInlineStartColor={color} children={children}></Box></Attachment>;

const Author: FC<{}> = (props) => <Box display='flex' flexDirection='row' alignItems='center' mbe='x4' {...props}/>;
const AuthorAvatar: FC<{ url: string }> = ({ url }) => <Avatar { ...{ url, size: 'x24' } as any} />;
const AuthorName: FC<BoxProps> = (props) => <Box withTruncatedText fontScale='p2' mi='x8' {...props}/>;

const Thumb: FC<{ url: string }> = memo(({ url }) => <Box mis='x8'><Avatar { ...{ url, size: 'x48' } as any} /></Box>);

export const Attachment: FC<BoxProps> & {
	Row: FC<BoxProps>;
	Title: FC<BoxProps>;
	TitleLink: FC<{ link: string; title?: string }>;
	Text: FC<BoxProps>;
	Size: FC<BoxProps & { size: number }>;
	Collapse: FC<ButtonProps & { collapsed?: boolean }>;
	Content: FC<BoxProps>;
	Details: FC<BoxProps>;
	Inner: FC<BoxProps>;
	Block: FC<{ pre?: JSX.Element | string; color?: string }>;
	Author: FC<{}>;
	AuthorAvatar: FC<{ url: string }>;
	AuthorName: FC<BoxProps>;

	Image: FC<ImageProps>;
	Thumb: FC<{ url: string }>;

	Download: FC<ButtonProps & { href: string }>;
} = (props) => {
	const { width } = useAttachmentDimensions();
	return <Box rcx-message-attachment mb='x4' maxWidth={width} width='full' display='flex' overflow='hidden' flexDirection='column' {...props}/>;
};

Attachment.Image = Image;

Attachment.Row = Row;
Attachment.Title = Title;
Attachment.Text = Text;
Attachment.TitleLink = TitleLink;
Attachment.Size = Size;

Attachment.Thumb = Thumb;

Attachment.Collapse = Collapse;
Attachment.Download = Download;

Attachment.Content = Content;
Attachment.Details = Details;
Attachment.Inner = Inner;
Attachment.Block = Block;

Attachment.Author = Author;
Attachment.AuthorAvatar = AuthorAvatar;
Attachment.AuthorName = AuthorName;
