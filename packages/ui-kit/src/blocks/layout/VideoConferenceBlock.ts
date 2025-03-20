import type { LayoutBlockType } from '../LayoutBlockType';
import type { LayoutBlockish } from '../LayoutBlockish';

export type VideoConferenceBlock = LayoutBlockish<{
	type: `${LayoutBlockType.VIDEO_CONF}`;
	callId: string;
}>;
