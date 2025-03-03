import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import TranscriptModal from './TranscriptModal';

const room = {
	open: true,
	v: { token: '1234567890' },
	transcriptRequest: {
		email: 'example@example.com',
		subject: 'Transcript of livechat conversation',
	},
} as IOmnichannelRoom;

const defaultProps = {
	room,
	email: 'test@example.com',
	onRequest: () => null,
	onSend: () => null,
	onCancel: () => null,
	onDiscard: () => null,
};

it('should show Undo request button when roomOpen is true and transcriptRequest exist', async () => {
	const onDiscardMock = jest.fn();
	render(<TranscriptModal {...defaultProps} onDiscard={onDiscardMock} />);

	const undoRequestButton = await screen.findByText('Undo_request');
	await userEvent.click(undoRequestButton);

	expect(onDiscardMock).toHaveBeenCalled();
});

it('should show Request button when roomOpen is true and transcriptRequest not exist', async () => {
	render(<TranscriptModal {...{ ...defaultProps, room: { ...room, transcriptRequest: undefined } }} />);

	const requestBtn = await screen.findByRole('button', { name: 'request-button' });
	expect(requestBtn).toBeInTheDocument();
});

it('should show Send button when roomOpen is false', async () => {
	render(<TranscriptModal {...{ ...defaultProps, room: { ...room, open: false } }} />);

	const sendBtn = await screen.findByRole('button', { name: 'send-button' });
	expect(sendBtn).toBeInTheDocument();
});
