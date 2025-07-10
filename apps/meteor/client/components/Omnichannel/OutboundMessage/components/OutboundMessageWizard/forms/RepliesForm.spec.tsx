import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, render, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RepliesForm from './RepliesForm';
import { createFakeDepartment } from '../../../../../../../tests/mocks/data';

jest.mock('tinykeys', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(() => () => undefined),
}));

const mockDepartment = createFakeDepartment({
	_id: 'department-1',
	name: 'Department 1',
});

const mockAgent: Serialized<ILivechatAgent> = {
	_id: 'agent-1',
	username: 'agent.one',
	name: 'Agent 1',
	status: UserStatus.ONLINE,
	statusLivechat: ILivechatAgentStatus.AVAILABLE,
	emails: [{ address: 'a1@test.com', verified: true }],
	_updatedAt: '',
	createdAt: '',
	active: true,
	lastRoutingTime: '',
	livechatCount: 1,
	roles: [],
	type: '',
};

const mockDepartmentAgent = {
	...mockAgent,
	username: mockAgent.username || '',
	agentId: mockAgent._id,
	departmentId: mockDepartment._id,
	departmentEnabled: true,
	count: 0,
	order: 0,
};

const getDepartmentMock = jest.fn();

const getAgentMock = jest.fn().mockImplementation(() => ({ user: mockAgent }));

const getDepartmentsAutocompleteMock = jest.fn().mockImplementation(() => ({
	departments: [mockDepartment],
	count: 1,
	total: 1,
	offset: 0,
}));

const appRoot = mockAppRoot()
	.withJohnDoe()
	.withEndpoint('GET', '/v1/livechat/department/:_id', () => getDepartmentMock())
	.withEndpoint('GET', '/v1/livechat/users/agent/:_id', () => getAgentMock())
	.withEndpoint('GET', '/v1/livechat/department', () => getDepartmentsAutocompleteMock())
	.withTranslations('en', 'core', {
		Department: 'Department',
		Agent: 'Agent',
		optional: 'optional',
		Select_department: 'Select department',
		Select_agent: 'Select agent',
		Error_loading__name__information: 'Error loading {{name}} information',
		Retry: 'Retry',
	});

describe('RepliesForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		getDepartmentMock.mockImplementation(() => ({
			department: mockDepartment,
			agents: [mockDepartmentAgent],
		}));
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot.build() });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('renders correctly with all fields', async () => {
		render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		expect(screen.getByLabelText('Department (optional)')).toBeInTheDocument();
		expect(screen.getByLabelText('Agent (optional)')).toBeInTheDocument();

		expect(screen.getByLabelText('Department (optional)')).not.toHaveAttribute('aria-disabled');
		expect(screen.getByLabelText('Agent (optional)')).toBeDisabled();
	});

	xit('should render with default values', async () => {
		const defaultValues = {
			departmentId: 'department-1',
			agentId: 'agent-1',
		};

		render(<RepliesForm defaultValues={defaultValues} onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		await waitFor(() => expect(screen.getByLabelText('Department (optional)')).toHaveTextContent('Department 1'));
		await waitFor(() => expect(screen.getByLabelText('Agent (optional)')).toHaveTextContent('agent.one'));
	});

	xit('should enable agent selection when a department is selected', async () => {
		render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const departmentInput = screen.getByLabelText('Department (optional)');
		const agentInput = screen.getByLabelText('Agent (optional)');

		expect(agentInput).toBeDisabled();

		await userEvent.click(departmentInput);
		await userEvent.click(await screen.findByRole('option', { name: 'Department 1' }));

		await waitFor(() => expect(agentInput).not.toBeDisabled());
	});

	it('should show retry button when department fetch fails and retry when button is clicked', async () => {
		getDepartmentMock
			.mockRejectedValueOnce(new Error('API Error')) // useDepartmentList call
			.mockRejectedValueOnce(new Error('API Error')); // RepliesForm call

		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={jest.fn()} />, {
			wrapper: appRoot.build(),
		});

		const departmentErrorMessage = await screen.findByText('Error loading department information');
		expect(departmentErrorMessage).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		await userEvent.click(retryButton);

		await waitFor(() => expect(screen.queryByText('Error loading department information')).not.toBeInTheDocument());
	});

	it('should show retry button when agent fetch fails and retry when button is clicked', async () => {
		getAgentMock.mockRejectedValueOnce(new Error('API Error'));

		const defaultValues = { departmentId: 'department-1', agentId: 'agent-1' };
		render(<RepliesForm defaultValues={defaultValues} onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const agentErrorMessage = await screen.findByText('Error loading agent information');
		expect(agentErrorMessage).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		await userEvent.click(retryButton);

		await waitFor(() => expect(screen.queryByText('Error loading agent information')).not.toBeInTheDocument());
	});

	xit('should call submit with correct values when form is submitted', async () => {
		const handleSubmit = jest.fn();
		const defaultValues = {
			departmentId: 'department-1',
			agentId: 'agent-1',
		};

		render(<RepliesForm defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await waitFor(() =>
			expect(handleSubmit).toHaveBeenCalledWith({
				departmentId: 'department-1',
				department: mockDepartment,
				agentId: 'agent-1',
				agent: mockAgent,
			}),
		);
	});

	it('should not submit if department is not found', async () => {
		const handleSubmit = jest.fn();
		getDepartmentMock.mockResolvedValue({ department: null, agents: [] });
		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={handleSubmit} />, { wrapper: appRoot.build() });

		await waitFor(() => expect(getDepartmentMock).toHaveBeenCalled());

		await waitFor(() => expect(handleSubmit).not.toHaveBeenCalled());
	});

	it('should not submit if agent is not found', async () => {
		const handleSubmit = jest.fn();
		getAgentMock.mockResolvedValue({ user: null });
		render(<RepliesForm defaultValues={{ departmentId: 'department-1', agentId: 'agent-1' }} onSubmit={handleSubmit} />, {
			wrapper: appRoot.build(),
		});

		await waitFor(() => expect(handleSubmit).not.toHaveBeenCalled());
	});
});
