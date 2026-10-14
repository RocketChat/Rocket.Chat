import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike, MockedFunction } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../tests/mocks/moduleScope';

let useCurrentRoutePath: (typeof import('@rocket.chat/ui-contexts'))['useCurrentRoutePath'];
let useRouter: (typeof import('@rocket.chat/ui-contexts'))['useRouter'];
let LayoutWithSidebar: (typeof import('./LayoutWithSidebar'))['default'];
let mockedUseCurrentRoutePath: MockedFunction<typeof useCurrentRoutePath>;
let mockedUseRouter: MockedFunction<typeof useRouter>;

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
describe('LayoutWithSidebar', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-contexts'), {
			exports: {
				...require('@rocket.chat/ui-contexts'),
				useCurrentRoutePath: fn<FunctionLike>(),
				useRouter: fn<FunctionLike>(),
			},
		});
		mock.module('../../../navbar', { exports: { default: (() => () => <div>NavBar</div>)() } });
		mock.module('../../../sidebar/SidebarRail', { exports: { default: (() => () => <div>SidebarRail</div>)() } });
		mock.module('../../../sidebar/SidebarRail/SidebarRailHeader', { exports: { default: (() => () => <div>SidebarRailHeader</div>)() } });
		mock.module('./AccessibilityShortcut', { exports: { default: (() => () => <div>AccessibilityShortcut</div>)() } });
		mock.module('../../navigation/providers/RoomsNavigationProvider', {
			exports: { default: (() => () => <div>Navigationprovider</div>)() },
		});
		mock.module('../../navigation', { exports: { default: (() => () => <div>NavigationRegion</div>)() } });
		mock.module('../../../sidebar', { exports: { default: (() => () => <div>Sidebar</div>)() } });
		({ useCurrentRoutePath, useRouter } = require('@rocket.chat/ui-contexts'));
		({ default: LayoutWithSidebar } = require('./LayoutWithSidebar'));
		mockedUseCurrentRoutePath = useCurrentRoutePath as MockedFunction<typeof useCurrentRoutePath>;
		mockedUseRouter = useRouter as MockedFunction<typeof useRouter>;
	});

	after(leaveModuleScope);

	describe('LayoutWithSidebar - First_Channel_After_Login navigation', () => {
		beforeEach(() => {
			mocker.clearAllMocks();
		});

		const setupRouterMock = () => {
			const navigate = fn<FunctionLike>();
			mockedUseRouter.mockReturnValue({ navigate } as any);
			return navigate;
		};

		it('redirects to First_Channel_After_Login on "/"', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
			});

			expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
		});

		it('strips leading "#" from First_Channel_After_Login before redirecting', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '#general').build(),
			});

			expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
		});

		it('does NOT redirect if First_Channel_After_Login starts with "?"', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '?general').build(),
			});

			expect(navigate).not.toHaveBeenCalled();
		});

		it('does NOT redirect if First_Channel_After_Login starts with "##"', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '##general').build(),
			});

			expect(navigate).not.toHaveBeenCalled();
		});

		it('redirects when route is "/home"', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/home');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
			});

			expect(navigate).toHaveBeenCalled();
		});

		it('does NOT redirect if First_Channel_After_Login is empty', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', '').build(),
			});

			expect(navigate).not.toHaveBeenCalled();
		});

		it('does NOT redirect on non-home routes (e.g. /admin)', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/admin' as any);

			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
			});

			expect(navigate).not.toHaveBeenCalled();
		});

		it('redirects only once even if component re-renders', () => {
			const navigate = setupRouterMock();
			mockedUseCurrentRoutePath.mockReturnValue('/');

			const { rerender } = render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().withSetting('First_Channel_After_Login', 'general').build(),
			});

			rerender(<LayoutWithSidebar>content again</LayoutWithSidebar>);

			expect(navigate).toHaveBeenCalledTimes(1);
			expect(navigate).toHaveBeenCalledWith({ name: '/channel/general' });
		});
	});

	describe('LayoutWithSidebar - sidebarRail feature preview', () => {
		beforeEach(() => {
			mocker.clearAllMocks();
			mockedUseCurrentRoutePath.mockReturnValue('/channel/general' as any);
			mockedUseRouter.mockReturnValue({ navigate: fn<FunctionLike>() } as any);
		});

		it('renders the legacy NavBar and hides SidebarRail when the sidebarRail feature preview is off', () => {
			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot().build(),
			});

			expect(screen.getByText('NavBar')).toBeInTheDocument();
			expect(screen.queryByText('SidebarRailHeader')).not.toBeInTheDocument();
			expect(screen.queryByText('SidebarRail')).not.toBeInTheDocument();
		});

		it('renders SidebarRailHeader and SidebarRail when the sidebarRail feature preview is on', () => {
			render(<LayoutWithSidebar>content</LayoutWithSidebar>, {
				wrapper: mockAppRoot()
					.withSetting('Accounts_AllowFeaturePreview', true)
					.withUserPreference('featuresPreview', [{ name: 'sidebarRail', value: true }])
					.build(),
			});

			expect(screen.getByText('SidebarRailHeader')).toBeInTheDocument();
			expect(screen.getByText('SidebarRail')).toBeInTheDocument();
			expect(screen.queryByText('NavBar')).not.toBeInTheDocument();
		});
	});
});
