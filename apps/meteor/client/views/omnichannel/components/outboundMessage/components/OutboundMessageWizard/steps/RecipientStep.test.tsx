import { beforeEach, describe, it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';
import type { ComponentProps } from 'react';

import type RecipientForm from '../forms/RecipientForm';
import type { RecipientFormSubmitPayload } from '../forms/RecipientForm';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module(require.resolve('tinykeys'), {
	exports: {
		default: {
			__esModule: true,
			default: fn<FunctionLike>().mockReturnValue(() => () => undefined),
		},
	},
});
mock.module('../forms/RecipientForm', {
	exports: {
		default: {
			__esModule: true,
			default: (props: ComponentProps<typeof RecipientForm>) => mockRecipientForm(props),
		},
	},
});
const { default: RecipientStep }: typeof import('./RecipientStep') = require('./RecipientStep');
const stories: typeof import('./RecipientStep.stories') = require('./RecipientStep.stories');
const {
	createFakeContact,
}: typeof import('../../../../../../../../tests/mocks/data') = require('../../../../../../../../tests/mocks/data');
const {
	createFakeProviderMetadata,
}: typeof import('../../../../../../../../tests/mocks/data/outbound-message') = require('../../../../../../../../tests/mocks/data/outbound-message');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

let isSubmitting = false;
let currentOnSubmit: (payload: RecipientFormSubmitPayload) => void = () => undefined;
const mockRecipientForm = fn<FunctionLike>().mockImplementation((props) => {
	currentOnSubmit = props.onSubmit;
	return <div data-testid='recipient-form'>{props.renderActions?.({ isSubmitting })}</div>;
});

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head,
	next: fn<FunctionLike>(),
	previous: fn<FunctionLike>(),
	register: fn<FunctionLike>(),
	goTo: fn<FunctionLike>(),
	resetNextSteps: fn<FunctionLike>(),
};

const appRoot = mockAppRoot()
	.withJohnDoe()
	.wrap((children) => {
		return <WizardContext.Provider value={mockWizardApi}>{children}</WizardContext.Provider>;
	});

describe('RecipientStep', () => {
	beforeEach(() => {
		mocker.clearAllMocks();
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`renders ${_storyname} without crashing`, async (t) => {
			const view = render(<Story />, { wrapper: mockAppRoot().build() });
			t.assert.snapshot(view.baseElement);
		});
	});

	testCases.forEach(([_storyname, Story]) => {
		test(`${_storyname} should have no a11y violations`, async () => {
			const { container } = render(<Story />, { wrapper: mockAppRoot().build() });

			const results = await axe(container);
			expect(results).toHaveNoViolations();
		});
	});

	it('shows a loading state on the button while submit is pending', async () => {
		isSubmitting = true;
		const { rerender } = render(<RecipientStep onSubmit={fn<FunctionLike>()} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();
		expect(mockWizardApi.next).not.toHaveBeenCalled();

		isSubmitting = false;
		rerender(<RecipientStep onSubmit={fn<FunctionLike>()} />);

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

		const onSubmit = fn<FunctionLike>();

		render(<RecipientStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		act(() => currentOnSubmit(expectedPayload));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
	});
});
