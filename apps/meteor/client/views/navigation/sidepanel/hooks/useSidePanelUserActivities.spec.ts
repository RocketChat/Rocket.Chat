import { renderHook } from '@testing-library/react';

import { useSidePanelUserActivities } from './useSidePanelUserActivities';
import { UserAction } from '../../../../lib/UserAction';
import { useIsSidePanelHidden } from '../../hooks/useIsSidePanelHidden';

jest.mock('../../../../lib/UserAction', () => ({
	USER_ACTIVITIES: {},
	UserAction: {
		addStream: jest.fn(),
		subscribe: jest.fn(() => () => undefined),
		get: jest.fn(),
	},
}));

jest.mock('../../hooks/useIsSidePanelHidden', () => ({
	useIsSidePanelHidden: jest.fn(),
}));

const addStream = jest.mocked(UserAction.addStream);
const isSidePanelHidden = jest.mocked(useIsSidePanelHidden);

describe('useSidePanelUserActivities', () => {
	let release: jest.Mock;

	beforeEach(() => {
		release = jest.fn();
		addStream.mockReset().mockReturnValue(release);
	});

	it('streams the room activity while the side panel is visible', () => {
		isSidePanelHidden.mockReturnValue(false);

		renderHook(() => useSidePanelUserActivities('room-id'));

		expect(addStream).toHaveBeenCalledWith('room-id');
		expect(release).not.toHaveBeenCalled();
	});

	it('does not stream the room activity while the side panel is hidden', () => {
		isSidePanelHidden.mockReturnValue(true);

		renderHook(() => useSidePanelUserActivities('room-id'));

		expect(addStream).not.toHaveBeenCalled();
	});

	it('releases the stream when the side panel gets hidden and takes it again when it shows', () => {
		isSidePanelHidden.mockReturnValue(false);
		const { rerender } = renderHook(() => useSidePanelUserActivities('room-id'));

		isSidePanelHidden.mockReturnValue(true);
		rerender();
		expect(release).toHaveBeenCalledTimes(1);

		isSidePanelHidden.mockReturnValue(false);
		rerender();
		expect(addStream).toHaveBeenCalledTimes(2);
	});

	it('releases the stream when the room leaves the side panel', () => {
		isSidePanelHidden.mockReturnValue(false);
		const { unmount } = renderHook(() => useSidePanelUserActivities('room-id'));

		unmount();

		expect(release).toHaveBeenCalledTimes(1);
	});
});
