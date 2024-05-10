import type { LayoutBlock } from './LayoutBlock';

export enum LayoutBlockType {
	SECTION = 'section',
	DIVIDER = 'divider',
	IMAGE = 'image',
	ACTIONS = 'actions',
	CONTEXT = 'context',
	INPUT = 'input',
	CONDITIONAL = 'conditional',
	PREVIEW = 'preview',
	VIDEO_CONF = 'video_conf',
	CALLOUT = 'callout',
	TAB_NAVIGATION = 'tab_navigation',
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type AssertEnumKeysFromBlockUnionTypes = {
	[B in LayoutBlock as Uppercase<B['type']>]: (typeof LayoutBlockType)[Uppercase<B['type']>];
};
