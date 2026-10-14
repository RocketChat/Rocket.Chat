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
import type { ComponentProps } from 'react';

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);
mock.module('../../OutboundMessagePreview', {
	exports: {
		default: {
			__esModule: true,
			default: (props: any) => <div data-testid='outbound-message-preview' {...props} />,
		},
	},
});
const { default: ReviewStep }: typeof import('./ReviewStep') = require('./ReviewStep');
const stories: typeof import('./ReviewStep.stories') = require('./ReviewStep.stories');

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

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
	.withTranslations('en', 'core', {
		Send: 'Send',
	})
	.wrap((children) => {
		return <WizardContext.Provider value={mockWizardApi}>{children}</WizardContext.Provider>;
	})
	.build();

describe('ReviewStep', () => {
	const onSendMock = fn<FunctionLike>();

	const defaultProps: ComponentProps<typeof ReviewStep> = {
		onSend: onSendMock,
	};

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

	it('renders correctly with OutboundMessagePreview and a send button', () => {
		render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });

		expect(screen.getByTestId('outbound-message-preview')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('should call previous step when back button is clicked', async () => {
		render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });
		const backButton = screen.getByRole('button', { name: 'Back' });
		await userEvent.click(backButton);

		await waitFor(() => expect(mockWizardApi.previous).toHaveBeenCalled());
	});

	it('calls onSend when the send button is clicked', async () => {
		onSendMock.mockResolvedValue(undefined);
		render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		expect(onSendMock).toHaveBeenCalledTimes(1);
	});

	it('shows a loading state on the button while onSend is pending', async () => {
		let resolvePromise: (value: unknown) => void = fn<FunctionLike>();
		onSendMock.mockReturnValue(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		await waitFor(() => expect(sendButton).toBeDisabled());

		resolvePromise(undefined);

		await waitFor(() => expect(sendButton).not.toBeDisabled());
	});

	it('removes loading state if onSend rejects', async () => {
		let rejectPromise: (reason?: any) => void = fn<FunctionLike>();
		onSendMock.mockReturnValue(
			new Promise((_, reject) => {
				rejectPromise = reject;
			}),
		);

		render(<ReviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		await waitFor(() => expect(sendButton).toBeDisabled());

		rejectPromise(new Error('Failed to send'));

		await waitFor(() => expect(sendButton).not.toBeDisabled());
	});
});
