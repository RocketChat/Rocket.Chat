import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useCurrentRoutePath, useRoute } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';

import LayoutWithSidebar from './LayoutWithSidebar';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useCurrentRoutePath: jest.fn(),
	useRoute: jest.fn(),
}));

jest.mock('../../../sidebar', () => () => <div>Sidebar</div>);

const mockedUseCurrentRoutePath = useCurrentRoutePath as jest.MockedFunction<typeof useCurrentRoutePath>;
const mockedUseRoute = useRoute as jest.MockedFunction<typeof useRoute>;

describe('LayoutWithSidebar - First_Channel_After_Login navigation', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const setupChannelRouteMock = () => {
		const push = jest.fn();
		mockedUseRoute.mockImplementation((routeName) => {
			if (routeName === 'channel') {
				return { push } as any;
			}
			return {} as any;
		});
		return push;
	};

	it('redirects to First_Channel_After_Login on "/"', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(push).toHaveBeenCalledWith({ name: 'general' });
	});

	it('strips leading "#" from First_Channel_After_Login before redirecting', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '#general').build(),
		});

		expect(push).toHaveBeenCalledWith({ name: 'general' });
	});

	it('does NOT redirect if First_Channel_After_Login starts with "?"', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '?general').build(),
		});

		expect(push).not.toHaveBeenCalled();
	});

	it('does NOT redirect if First_Channel_After_Login starts with "##"', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '##general').build(),
		});

		expect(push).not.toHaveBeenCalled();
	});

	it('redirects when route is "/home"', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/home');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(push).toHaveBeenCalled();
	});

	it('does NOT redirect if First_Channel_After_Login is empty', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '').build(),
		});

		expect(push).not.toHaveBeenCalled();
	});

	it('does NOT redirect on non-home routes (e.g. /admin)', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/admin' as any);

		render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		expect(push).not.toHaveBeenCalled();
	});

	it('redirects only once even if component re-renders', () => {
		const push = setupChannelRouteMock();
		mockedUseCurrentRoutePath.mockReturnValue('/');

		const { rerender } = render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
			wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
		});

		rerender(<LayoutWithSidebar>content again</LayoutWithSidebar>);

		expect(push).toHaveBeenCalledTimes(1);
		expect(push).toHaveBeenCalledWith({ name: 'general' });
	});
});
