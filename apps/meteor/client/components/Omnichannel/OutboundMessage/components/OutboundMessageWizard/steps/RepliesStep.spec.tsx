/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { act, type ComponentProps } from 'react';

import RepliesStep from './RepliesStep';
import * as stories from './RepliesStep.stories';
import type RepliesForm from '../forms/RepliesForm';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

let isSubmitting = false;
let currentOnSubmit: (payload: Record<string, unknown>) => void = () => undefined;
const mockRepliesForm = jest.fn().mockImplementation((props) => {
	currentOnSubmit = props.onSubmit;
	return <div data-testid='replies-form'>{props.renderActions?.({ isSubmitting })}</div>;
});
jest.mock('../forms/RepliesForm', () => ({
	__esModule: true,
	default: (props: ComponentProps<typeof RepliesForm>) => mockRepliesForm(props),
}));

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
	{ id: 'test-step-3', title: 'Test Step 3' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head?.next ?? null,
	next: jest.fn(),
	previous: jest.fn(),
	register: jest.fn(),
	goTo: jest.fn(),
	resetNextSteps: jest.fn(),
};

const appRoot = mockAppRoot()
	.withJohnDoe()
	.wrap((children) => {
		return <WizardContext.Provider value={mockWizardApi}>{children}</WizardContext.Provider>;
	});

describe('RepliesStep', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	test.each(testCases)(`renders %s without crashing`, async (_storyname, Story) => {
		const view = render(<Story />, { wrapper: mockAppRoot().build() });
		expect(view.baseElement).toMatchSnapshot();
	});

	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should pass accessibility tests', async () => {
		const defaultValues = { departmentId: 'test-department-id', agentId: 'test-agent-id' };

		const { container } = render(<RepliesStep defaultValues={defaultValues} onSubmit={jest.fn()} />, {
			wrapper: appRoot.build(),
		});
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render message form with correct props', () => {
		const defaultValues = { departmentId: 'test-department-id', agentId: 'test-agent-id' };

		render(<RepliesStep defaultValues={defaultValues} onSubmit={jest.fn()} />, {
			wrapper: appRoot.build(),
		});

		expect(screen.getByTestId('replies-form')).toBeInTheDocument();
		expect(mockRepliesForm).toHaveBeenCalledWith(expect.objectContaining({ defaultValues }));
	});

	it('should call onSubmit with form values when form submits successfully', async () => {
		const expectedPayload = {
			departmentId: 'test-department-id',
			agentId: 'test-agent-id',
		};
		const onSubmit = jest.fn();

		render(<RepliesStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		await act(() => currentOnSubmit(expectedPayload));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});

	it('should call previous step when back button is clicked', async () => {
		render(<RepliesStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const backButton = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(backButton);

		await waitFor(() => expect(mockWizardApi.previous).toHaveBeenCalled());
	});

	it('shows a loading state on the button while submit is pending', async () => {
		isSubmitting = true;
		const { rerender } = render(<RepliesStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		isSubmitting = false;
		rerender(<RepliesStep onSubmit={jest.fn()} />);

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});
});
