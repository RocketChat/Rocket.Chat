import type { ILivechatAgent, Serialized } from '@rocket.chat/core-typings';
import { ILivechatAgentStatus, UserStatus } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { screen, render, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { VirtuosoMockContext } from 'react-virtuoso';

import RepliesForm from './RepliesForm';
import { createFakeDepartment, createFakeUser } from '../../../../../../../../../tests/mocks/data';

const mockDepartment = createFakeDepartment({
	_id: 'department-1',
	name: 'Department 1',
});

const mockUser = createFakeUser({
	_id: 'agent-1',
	username: 'agent.one',
	name: 'Agent One',
	roles: ['livechat-agent'],
});

const mockAgentOne: Serialized<ILivechatAgent> = {
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

const mockAgentTwo: Serialized<ILivechatAgent> = {
	_id: 'agent-2',
	username: 'agent.two',
	name: 'Agent 2',
	status: UserStatus.ONLINE,
	statusLivechat: ILivechatAgentStatus.AVAILABLE,
	emails: [{ address: 'a2@test.com', verified: true }],
	_updatedAt: '',
	createdAt: '',
	active: true,
	lastRoutingTime: '',
	livechatCount: 1,
	roles: [],
	type: '',
};

const mockDepartmentAgentOne = {
	...mockAgentOne,
	username: mockAgentOne.username || '',
	agentId: mockUser._id,
	departmentId: mockDepartment._id,
	departmentEnabled: true,
	count: 0,
	order: 0,
};

const mockDepartmentAgentTwo = {
	...mockAgentTwo,
	username: mockAgentTwo.username || '',
	agentId: mockAgentTwo._id,
	departmentId: mockDepartment._id,
	departmentEnabled: true,
	count: 0,
	order: 0,
};

const getDepartmentMock = jest.fn();

const getDepartmentsAutocompleteMock = jest.fn().mockImplementation(() => ({
	departments: [mockDepartment],
	count: 1,
	total: 1,
	offset: 0,
}));

const appRoot = (permissions = ['outbound.can-assign-self-only', 'outbound.can-assign-any-agent']) => {
	const root = mockAppRoot()
		.withUser(mockUser)
		.withEndpoint('GET', '/v1/livechat/department/:_id', () => getDepartmentMock())
		.withEndpoint('GET', '/v1/livechat/department', () => getDepartmentsAutocompleteMock())
		.withTranslations('en', 'core', {
			Department: 'Department',
			Agent: 'Agent',
			optional: 'optional',
			Select_department: 'Select department',
			Select_agent: 'Select agent',
			Error_loading__name__information: 'Error loading {{name}} information',
			Retry: 'Retry',
			Outbound_message_agent_hint: 'Leave empty so any agent from the designated department can manage the replies.',
			Outbound_message_agent_hint_no_permission:
				"You don't have permission to assign an agent. The reply will be assigned to the department.",
		})
		.wrap((children) => (
			<VirtuosoMockContext.Provider value={{ viewportHeight: 300, itemHeight: 28 }}>{children}</VirtuosoMockContext.Provider>
		));

	permissions.forEach((permission) => {
		root.withPermission(permission);
	});

	return root;
};

describe('RepliesForm', () => {
	beforeEach(() => {
		jest.clearAllMocks();

		getDepartmentMock.mockImplementation(() => ({
			department: mockDepartment,
			agents: [mockDepartmentAgentOne, mockDepartmentAgentTwo],
		}));
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot().build() });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('renders correctly with all fields', async () => {
		render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot().build() });

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

		render(<RepliesForm defaultValues={defaultValues} onSubmit={jest.fn()} />, {
			wrapper: appRoot().build(),
		});

		await waitFor(() => expect(screen.getByLabelText('Department (optional)')).toHaveTextContent('Department 1'));
		await waitFor(() => expect(screen.getByLabelText('Agent (optional)')).toHaveTextContent('agent.one'));
	});

	it('should enable agent selection when a department is selected', async () => {
		render(<RepliesForm onSubmit={jest.fn()} />, { wrapper: appRoot().build() });

		const departmentInput = screen.getByLabelText('Department (optional)');
		const agentInput = screen.getByLabelText('Agent (optional)');

		await waitFor(() => expect(departmentInput).not.toHaveAttribute('aria-busy', 'true'));
		expect(agentInput).toBeDisabled();

		await userEvent.click(departmentInput);
		await userEvent.click(await screen.findByRole('option', { name: 'Department 1' }));

		await waitFor(() => expect(agentInput).toBeEnabled());
	});

	it('should show retry button when department fetch fails and retry when button is clicked', async () => {
		getDepartmentMock
			.mockRejectedValueOnce(new Error('API Error')) // useDepartmentList call
			.mockRejectedValueOnce(new Error('API Error')); // RepliesForm call

		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={jest.fn()} />, {
			wrapper: appRoot().build(),
		});

		const departmentErrorMessage = await screen.findByText('Error loading department information');
		expect(departmentErrorMessage).toBeInTheDocument();

		const retryButton = screen.getByRole('button', { name: 'Retry' });
		await userEvent.click(retryButton);

		await waitFor(() => expect(screen.queryByText('Error loading department information')).not.toBeInTheDocument());
	});

	xit('should call submit with correct values when form is submitted', async () => {
		const handleSubmit = jest.fn();
		const defaultValues = {
			departmentId: 'department-1',
			agentId: 'agent-1',
		};

		render(<RepliesForm defaultValues={defaultValues} onSubmit={handleSubmit} />, {
			wrapper: appRoot().build(),
		});

		await waitFor(() =>
			expect(handleSubmit).toHaveBeenCalledWith({
				departmentId: 'department-1',
				department: mockDepartment,
				agentId: 'agent-1',
				agent: mockAgentOne,
			}),
		);
	});

	it('should not submit if department is not found', async () => {
		const handleSubmit = jest.fn();
		getDepartmentMock.mockResolvedValue({ department: null, agents: [] });

		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={handleSubmit} />, { wrapper: appRoot().build() });

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		await waitFor(() => expect(handleSubmit).not.toHaveBeenCalled());
	});

	it('should not submit if agent is not found', async () => {
		getDepartmentMock.mockResolvedValue({ department: mockDepartment, agents: [] });
		const handleSubmit = jest.fn();
		render(<RepliesForm defaultValues={{ departmentId: 'department-1', agentId: 'agent-1' }} onSubmit={handleSubmit} />, {
			wrapper: appRoot([]).build(),
		});

		await userEvent.click(screen.getByRole('button', { name: 'Submit' }));

		await waitFor(() => expect(handleSubmit).not.toHaveBeenCalled());
	});

	it('should not enable "Agent" field if the user doesnt have assign agent permissions', async () => {
		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={jest.fn()} />, {
			wrapper: appRoot([]).build(),
		});

		expect(screen.getByLabelText('Agent (optional)')).toBeDisabled();
		await expect(screen.getByLabelText('Agent (optional)')).toHaveAccessibleDescription(
			`You don't have permission to assign an agent. The reply will be assigned to the department.`,
		);
	});

	it('should display only self when user doesnt have assign any permission', async () => {
		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={jest.fn()} />, {
			wrapper: appRoot(['outbound.can-assign-self-only']).build(),
		});

		await userEvent.click(screen.getByLabelText('Agent (optional)'));

		const agentOneOption = await screen.findByRole('option', { name: 'agent.one' });
		const agentTwoOption = screen.queryByRole('option', { name: 'agent.two' });

		expect(agentOneOption).toBeInTheDocument();
		expect(agentTwoOption).not.toBeInTheDocument();
	});

	it('should display all agents when user has assign any permission', async () => {
		render(<RepliesForm defaultValues={{ departmentId: 'department-1' }} onSubmit={jest.fn()} />, {
			wrapper: appRoot(['outbound.can-assign-any-agent']).build(),
		});

		await userEvent.click(screen.getByLabelText('Agent (optional)'));

		const agentOneOption = await screen.findByRole('option', { name: 'agent.one' });
		const agentTwoOption = await screen.findByRole('option', { name: 'agent.two' });

		expect(agentOneOption).toBeInTheDocument();
		expect(agentTwoOption).toBeInTheDocument();
	});
});
