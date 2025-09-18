/* eslint-disable @typescript-eslint/naming-convention */
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { WizardContext, StepsLinkedList } from '@rocket.chat/ui-client';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import { act, type ComponentProps } from 'react';

import MessageStep from './MessageStep';
import * as stories from './MessageStep.stories';
import { createFakeContact } from '../../../../../../../tests/mocks/data';
import { createFakeOutboundTemplate } from '../../../../../../../tests/mocks/data/outbound-message';
import type { MessageFormSubmitPayload } from '../forms/MessageForm';
import type MessageForm from '../forms/MessageForm';

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story]);

jest.mock('tinykeys', () => ({
	__esModule: true,
	default: jest.fn().mockReturnValue(() => () => undefined),
}));

let isSubmitting = false;
let currentOnSubmit: (payload: MessageFormSubmitPayload) => void = () => undefined;
const mockMessageForm = jest.fn().mockImplementation((props) => {
	currentOnSubmit = props.onSubmit;
	return <div data-testid='message-form'>{props.renderActions?.({ isSubmitting })}</div>;
});

jest.mock('../forms/MessageForm', () => ({
	__esModule: true,
	default: (props: ComponentProps<typeof MessageForm>) => mockMessageForm(props),
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
		currentOnSubmit = () => undefined;
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

	it('should render message form with correct props', () => {
		const defaultValues = { templateId: 'test-template-id' };
		const contact = createFakeContact();
		const templates = [createFakeOutboundTemplate()];

		render(<MessageStep contact={contact} templates={templates} defaultValues={defaultValues} onSubmit={jest.fn()} />, {
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
		render(<MessageStep onSubmit={jest.fn()} />, { wrapper: appRoot.build() });
		const backButton = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(backButton);

		await waitFor(() => expect(mockWizardApi.previous).toHaveBeenCalled());
	});

	it('shows a loading state on the button while submit is pending', async () => {
		isSubmitting = true;
		const handleSubmit = jest.fn();
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
		const onSubmit = jest.fn();

		render(<MessageStep onSubmit={onSubmit} />, { wrapper: appRoot.build() });

		act(() => currentOnSubmit(expectedPayload));

		await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(expectedPayload));
		await waitFor(() => expect(mockWizardApi.next).toHaveBeenCalled());
	});
});
