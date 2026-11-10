import type { LayoutBlock } from '@rocket.chat/ui-kit';

export const video: readonly LayoutBlock[] = [
	{
		type: 'video',
		video_url: 'https://www.youtube.com/embed/aqz-KE-bpKQ',
		thumbnail_url: 'https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg',
		alt_text: 'Big Buck Bunny, an animated short film',
		title: { type: 'plain_text', text: 'Big Buck Bunny' },
		title_url: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ',
		description: { type: 'plain_text', text: 'An open movie by the Blender Foundation.' },
		provider_name: 'YouTube',
		author_name: 'Blender',
	},
];
