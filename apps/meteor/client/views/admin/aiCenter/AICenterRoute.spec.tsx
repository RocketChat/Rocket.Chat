import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import { render, screen } from '@testing-library/react';

import AICenterRoute from './AICenterRoute';

jest.mock('@rocket.chat/ui-client', () => ({
	...jest.requireActual('@rocket.chat/ui-client'),
	useHasLicenseModule: jest.fn(),
	PageSkeleton: () => <div data-testid='page-skeleton' />,
}));

jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useIsPrivilegedSettingsContext: jest.fn(),
}));

jest.mock('../../notAuthorized/NotAuthorizedPage', () => () => <div data-testid='not-authorized' />);

describe('AICenterRoute & AIAgentsPage (R07)', () => {
	const listEndpoint = jest.fn();

	beforeEach(() => {
		jest.clearAllMocks();
		jest.mocked(useIsPrivilegedSettingsContext).mockReturnValue(true);
		jest.mocked(useHasLicenseModule).mockReturnValue({
			isPending: false,
			data: true,
		} as unknown as ReturnType<typeof useHasLicenseModule>);
		listEndpoint.mockResolvedValue({
			engines: [
				{
					engineId: 'eng-1',
					engineName: 'QA engine',
					registered: 2,
					available: 1,
					claimed: 1,
					retired: 0,
					disagreed: 0,
					lastReportAt: '2026-11-25T00:00:00.000Z',
					reportStale: false,
					allowedTools: ['docs_search', 'docs_read'],
					toolOptions: [
						{ id: 'docs_read', name: 'Read a docs page' },
						{ id: 'docs_search', name: 'Search the docs' },
					],
					allowedRoutes: ['openrouter/openai/gpt-4o-mini'],
					skillsCommit: '438544159fd6359527759d2a97dd227ae9f6c58c',
					skills: ['public-docs'],
					eligibleRooms: [{ _id: 'room-1', name: 'general' }],
				},
			],
			agents: [
				{
					_id: 'agent-1',
					engineId: 'eng-1',
					seatId: 'seat-1',
					seatState: 'claimed',
					headVersion: 100,
					status: 'published',
					name: 'Docs Helper',
					rooms: ['room-1'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
					readiness: 'engine ready, app not proved',
					engineConfirmed: true,
					lastReportAt: '2026-11-25T00:00:00.000Z',
					reportStale: false,
					createdAt: '2026-11-25T00:00:00.000Z',
				},
				{
					_id: 'agent-2',
					engineId: 'eng-1',
					seatId: 'seat-2',
					seatState: 'claimed',
					headVersion: 101,
					status: 'disabled',
					name: 'Disabled Helper',
					rooms: ['room-1'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
					readiness: 'disabled',
					engineConfirmed: false,
					lastReportAt: '2026-11-25T00:00:00.000Z',
					reportStale: false,
					createdAt: '2026-11-25T00:00:00.000Z',
				},
				{
					_id: 'agent-3',
					engineId: 'eng-1',
					seatId: 'seat-3',
					seatState: 'claimed',
					headVersion: 102,
					status: 'published',
					name: 'Broken Bot Helper',
					rooms: ['room-1'],
					tools: ['docs_search'],
					modelRoute: 'openrouter/openai/gpt-4o-mini',
					readiness: 'bot-invalid',
					lastReportAt: '2026-11-25T00:00:00.000Z',
					reportStale: false,
					createdAt: '2026-11-25T00:00:00.000Z',
				},
			],
		});
	});

	it('preserves the privileged settings context gate on AICenterRoute', () => {
		jest.mocked(useIsPrivilegedSettingsContext).mockReturnValue(false);

		render(<AICenterRoute />, {
			wrapper: mockAppRoot().withRouteParameter('section', 'agents').build(),
		});

		expect(screen.getByTestId('not-authorized')).toBeInTheDocument();
		expect(listEndpoint).not.toHaveBeenCalled();
	});

	it('shows the Agents capability card as Locked on overview when unlicensed', () => {
		jest.mocked(useHasLicenseModule).mockReturnValue({
			isPending: false,
			data: false,
		} as unknown as ReturnType<typeof useHasLicenseModule>);

		render(<AICenterRoute />, {
			wrapper: mockAppRoot().withSetting('AI_Agents_Enabled', true).build(),
		});

		expect(screen.getByText('AI_Agents')).toBeInTheDocument();
		expect(screen.getAllByText('Locked').length).toBeGreaterThanOrEqual(4);
	});

	it('renders the locked state on /agents when unlicensed and does not query the agents endpoint', () => {
		jest.mocked(useHasLicenseModule).mockReturnValue({
			isPending: false,
			data: false,
		} as unknown as ReturnType<typeof useHasLicenseModule>);

		render(<AICenterRoute />, {
			wrapper: mockAppRoot()
				.withRouteParameter('section', 'agents')
				.withPermission('manage-ai-agents')
				.withSetting('AI_Agents_Enabled', true)
				.withEndpoint('GET', '/experimental/ai-agents.list' as never, listEndpoint)
				.build(),
		});

		expect(screen.getByText('AI_Center_license_required_title')).toBeInTheDocument();
		expect(listEndpoint).not.toHaveBeenCalled();
	});

	it('renders engine seat counts, honest room-check wording, and agent readiness states when licensed and enabled', async () => {
		render(<AICenterRoute />, {
			wrapper: mockAppRoot()
				.withRouteParameter('section', 'agents')
				.withPermission('manage-ai-agents')
				.withSetting('AI_Agents_Enabled', true)
				.withEndpoint('GET', '/experimental/ai-agents.list' as never, listEndpoint)
				.withEndpoint('POST', '/experimental/ai-agents.create' as never, jest.fn())
				.withEndpoint('POST', '/experimental/ai-agents.retry' as never, jest.fn())
				.withEndpoint('POST', '/experimental/ai-agents.disable' as never, jest.fn())
				.build(),
		});

		expect(await screen.findByRole('cell', { name: 'QA engine' })).toBeInTheDocument();
		expect(screen.getByText('1 / 2')).toBeInTheDocument();
		expect(screen.getByText('AI_Agents_room_flags_checked_on_register')).toBeInTheDocument();
		expect(screen.getByText('Docs Helper')).toBeInTheDocument();
		expect(screen.getByText('engine ready, app not proved')).toBeInTheDocument();
		expect(screen.getByText('Disabled Helper')).toBeInTheDocument();
		expect(screen.getByText('Disabled')).toBeInTheDocument();
		expect(screen.getByText('AI_Agents_disable_pending_engine')).toBeInTheDocument();
		expect(screen.getByText('Broken Bot Helper')).toBeInTheDocument();
		expect(screen.getByText('bot-invalid')).toBeInTheDocument();
	});
});
