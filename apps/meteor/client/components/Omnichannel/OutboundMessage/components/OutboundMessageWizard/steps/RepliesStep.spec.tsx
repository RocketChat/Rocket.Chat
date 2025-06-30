import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { forwardRef, useImperativeHandle } from 'react';

import RepliesStep from './RepliesStep';
import type { RepliesFormRef } from '../forms/RepliesForm';
import type RepliesForm from '../forms/RepliesForm';

const mockSubmit = jest.fn();

const mockRepliesFormRender = jest.fn((_props) => <form name='replies-form' />);
jest.mock('../forms/RepliesForm', () => ({
	__esModule: true,
	default: forwardRef<RepliesFormRef, ComponentProps<typeof RepliesForm>>((props, ref) => {
		useImperativeHandle(ref, () => ({ submit: mockSubmit }));
		return mockRepliesFormRender(props);
	}),
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

		expect(screen.getByRole('form')).toBeInTheDocument();
		expect(mockRepliesFormRender).toHaveBeenCalledWith(expect.objectContaining({ defaultValues }));
	});

	it('should call onSubmit with form values when form submits successfully', async () => {
		const expectedPayload = { templateId: 'test-template-id' };
		mockSubmit.mockResolvedValue(expectedPayload);
		const onSubmit = jest.fn();

		render(<RepliesStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByRole('button', { name: 'Next' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});

	it('should not call onSubmit and prevent default when form submission rejects', async () => {
		mockSubmit.mockRejectedValueOnce(new Error('Submission Error'));
		const onSubmit = jest.fn();

		render(<RepliesStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

		nextButton.dispatchEvent(clickEvent);

		await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
		await waitFor(() => expect(clickEvent.defaultPrevented).toBeTruthy());
	});

	it('should call previous step when back button is clicked', async () => {
		render(<RepliesStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const backButton = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(backButton);

		await waitFor(() => expect(mockWizardApi.previous).toHaveBeenCalled());
	});

	it('shows a loading state on the button while submit is pending', async () => {
		let resolvePromise: (value: unknown) => void = jest.fn();
		mockSubmit.mockImplementation(
			() =>
				new Promise((resolve) => {
					resolvePromise = resolve;
				}),
		);

		render(<RepliesStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		resolvePromise(undefined);

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});

	it('removes loading state if submit rejects', async () => {
		let rejectPromise: (reason?: any) => void = jest.fn();
		mockSubmit.mockReturnValue(
			new Promise((_, reject) => {
				rejectPromise = reject;
			}),
		);

		render(<RepliesStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		rejectPromise(new Error('Failed to submit'));

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});
});
