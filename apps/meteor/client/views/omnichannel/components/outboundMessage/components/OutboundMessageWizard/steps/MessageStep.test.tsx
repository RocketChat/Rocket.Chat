import { beforeEach, describe, it, mock, test } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { axe } from 'jest-axe';
import type { FunctionLike } from 'jest-mock';
import { ModuleMocker } from 'jest-mock';
import { act, type ComponentProps } from 'react';

import type { MessageFormSubmitPayload } from '../forms/MessageForm';
import type MessageForm from '../forms/MessageForm';

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
mock.module('../forms/MessageForm', {
	exports: {
		default: {
			__esModule: true,
			default: (props: ComponentProps<typeof MessageForm>) => mockMessageForm(props),
		},
	},
});
const { default: MessageStep }: typeof import('./MessageStep') = require('./MessageStep');
const stories: typeof import('./MessageStep.stories') = require('./MessageStep.stories');
const {
	createFakeContact,
}: typeof import('../../../../../../../../tests/mocks/data') = require('../../../../../../../../tests/mocks/data');
const {
	createFakeOutboundTemplate,
}: typeof import('../../../../../../../../tests/mocks/data/outbound-message') = require('../../../../../../../../tests/mocks/data/outbound-message');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

let isSubmitting = false;
let currentOnSubmit: (payload: MessageFormSubmitPayload) => void = () => undefined;
const mockMessageForm = fn<FunctionLike>().mockImplementation((props) => {
	currentOnSubmit = props.onSubmit;
	return <div data-testid='message-form'>{props.renderActions?.({ isSubmitting })}</div>;
});

const steps = new StepsLinkedList([
	{ id: 'test-step-1', title: 'Test Step 1' },
	{ id: 'test-step-2', title: 'Test Step 2' },
	{ id: 'test-step-3', title: 'Test Step 3' },
]);

const mockWizardApi = {
	steps,
	currentStep: steps.head?.next ?? null,
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

describe('MessageStep', () => {
	beforeEach(() => {
		currentOnSubmit = () => undefined;
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

	it('should render message form with correct props', () => {
		const defaultValues = { templateId: 'test-template-id' };
		const contact = createFakeContact();
		const templates = [createFakeOutboundTemplate()];

		render(<MessageStep contact={contact} templates={templates} defaultValues={defaultValues} onSubmit={fn<FunctionLike>()} />, {
			wrapper: appRoot.build(),
		});

		expect(screen.getByTestId('message-form')).toBeInTheDocument();
		expect(mockMessageForm).toHaveBeenCalledWith(
			expect.objectContaining({
				defaultValues,
				contact,
				templates,
			}),
		);
	});

	it('should call previous step when back button is clicked', async () => {
		render(<MessageStep onSubmit={fn<FunctionLike>()} />, { wrapper: appRoot.build() });
		const backButton = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(backButton);

		await waitFor(() => expect(mockWizardApi.previous).toHaveBeenCalled());
	});

	it('shows a loading state on the button while submit is pending', async () => {
		isSubmitting = true;
		const handleSubmit = fn<FunctionLike>();
		render(<MessageStep onSubmit={handleSubmit} />, { wrapper: appRoot.build() });

		const nextButton = screen.getByRole('button', { name: 'Next' });
		await userEvent.click(nextButton);

		expect(nextButton).toBeDisabled();
		expect(handleSubmit).not.toHaveBeenCalled();
	});

	it('should call onSubmit with form values when form submits successfully', async () => {
		const expectedPayload = {
			templateId: 'test-template-id',
			template: createFakeOutboundTemplate({ id: 'test-template-id' }),
			templateParameters: {},
		};
		const onSubmit = fn<FunctionLike>();

		render(<MessageStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		act(() => currentOnSubmit(expectedPayload));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
		await waitFor(() => expect(mockWizardApi.next).toHaveBeenCalled());
	});
});
