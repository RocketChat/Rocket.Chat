import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ComponentProps } from 'react';

import PreviewStep from './PreviewStep';

jest.mock('../../OutboundMessagePreview', () => ({
	__esModule: true,
	default: (props: any) => <div data-testid='outbound-message-preview' {...props} />,
}));

const appRoot = mockAppRoot()
	.withJohnDoe()
	.withTranslations('en', 'core', {
		Send: 'Send',
	})
	.build();

describe('PreviewStep', () => {
	const onSendMock = jest.fn();

	const defaultProps: ComponentProps<typeof PreviewStep> = {
		onSend: onSendMock,
	};

	beforeEach(() => {
		jest.clearAllMocks();
	});

	it('renders correctly with OutboundMessagePreview and a send button', () => {
		render(<PreviewStep {...defaultProps} />, { wrapper: appRoot });

		expect(screen.getByTestId('outbound-message-preview')).toBeInTheDocument();
		expect(screen.getByRole('button', { name: 'Send' })).toBeInTheDocument();
	});

	it('should pass accessibility tests', async () => {
		const { container } = render(<PreviewStep {...defaultProps} />, { wrapper: appRoot });
		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});

	it('calls onSend when the send button is clicked', async () => {
		onSendMock.mockResolvedValue(undefined);
		render(<PreviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		expect(onSendMock).toHaveBeenCalledTimes(1);
	});

	it('shows a loading state on the button while onSend is pending', async () => {
		let resolvePromise: (value: unknown) => void = jest.fn();
		onSendMock.mockReturnValue(
			new Promise((resolve) => {
				resolvePromise = resolve;
			}),
		);

		render(<PreviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		await waitFor(() => expect(sendButton).toBeDisabled());

		resolvePromise(undefined);

		await waitFor(() => expect(sendButton).not.toBeDisabled());
	});

	it('removes loading state if onSend rejects', async () => {
		let rejectPromise: (reason?: any) => void = jest.fn();
		onSendMock.mockReturnValue(
			new Promise((_, reject) => {
				rejectPromise = reject;
			}),
		);

		render(<PreviewStep {...defaultProps} />, { wrapper: appRoot });

		const sendButton = screen.getByRole('button', { name: 'Send' });
		await userEvent.click(sendButton);

		await waitFor(() => expect(sendButton).toBeDisabled());

		rejectPromise(new Error('Failed to send'));

		await waitFor(() => expect(sendButton).not.toBeDisabled());
	});
});
