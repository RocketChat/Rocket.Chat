/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';

import RecipientStep from './RecipientStep';
import * as stories from './RecipientStep.stories';
import { createFakeContact } from '../../../../../../../../tests/mocks/data';
import { createFakeProviderMetadata } from '../../../../../../../../tests/mocks/data/outbound-message';
import type RecipientForm from '../forms/RecipientForm';
import type { RecipientFormSubmitPayload } from '../forms/RecipientForm';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('tinykeys', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(() => () => undefined),
}));

let isSubmitting = false;
let currentOnSubmit: (payload: RecipientFormSubmitPayload) => void = () => undefined;
const mockRecipientForm = jest.fn().mockImplementation((props) => {
	currentOnSubmit = props.onSubmit;
	return <div data-testid='recipient-form'>{props.renderActions?.({ isSubmitting })}</div>;
});

jest.mock('../forms/RecipientForm', () => ({
	__esModule: true,
	default: (props: ComponentProps<typeof RecipientForm>) => mockRecipientForm(props),
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

	it('shows a loading state on the button while submit is pending', async () => {
		isSubmitting = true;
		const { rerender } = render(<RecipientStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();
		expect(mockWizardApi.next).not.toHaveBeenCalled();

		isSubmitting = false;
		rerender(<RecipientStep onSubmit={jest.fn()} />);

		await waitFor(() => expect(nextButton).not.toBeDisabled());
	});

	it('should call onSubmit with form values when form submits successfully', async () => {
		const expectedPayload: RecipientFormSubmitPayload = {
			contact: createFakeContact({ _id: 'contact-id' }),
			contactId: 'contact-id',
			providerId: 'provider-id',
			provider: createFakeProviderMetadata({ providerId: 'provider-id' }),
			recipient: '',
			sender: '',
		};

		const onSubmit = jest.fn();

		render(<RecipientStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		act(() => currentOnSubmit(expectedPayload));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});
});
