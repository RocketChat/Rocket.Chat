import React from 'react';

import Attachments from '.';

export default {
	title: 'Message/Attachments',
	component: Attachments,
};


const field = {
	color: '#ff0000',
	text: 'Yay for gruggy!',
	pretext: 'Pre Text',
	mrkdwn_in: ['fields'],
	title: 'Attachment Example',
	title_link: 'https://youtube.com',
	fields: [{
		short: true,
		title: 'Test1 ',
		value: 'Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other Testing out something or other',
	}, {
		short: true,
		title: 'Another Test 2',
		value: '[Link](https://google.com/) something and this and that.',
	}, {
		title: 'Another Test 3',
		value: '[Link](https://google.com/) something and this and that.',
	}, {
		short: true,
		title: 'Another Test 4',
		value: '[Link](https://google.com/) something and this and that.',
	}, {
		short: true,
		title: 'Another Test 5',
		value: '[Link](https://google.com/) something and this and that.',
	}],
};

const image = {
	ts: '2016-12-09T16:53:06.761Z',
	collapsed: false,
	title: 'Attachment Image Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	image_url: 'https://rocket.chat/wp-content/uploads/2020/07/devices-screens-768x433.png.webp',
	type: 'file',
};

const video = {
	ts: '2016-12-09T16:53:06.761Z',
	collapsed: false,
	title: 'Attachment Video Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	video_url: 'http://www.w3schools.com/tags/movie.mp4',
	type: 'file',
};

const audio = {
	ts: '2016-12-09T16:53:06.761Z',
	collapsed: false,
	title: 'Attachment Audio Example',
	title_link: 'https://youtube.com',
	title_link_download: true,
	audio_url: 'http://www.w3schools.com/tags/horse.mp3',
	type: 'file',
};

const message = {
	_id: '12312321',
	rid: 'GENERAL',
	msg: 'Sample message',
	alias: 'Gruggy',
	emoji: ':smirk:',
	avatar: 'https://avatars2.githubusercontent.com/u/5263975?s=60&v=3',
	attachments: [field, image, video, audio],
};

window.__meteor_runtime_config__ = { ROOT_URL_PATH_PREFIX: '' };

export const Default = () => <Attachments
	attachments={message.attachments}
/>;

export const Fields = () => <Attachments
	attachments={[field]}
/>;

export const FailingImage = () => <Attachments
	attachments={[{ ...image, image_url: 'invalid.url' }]}
/>;

export const Image = () => <Attachments
	attachments={[image]}
/>;

export const Video = () => <Attachments
	attachments={[video]}
/>;

export const Audio = () => <Attachments
	attachments={[audio]}
/>;
