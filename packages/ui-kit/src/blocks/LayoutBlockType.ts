import type { LayoutBlock } from './LayoutBlock';

export const LayoutBlockType = {
	SECTION: 'section',
	DIVIDER: 'divider',
	HEADER: 'header',
	IMAGE: 'image',
	ACTIONS: 'actions',
	CONTEXT: 'context',
	INPUT: 'input',
	CONDITIONAL: 'conditional',
	PREVIEW: 'preview',
	VIDEO: 'video',
	VIDEO_CONF: 'video_conf',
	CALLOUT: 'callout',
	TAB_NAVIGATION: 'tab_navigation',
	INFO_CARD: 'info_card',
} as const satisfies Record<Uppercase<LayoutBlock['type']>, LayoutBlock['type']>;
