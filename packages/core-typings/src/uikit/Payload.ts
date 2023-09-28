import type { LayoutBlock } from '@rocket.chat/ui-kit';

export type Payload = {
	viewId: string;
	appId: string;
	blocks: LayoutBlock[];
};
