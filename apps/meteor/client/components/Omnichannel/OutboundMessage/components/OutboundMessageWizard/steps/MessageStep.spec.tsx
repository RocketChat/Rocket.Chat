import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { forwardRef, useImperativeHandle } from 'react';

import MessageStep from './MessageStep';
import { createFakeContact } from '../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate } from '../../../../../../../tests/mocks/data/outbound-message';
import type { MessageFormRef } from '../forms/MessageForm';
import type MessageForm from '../forms/MessageForm';

const mockSubmit = jest.fn();

const mockMessageFormRender = jest.fn((_props) => <form name='message-form' />);
jest.mock('../forms/MessageForm', () => ({
	__esModule: true,
	default: forwardRef<MessageFormRef, ComponentProps<typeof MessageForm>>((props, ref) => {
		useImperativeHandle(ref, () => ({ submit: mockSubmit }));
		return mockMessageFormRender(props);
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

describe('MessageStep', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<MessageStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should render message form with correct props', () => {
		const defaultValues = { templateId: 'test-template-id' };
		const contact = createFakeContact();
		const templates = [createFakeOutboundTemplate()];

		render(<MessageStep contact={contact} templates={templates} defaultValues={defaultValues} onSubmit={jest.fn()} />, {
			wrapper: appRoot.build(),
		});

		expect(screen.getByRole('form')).toBeInTheDocument();
		expect(mockMessageFormRender).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultValues,
				contact,
				templates,
			}),
		);
	});

	it('should call onSubmit with form values when form submits successfully', async () => {
		const expectedPayload = { templateId: 'test-template-id' };
		mockSubmit.mockResolvedValue(expectedPayload);
		const onSubmit = jest.fn();

		render(<MessageStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByRole('button', { name: 'Next' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});

	it('should not call onSubmit and prevent default when form submission rejects', async () => {
		mockSubmit.mockRejectedValueOnce(new Error('Submission Error'));
		const onSubmit = jest.fn();

		render(<MessageStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

		nextButton.dispatchEvent(clickEvent);

		await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
		await waitFor(() => expect(clickEvent.defaultPrevented).toBeTruthy());
	});

	it('should call previous step when back button is clicked', async () => {
		render(<MessageStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

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

		render(<MessageStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

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

		render(<MessageStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		rejectPromise(new Error('Failed to submit'));

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});
});
