import { mockAppRoot } from '@rocket.chat/mock-providers';
import { LayoutContext } from '@rocket.chat/ui-contexts';
import { renderHook } from '@testing-library/react';

import { useUpdateVideoConfUser } from './useUpdateVideoConfUser';
import { VideoConfManager } from '../../../../lib/VideoConfManager';

jest.mock('../../../../lib/VideoConfManager', () => ({ VideoConfManager: { updateUser: jest.fn() } }));

const renderWithLayout = (isEmbedded: boolean) =>
	renderHook(() => useUpdateVideoConfUser('user-id'), {
		wrapper: mockAppRoot()
			.wrap((children) => (
				<LayoutContext.Consumer>
					{(layout) => <LayoutContext.Provider value={{ ...layout, isEmbedded }}>{children}</LayoutContext.Provider>}
				</LayoutContext.Consumer>
			))
			.build(),
	});

describe('useUpdateVideoConfUser', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should not register the user for calls in the embedded layout', () => {
		renderWithLayout(true);

		expect(VideoConfManager.updateUser).toHaveBeenLastCalledWith(null, false, true);
	});

	it('should register the user for calls outside the embedded layout', () => {
		renderWithLayout(false);

		expect(VideoConfManager.updateUser).toHaveBeenLastCalledWith('user-id', false, true);
	});
});
