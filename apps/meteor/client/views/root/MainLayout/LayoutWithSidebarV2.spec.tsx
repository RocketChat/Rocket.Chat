import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useCurrentRoutePath, useRouter } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import React from 'react';

import LayoutWithSidebarV2 from './LayoutWithSidebarV2';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useCurrentRoutePath: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock('../../../NavBarV2', () => () => <div>NavBarV2</div>);
jest.mock('../../../sidebarv2', () => () => <div>SidebarV2</div>);
jest.mock('../../navigation', () => () => <div>NavigationRegion</div>);
jest.mock('./AccessibilityShortcut', () => () => <div>AccessibilityShortcut</div>);
jest.mock('../../navigation/providers/RoomsNavigationProvider', () => ({
	__esModule: true,
	default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('@rocket.chat/ui-client', () => ({
	FeaturePreview: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	FeaturePreviewOn: ({ children }: { children: React.ReactNode }) => <>{children}</>,
	FeaturePreviewOff: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockedUseCurrentRoutePath = useCurrentRoutePath as jest.MockedFunction<typeof useCurrentRoutePath>;
const mockedUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;

describe('LayoutWithSidebarV2 - First_Channel_After_Login navigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setupRouterMock = () => {
		const navigate = jest.fn();
		mockedUseRouter.mockReturnValue({ navigate } as any);
		return navigate;
	};

	it('redirects to First_Channel_After_Login on "/"', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
	});

	it('strips leading "#" from First_Channel_After_Login before redirecting', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '#general').build(),
		});

		expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
	});

	it('redirects when route is "/home"', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/home');

		render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(navigate).toHaveBeenCalled();
	});

	it('does NOT redirect if First_Channel_After_Login is empty', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '').build(),
		});

		expect(navigate).not.toHaveBeenCalled();
	});

	it('does NOT redirect on non-home routes (e.g. /admin)', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/admin' as any);

		render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(navigate).not.toHaveBeenCalled();
	});

	it('redirects only once even if component re-renders', () => {
		const navigate = setupRouterMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		const { rerender } = render(<LayoutWithSidebarV2>content</LayoutWithSidebarV2>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		rerender(<LayoutWithSidebarV2>content again</LayoutWithSidebarV2>);

		expect(navigate).toHaveBeenCalledTimes(1);
		expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
	});
});
