import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useRouteParameter, useRouter } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import BackgroundJobsPage from './BackgroundJobsPage';

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useRouteParameter: jest.fn(),
	useRouter: jest.fn(),
}));

jest.mock('./RecentHistoryTable', () => () => <div data-testid='recent-history-table' />);
jest.mock('./BackgroundJobsTable', () => ({ tab }: { tab: string }) => <div data-testid={`background-jobs-table-${tab}`} />);

describe('BackgroundJobsPage', () => {
	const mockUseRouteParameter = useRouteParameter as jest.Mock;
	const mockUseRouter = useRouter as jest.Mock;
	const mockNavigate = jest.fn();

	beforeEach(() => {
		mockUseRouter.mockReturnValue({
			navigate: mockNavigate,
		});
		mockUseRouteParameter.mockReturnValue(undefined);
	});

	afterEach(() => {
		jest.clearAllMocks();
	});

	it('should render the history tab when URL tab is invalid or missing', () => {
		mockUseRouteParameter.mockImplementation((param) => {
			if (param === 'tab') return 'invalid-tab';
			return undefined;
		});

		render(<BackgroundJobsPage />, { wrapper: mockAppRoot().build() });

		expect(screen.getByTestId('recent-history-table')).toBeInTheDocument();
		const historyTab = screen.getByRole('tab', { name: 'Recent_History' });
		expect(historyTab).toHaveAttribute('aria-selected', 'true');
	});

	it('should render the system tab when URL tab is system', () => {
		mockUseRouteParameter.mockImplementation((param) => {
			if (param === 'tab') return 'system';
			return undefined;
		});

		render(<BackgroundJobsPage />, { wrapper: mockAppRoot().build() });

		expect(screen.getByTestId('background-jobs-table-system')).toBeInTheDocument();
		const systemTab = screen.getByRole('tab', { name: 'System' });
		expect(systemTab).toHaveAttribute('aria-selected', 'true');
	});

	it('should render the apps tab when URL tab is apps', () => {
		mockUseRouteParameter.mockImplementation((param) => {
			if (param === 'tab') return 'apps';
			return undefined;
		});

		render(<BackgroundJobsPage />, { wrapper: mockAppRoot().build() });

		expect(screen.getByTestId('background-jobs-table-apps')).toBeInTheDocument();
		const appsTab = screen.getByRole('tab', { name: 'Apps' });
		expect(appsTab).toHaveAttribute('aria-selected', 'true');
	});

	it('should update the router when a tab is clicked', async () => {
		mockUseRouteParameter.mockImplementation((param) => {
			if (param === 'tab') return 'history';
			return undefined;
		});

		render(<BackgroundJobsPage />, { wrapper: mockAppRoot().build() });

		const systemTab = screen.getByRole('tab', { name: 'System' });
		await userEvent.click(systemTab);

		expect(mockNavigate).toHaveBeenCalledWith({
			name: 'admin-background-jobs',
			params: { tab: 'system' },
		});
	});
});
