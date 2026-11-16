import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ForwardMessageModal from './ForwardMessageModal';
import { createFakeMessage } from '../../../../../tests/mocks/data';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../components/UserAndRoomAutoCompleteMultiple', () => ({ __esModule: true, default: () => null }));

const mockMessagesProvider = jest.fn();
// Records how the place mounts the provider, since nothing in a quote reads whether interaction is allowed.
jest.mock('../../../../providers/MessagesProvider', () => ({
	MessagesProvider: (props: Record<string, unknown>) => {
		const { default: MessagesProvider } = jest.requireActual('../../../../providers/MessagesProvider/MessagesProvider');
		mockMessagesProvider(props);
		return <MessagesProvider {...props} />;
	},
}));

const forwarded = createFakeMessage({
	msg: 'look',
	attachments: [{ title: 'Pipeline', text: 'All checks passed.' }] as IMessage['attachments'],
});

it("shows the attachments of the message to forward with the package's quote (message-attachments R22)", () => {
	render(<ForwardMessageModal message={forwarded} permalink='permalink' onClose={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(screen.getByText('Pipeline')).toBeInTheDocument();
	expect(screen.getByText('All checks passed.')).toBeInTheDocument();
});

it('mounts the message provider without interaction (message-capabilities R32)', () => {
	render(<ForwardMessageModal message={forwarded} permalink='permalink' onClose={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().build(),
	});

	expect(mockMessagesProvider).toHaveBeenCalledWith(expect.objectContaining({ allowsInteraction: false }));
});
