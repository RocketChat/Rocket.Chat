import type { LayoutBlockish } from '../LayoutBlockish';

export type VideoConferenceBlock = LayoutBlockish<{
	type: 'video_conf';
	callId: string;
}>;
