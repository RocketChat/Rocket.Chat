import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PinMessageModal from './PinMessageModal';
import { createFakeMessage } from '../../../../../tests/mocks/data';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));

const mockMessagesProvider = jest.fn();
// Records how the place mounts the provider, since nothing in a quote reads whether interaction is allowed.
jest.mock('../../../../providers/MessagesProvider', () => ({
	MessagesProvider: (props: Record<string, unknown>) => {
		const { default: MessagesProvider } = jest.requireActual('../../../../providers/MessagesProvider/MessagesProvider');
		mockMessagesProvider(props);
		return <MessagesProvider {...props} />;
	},
}));

const quoted = createFakeMessage({
	msg: '**bold**',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'BOLD', value: [{ type: 'PLAIN_TEXT', value: 'bold' }] }] }],
	attachments: [{ title: 'Pipeline', text: 'All checks passed.' }] as IMessage['attachments'],
});

it('shows the quoted message with the app renderers (message-capabilities R32)', () => {
	render(<PinMessageModal message={quoted} onConfirm={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.getByText('bold').tagName).toBe('STRONG');
});

it("shows the attachments of the message to pin with the package's quote (message-attachments R22)", () => {
	render(<PinMessageModal message={quoted} onConfirm={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.getByText('Pipeline')).toBeInTheDocument();
	expect(screen.getByText('All checks passed.')).toBeInTheDocument();
});

it('mounts the message provider without interaction (message-capabilities R32)', () => {
	render(<PinMessageModal message={quoted} onConfirm={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(mockMessagesProvider).toHaveBeenCalledWith(expect.objectContaining({ allowsInteraction: false }));
});
