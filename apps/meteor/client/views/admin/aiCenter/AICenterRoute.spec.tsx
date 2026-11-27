import { mockAppRoot } from '@rocket.chat/mock-providers';
import { useHasLicenseModule } from '@rocket.chat/ui-client';
import { useIsPrivilegedSettingsContext } from '@rocket.chat/ui-contexts';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

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
	describe('tool picker from the engine report', () => {
		const renderAgentsPage = (endpoints: { create?: jest.Mock; retry?: jest.Mock; toast?: jest.Mock } = {}) =>
			render(<AICenterRoute />, {
				wrapper: mockAppRoot()
					.withRouteParameter('section', 'agents')
					.withPermission('manage-ai-agents')
					.withSetting('AI_Agents_Enabled', true)
					.withEndpoint('GET', '/experimental/ai-agents.list' as never, listEndpoint)
					.withEndpoint('POST', '/experimental/ai-agents.create' as never, endpoints.create ?? jest.fn())
					.withEndpoint('POST', '/experimental/ai-agents.retry' as never, endpoints.retry ?? jest.fn())
					.withEndpoint('POST', '/experimental/ai-agents.disable' as never, jest.fn())
					.withToastMessageDispatch(endpoints.toast ?? jest.fn())
					.build(),
			});

		const fillCreateForm = async () => {
			await userEvent.type(screen.getByRole('textbox', { name: 'Name' }), 'Docs Helper');
			await userEvent.type(screen.getByRole('textbox', { name: 'AI_Agents_instructions_label' }), 'Answer from public docs only.');
			// The fixture's only channel, #general, is the last checkbox on the form (tools come before channels).
			const checkboxes = screen.getAllByRole('checkbox');
			await userEvent.click(checkboxes[checkboxes.length - 1]);
		};

		it('shows the engine name for each tool and sends the tool id on Create', async () => {
			const create = jest.fn().mockResolvedValue({ success: true });
			renderAgentsPage({ create });

			await userEvent.click(await screen.findByRole('checkbox', { name: 'Search the docs' }));
			expect(screen.queryByText('docs_search')).not.toBeInTheDocument();
			await fillCreateForm();
			await userEvent.click(screen.getByRole('button', { name: 'AI_Agents_create_action' }));

			await waitFor(() => expect(create).toHaveBeenCalledWith(expect.objectContaining({ tools: ['docs_search'] })));
		});

		it('puts the fixed refusal code in the toast with the sentence', async () => {
			const create = jest.fn().mockRejectedValue({
				success: false,
				error: 'No single available seat offers every chosen tool',
				errorType: 'error-ai-no-seat-offers-all-tools',
			});
			const toast = jest.fn();
			renderAgentsPage({ create, toast });

			// Tools are optional on Create; this case only exercises the refusal toast.
			expect(await screen.findByText('#general')).toBeInTheDocument();
			await fillCreateForm();
			await userEvent.click(screen.getByRole('button', { name: 'AI_Agents_create_action' }));

			await waitFor(() =>
				expect(toast).toHaveBeenCalledWith({
					type: 'error',
					message: 'No single available seat offers every chosen tool (error-ai-no-seat-offers-all-tools)',
				}),
			);
		});

		it('shows every tool the agent has on Retry, marks a withdrawn one, and lets it be removed but not added back', async () => {
			const listed = await listEndpoint();
			listEndpoint.mockResolvedValue({
				...listed,
				agents: [
					...listed.agents,
					{
						_id: 'agent-4',
						engineId: 'eng-1',
						seatId: 'seat-4',
						seatState: 'claimed',
						name: 'Pending Helper',
						rooms: ['room-1'],
						tools: ['weather_get'],
						toolOptions: [
							{ id: 'docs_search', name: 'Search the docs' },
							{ id: 'weather_get', name: 'Weather', withdrawn: true },
						],
						readiness: 'incomplete',
						reportStale: false,
						createdAt: '2026-11-25T00:00:00.000Z',
					},
				],
			});
			const retry = jest.fn().mockResolvedValue({ success: true });
			renderAgentsPage({ retry });

			const row = await screen.findByRole('row', { name: /Pending Helper/ });
			await userEvent.click(within(row).getByRole('button', { name: 'AI_Agents_retry_action' }));

			// The withdrawn tool is on the form at all (Create's engine pool never had it).
			expect(screen.getByText('Weather')).toBeInTheDocument();
			const withdrawn = screen.getByRole('checkbox', { name: /Weather/ });
			expect(withdrawn).toBeChecked();
			expect(screen.getByText('AI_Agents_tool_withdrawn')).toBeInTheDocument();
			await userEvent.click(withdrawn);
			expect(withdrawn).not.toBeChecked();
			expect(withdrawn).toBeDisabled();
			expect(screen.getByRole('checkbox', { name: 'Search the docs' })).toBeEnabled();

			await userEvent.type(screen.getByRole('textbox', { name: 'AI_Agents_instructions_label' }), 'Answer from public docs only.');
			// The form's submit button comes before the list's row buttons.
			await userEvent.click(screen.getAllByRole('button', { name: 'AI_Agents_retry_action' })[0]);

			await waitFor(() => expect(retry).toHaveBeenCalledWith(expect.objectContaining({ agentId: 'agent-4', tools: [] })));
		});
	});
});
