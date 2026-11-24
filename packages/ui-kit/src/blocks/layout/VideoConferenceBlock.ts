import type { LayoutBlockish } from '../LayoutBlockish.js';

export type VideoConferenceBlock = LayoutBlockish<{
	type: 'video_conf';
	callId: string;
}>;
