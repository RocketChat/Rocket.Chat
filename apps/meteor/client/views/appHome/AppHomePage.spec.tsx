import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import { AppHome } from './AppHome';
import { useAppHome } from './useAppHome';

jest.mock('./useAppHome', () => ({ useAppHome: jest.fn() }));
jest.mock('./UiKitHome', () => ({
	__esModule: true,
	default: ({ initialView }: { initialView: { id: string } }) => <div>{initialView.id}</div>,
}));

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		Home: 'Home',
		App_Home_empty_title: 'Nothing to show',
		App_Home_error: "The app's home could not be opened",
	})
	.build();

describe('AppHome', () => {
	it('shows the home the app published', () => {
		jest.mocked(useAppHome).mockReturnValue({ view: { appId: 'app', id: 'home-view', blocks: [] }, isPending: false, isError: false });

		render(<AppHome appId='app' />, { wrapper });

		expect(screen.getByText('home-view')).toBeInTheDocument();
	});

	it('says there is nothing to show before the app publishes a home', () => {
		jest.mocked(useAppHome).mockReturnValue({ view: undefined, isPending: false, isError: false });

		render(<AppHome appId='app' />, { wrapper });

		expect(screen.getByText('Nothing to show')).toBeInTheDocument();
	});

	it('says so when the home could not be opened', () => {
		jest.mocked(useAppHome).mockReturnValue({ view: undefined, isPending: false, isError: true });

		render(<AppHome appId='app' />, { wrapper });

		expect(screen.getByText("The app's home could not be opened")).toBeInTheDocument();
	});
});
