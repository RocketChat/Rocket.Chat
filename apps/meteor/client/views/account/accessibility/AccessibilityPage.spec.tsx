import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AccessibilityPage from './AccessibilityPage';


const queryClient = new QueryClient({
	defaultOptions: {
		queries: { retry: false },
		mutations: { retry: false },
	},
});

const mockEndpoint = jest.fn();


jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useTranslation: () => (key: string) => key,
	useToastMessageDispatch: () => jest.fn(),
	useEndpoint: () => mockEndpoint,
	useSetting: () => false,
}));

jest.mock('./hooks/useAcessibilityPreferencesValues', () => ({
	useAccessiblityPreferencesValues: () => ({
		themeAppearence: 'light',
		fontSize: '1',
		clockMode: '0',
		hideUsernames: false,
		hideRoles: false,
		mentionsWithSymbol: false,
	}),
}));

jest.mock('./hooks/useCreateFontStyleElement', () => ({
	useCreateFontStyleElement: () => jest.fn(),
}));

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	ExternalLink: ({ children, to }: any) => <a href={to}>{children}</a>,
}));

describe('AccessibilityPage - Theme Preview', () => {
	beforeEach(() => {
		queryClient.clear();
		jest.clearAllMocks();
	});

	it('should render theme section with radio buttons', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);


		expect(screen.getByText('Theme_light')).toBeInTheDocument();
		expect(screen.getByText('Theme_dark')).toBeInTheDocument();
	});

	it('should have theme radio buttons for different options', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		const radios = screen.getAllByRole('radio');
		expect(radios.length).toBeGreaterThan(0);
	});

	it('should render cancel and save buttons', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		const buttons = screen.getAllByRole('button');

		expect(buttons.length).toBeGreaterThanOrEqual(2);
	});

	it('should display font size select field with aria-label', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		const fontSizeSelect = screen.getByLabelText('Font_size');
		expect(fontSizeSelect).toBeInTheDocument();
	});

	it('should display clock mode select field with aria-label', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		const clockModeSelect = screen.getByLabelText('Message_TimeFormat');
		expect(clockModeSelect).toBeInTheDocument();
	});

	it('should render all theme option labels', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		expect(screen.getByText('Theme_light')).toBeInTheDocument();
		expect(screen.getByText('Theme_dark')).toBeInTheDocument();
		expect(screen.getByText('Theme_high_contrast')).toBeInTheDocument();
		expect(screen.getByText('Theme_match_system')).toBeInTheDocument();
	});

	it('should have learn more section with accessibility links', () => {
		render(
			<QueryClientProvider client={queryClient}>
				<AccessibilityPage />
			</QueryClientProvider>
		);

		expect(screen.getByText('Accessibility_statement')).toBeInTheDocument();
	});
});
