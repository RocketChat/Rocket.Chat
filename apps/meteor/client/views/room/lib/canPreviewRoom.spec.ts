import type { PreviewRoomInput } from './canPreviewRoom';
import { canPreviewRoom } from './canPreviewRoom';

const input = (overrides: Partial<PreviewRoomInput> = {}): PreviewRoomInput => ({
	isPublicChannel: true,
	allowAnonymousRead: false,
	canPreviewChannelRoom: false,
	subscribed: false,
	...overrides,
});

describe('canPreviewRoom', () => {
	it('withholds a public channel from someone with no reason to be there', () => {
		expect(canPreviewRoom(input())).toBe(false);
	});

	it('never withholds a room that is not a public channel', () => {
		expect(canPreviewRoom(input({ isPublicChannel: false }))).toBe(true);
	});

	it.each([
		['anonymous reading is on', { allowAnonymousRead: true }] as const,
		['the viewer may preview channels', { canPreviewChannelRoom: true }] as const,
		['the viewer is subscribed', { subscribed: true }] as const,
	])('opens a public channel when %s', (_reason, overrides) => {
		expect(canPreviewRoom(input(overrides))).toBe(true);
	});
});
