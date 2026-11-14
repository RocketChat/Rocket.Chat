import type { LayoutBlock } from '@rocket.chat/ui-kit';

const hero = { type: 'image', image_url: 'https://picsum.photos/400/300', alt_text: 'A sample photo' } as const;
const icon = { type: 'image', image_url: 'https://picsum.photos/36/36', alt_text: 'A sample icon' } as const;

const makeCard = (title: string, withHero: boolean) =>
	({
		type: 'card',
		...(withHero && { hero_image: hero }),
		icon,
		title: { type: 'mrkdwn', text: title },
		subtitle: { type: 'plain_text', text: 'Refining data files' },
		body: { type: 'mrkdwn', text: 'Blue badge required to gain access.' },
		subtext: { type: 'plain_text', text: 'Updated today' },
		actions: [
			{
				type: 'button',
				appId: 'app-id',
				blockId: 'block-id',
				actionId: `open-${title}`,
				text: { type: 'plain_text', text: 'Open' },
				style: 'primary',
			},
		],
	}) as const;

export const card: readonly LayoutBlock[] = [makeCard('MDR', true)];

export const carousel: readonly LayoutBlock[] = [
	{
		type: 'carousel',
		elements: [makeCard('MDR', true), makeCard('O&D', true), makeCard('Optics and Design', false), makeCard('Wellness', true)],
	},
];
