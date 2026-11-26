import { useLayout } from '@rocket.chat/ui-contexts';
import type { LayoutContextValue } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useSidebarUserActivities } from './useSidebarUserActivities';
import { UserAction } from '../../lib/UserAction';

jest.mock('../../lib/UserAction', () => ({
	USER_ACTIVITIES: {},
	UserAction: {
		addStream: jest.fn(),
		subscribe: jest.fn(() => () => undefined),
		get: jest.fn(),
	},
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useLayout: jest.fn(),
}));

const addStream = jest.mocked(UserAction.addStream);
const layout = jest.mocked(useLayout);

const setSidebar = (sidebar: Partial<LayoutContextValue['sidebar']>) =>
	layout.mockReturnValue({ sidebar: { shouldToggle: false, isCollapsed: false, ...sidebar } } as LayoutContextValue);

describe('useSidebarUserActivities', () => {
	let release: jest.Mock;

	beforeEach(() => {
		release = jest.fn();
		addStream.mockReset().mockReturnValue(release);
	});

	it('streams the room activity while the sidebar is visible', () => {
		setSidebar({});

		renderHook(() => useSidebarUserActivities('room-id', true));

		expect(addStream).toHaveBeenCalledWith('room-id');
		expect(release).not.toHaveBeenCalled();
	});

	it('does not stream the room activity when the row shows no subtitle', () => {
		setSidebar({});

		renderHook(() => useSidebarUserActivities('room-id', false));

		expect(addStream).not.toHaveBeenCalled();
	});

	it('does not stream the room activity while the sidebar is collapsed off screen', () => {
		setSidebar({ shouldToggle: true, isCollapsed: true });

		renderHook(() => useSidebarUserActivities('room-id', true));

		expect(addStream).not.toHaveBeenCalled();
	});

	it('releases the stream when the sidebar gets collapsed and takes it again when it opens', () => {
		setSidebar({ shouldToggle: true, isCollapsed: false });
		const { rerender } = renderHook(() => useSidebarUserActivities('room-id', true));

		setSidebar({ shouldToggle: true, isCollapsed: true });
		rerender();
		expect(release).toHaveBeenCalledTimes(1);

		setSidebar({ shouldToggle: true, isCollapsed: false });
		rerender();
		expect(addStream).toHaveBeenCalledTimes(2);
	});

	it('releases the stream when the room leaves the sidebar', () => {
		setSidebar({});
		const { unmount } = renderHook(() => useSidebarUserActivities('room-id', true));

		unmount();

		expect(release).toHaveBeenCalledTimes(1);
	});
});
