import type * as UiKit from '@rocket.chat/ui-kit';

export const video: readonly UiKit.LayoutBlock[] = [
	{
		type: 'video',
		title: {
			type: 'plain_text',
			text: 'Rocket.Chat',
		},
		titleUrl: 'https://www.youtube.com/watch?v=video',
		description: {
			type: 'plain_text',
			text: 'An open source communications platform',
		},
		videoUrl: 'https://www.youtube.com/embed/video',
		thumbnailUrl: 'https://img.youtube.com/vi/video/0.jpg',
		altText: 'Rocket.Chat presentation video',
		authorName: 'Rocket.Chat',
	},
] as const;
