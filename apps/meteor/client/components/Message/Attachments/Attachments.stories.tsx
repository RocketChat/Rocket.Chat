/* eslint-disable @typescript-eslint/camelcase */
import { FileAttachmentProps, FileProp, MessageAttachmentDefault } from '@rocket.chat/core-typings';
import { ComponentMeta, ComponentStory } from '@storybook/react';
import React from 'react';

import Attachments from '.';

export default {
	title: 'Message/Attachments',
	component: Attachments,
} as ComponentMeta<typeof Attachments>;

const field: MessageAttachmentDefault = {
	color: '#ff0000',
	text: 'Yay for gruggy!',
	pretext: 'Pre Text',
	mrkdwn_in: ['fields'],
	title: 'Attachment Example',
	title_link: 'https://youtube.com',
	fields: [
		{
			short: true,
			title: 'Test1 ',
			value:
				'Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other',
		},
		{
			short: true,
			title: 'Another Test 2',
			value: '[Link](https://google.com/) something and this and that.',
		},
		{
			title: 'Another Test 3',
			value: '[Link](https://google.com/) something and this and that.',
		},
		{
			short: true,
			title: 'Another Test 4',
			value: '[Link](https://google.com/) something and this and that.',
		},
		{
			short: true,
			title: 'Another Test 5',
			value: '[Link](https://google.com/) something and this and that.',
		},
	],
};

const image: FileAttachmentProps = {
	ts: new Date('2016-12-09T16:53:06.761Z'),
	// collapsed: false,
	title: 'Attachment Image Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	image_url: 'https://rocket.chat/wp-content/uploads/2020/07/devices-screens-768x433.png.webp',
	type: 'file',
	image_type: 'png',
};

const video: FileAttachmentProps = {
	ts: new Date('2016-12-09T16:53:06.761Z'),
	collapsed: false,
	title: 'Attachment Video Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	video_url: 'http://www.w3schools.com/tags/movie.mp4',
	video_size: 10000,
	video_type: 'mp4',
	type: 'file',
};

const audio: FileAttachmentProps = {
	ts: new Date('2016-12-09T16:53:06.761Z'),
	collapsed: false,
	title: 'Attachment Audio Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	audio_url: 'http://www.w3schools.com/tags/horse.mp3',
	audio_type: 'mp3',
	audio_size: 10000,
	type: 'file',
};

const message = {
	_id: '12312321',
	rid: 'GENERAL',
	msg: 'Sample message',
	alias: 'Gruggy',
	emoji: ':smirk:',
	avatar: 'https://avatars2.githubusercontent.com/u/5263975?s=60&v=3',
	attachments: [field, image],
};

export const Default: ComponentStory<typeof Attachments> = () => <Attachments attachments={message.attachments} />;

export const Fields: ComponentStory<typeof Attachments> = () => <Attachments attachments={[field]} />;

export const FailingImage: ComponentStory<typeof Attachments> = () => (
	<Attachments attachments={[{ ...image, image_url: 'invalid.url' } as FileAttachmentProps]} />
);

export const Image: ComponentStory<typeof Attachments> = () => <Attachments attachments={[image]} />;

export const Video: ComponentStory<typeof Attachments> = () => <Attachments attachments={[video]} file={{} as FileProp} />;

export const Audio: ComponentStory<typeof Attachments> = () => <Attachments attachments={[audio]} file={{} as FileProp} />;
