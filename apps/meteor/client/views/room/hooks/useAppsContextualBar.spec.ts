import { renderHook } from '@testing-library/react';

import { useAppsContextualBar } from './useAppsContextualBar';
import { useUiKitActionManager } from '../../../uikit/hooks/useUiKitActionManager';
import { useRoomToolbox } from '../contexts/RoomToolboxContext';

jest.mock('@rocket.chat/ui-contexts', () => ({
	useRouteParameter: jest.fn((param: string) => {
		if (param === 'context') return 'test-context';
		if (param === 'tab') return 'app';
		return undefined;
	}),
}));

jest.mock('../../../uikit/hooks/useUiKitActionManager', () => ({
	useUiKitActionManager: jest.fn(),
}));
jest.mock('../contexts/RoomToolboxContext', () => ({
	useRoomToolbox: jest.fn(),
}));

const mockGetInteractionPayloadByViewId = jest.fn();
const mockOn = jest.fn();
const mockOff = jest.fn();
const mockCloseTab = jest.fn();

beforeEach(() => {
	(useUiKitActionManager as jest.Mock).mockReturnValue({
		getInteractionPayloadByViewId: mockGetInteractionPayloadByViewId,
		on: mockOn,
		off: mockOff,
	});
	(useRoomToolbox as jest.Mock).mockReturnValue({ closeTab: mockCloseTab });
});

afterEach(() => {
	jest.clearAllMocks();
});

it('should return the view when present', () => {
	const view = { id: 'view1' };
	mockGetInteractionPayloadByViewId.mockReturnValue({ view });

	const { result } = renderHook(() => useAppsContextualBar());

	expect(result.current).toBe(view);
});

it('should call closeTab if view is not present', () => {
	mockGetInteractionPayloadByViewId.mockReturnValue(undefined);

	renderHook(() => useAppsContextualBar());

	expect(mockCloseTab).toHaveBeenCalled();
});
