/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';
import { forwardRef, useImperativeHandle } from 'react';

import RecipientStep from './RecipientStep';
import * as stories from './RecipientStep.stories';
import type { RecipientFormRef } from '../forms/RecipientForm';
import type RecipientForm from '../forms/RecipientForm';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

const mockSubmit = jest.fn();

jest.mock('../forms/RecipientForm', () => ({
	__esModule: true,
	default: forwardRef<RecipientFormRef, ComponentProps<typeof RecipientForm>>((_, ref) => {
		useImperativeHandle(ref, () => ({ submit: mockSubmit }));
		return <form name='recipient-form' />;
	}),
}));

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head,
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

describe('RecipientStep', () => {
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

	it('should call onSubmit with form values when license is present and form submits successfully', async () => {
		const expectedPayload = { phone: '1234567890' };
		mockSubmit.mockResolvedValueOnce(expectedPayload);
		const onSubmit = jest.fn();

		render(<RecipientStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		await userEvent.click(screen.getByRole('button', { name: 'Next' }));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});

	it('should not call onSubmit and prevent default when form submission rejects', async () => {
		mockSubmit.mockRejectedValueOnce(new Error('Submission Error'));
		const onSubmit = jest.fn();

		render(<RecipientStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		const clickEvent = new MouseEvent('click', { bubbles: true, cancelable: true });

		nextButton.dispatchEvent(clickEvent);

		await waitFor(() => expect(mockSubmit).toHaveBeenCalled());
		await waitFor(() => expect(onSubmit).not.toHaveBeenCalled());
		await waitFor(() => expect(clickEvent.defaultPrevented).toBeTruthy());
	});

	it('shows a loading state on the button while submit is pending', async () => {
		let resolvePromise: (value: unknown) => void = jest.fn();
		mockSubmit.mockReturnValue(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		render(<RecipientStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });
		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		act(() => resolvePromise(undefined));

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});

	it('removes loading state if submit rejects', async () => {
		let rejectPromise: (reason?: any) => void = jest.fn();
		mockSubmit.mockImplementation(() => {
			return new Promise((_, reject) => {
				rejectPromise = reject;
			});
		});

		render(<RecipientStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();

		act(() => rejectPromise(new Error('Failed to submit')));

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});
});
