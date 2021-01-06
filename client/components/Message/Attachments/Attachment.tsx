import React, { FC } from 'react';
import { ActionButton, Box, BoxProps, ButtonProps, Avatar } from '@rocket.chat/fuselage';

import { useFormatMemorySize } from '../../../hooks/useFormatMemorySize';
import Image, { ImageProps } from './components/Image';

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
const Text: FC<BoxProps> = (props) => <Box withTruncatedText mbe='x4' mi='x2' fontScale='p1' color='default' {...props}></Box>;

const Size: FC<BoxProps & { size: number }> = ({ size, ...props }) => {
	const format = useFormatMemorySize();
	return <Title flexShrink={0} {...props}>({format(size)})</Title>;
};

const Action: FC<ButtonProps & { icon: string }> = (props) => <ActionButton mi='x2' mini ghost {...props} />;
const Collapse: FC<ButtonProps & { collapsed?: boolean }> = ({ collapsed = false, ...props }) => <Action icon={ !collapsed ? 'chevron-down' : 'chevron-left' }{...props} />;
const Download: FC<ButtonProps & { href: string }> = (props) => <Action icon='download' is='a' target='_blank' {...props} />;

const Content: FC<BoxProps> = ({ ...props }) => <Box mb='x4' {...props} />;
const Details: FC<BoxProps> = ({ ...props }) => <Box fontScale='p1' color='info' bg='neutral-100' pi='x16' pb='x16' {...props}/>;
const Inner: FC<BoxProps> = ({ ...props }) => <Box mis='x16' {...props}/>;

const Block: FC<{ pre?: JSX.Element | string; color: string }> = ({ pre, color, children }) => <Attachment>{pre}<Box pis='x16' borderRadius='x4' borderInlineStartStyle='solid' borderInlineStartWidth='x2' borderInlineStartColor={color} children={children}></Box></Attachment>;

const Author: FC<{}> = (props) => <Box display='flex' flexDirection='row' alignItems='center' mbe='x4' {...props}/>;
const AuthorAvatar: FC<{ url: string }> = ({ url }) => <Avatar { ...{ url, size: 'x24' } as any} />;
const AuthorName: FC<BoxProps> = (props) => <Box withTruncatedText fontScale='p2' mi='x8' {...props}/>;

export const Attachment: FC<BoxProps> & {
	Row: FC<BoxProps>;
	Title: FC<BoxProps>;
	Text: FC<BoxProps>;
	Size: FC<BoxProps & { size: number }>;
	Collapse: FC<ButtonProps & { collapsed?: boolean }>;
	Content: FC<BoxProps>;
	Details: FC<BoxProps>;
	Inner: FC<BoxProps>;
	Block: FC<{ pre?: JSX.Element | string; color: string }>;
	Author: FC<{}>;
	AuthorAvatar: FC<{ url: string }>;
	AuthorName: FC<BoxProps>;

	Image: FC<ImageProps>;

	Download: FC<ButtonProps & { href: string }>;
} = (props) => <Box rcx-message-attachment mb='x4' maxWidth='480px' width='full' display='flex' overflow='hidden' flexDirection='column' {...props}/>;

Attachment.Image = Image;

Attachment.Row = Row;
Attachment.Title = Title;
Attachment.Text = Text;
Attachment.Size = Size;

Attachment.Collapse = Collapse;
Attachment.Download = Download;

Attachment.Content = Content;
Attachment.Details = Details;
Attachment.Inner = Inner;
Attachment.Block = Block;
Attachment.Author = Author;
Attachment.AuthorAvatar = AuthorAvatar;
Attachment.AuthorName = AuthorName;
