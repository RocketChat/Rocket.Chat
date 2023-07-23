import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { expect, spy } from 'chai';

import TranscriptModal from '../../../../../../client/components/Omnichannel/modals/TranscriptModal';

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

describe('components/Omnichannel/TranscriptModal', () => {
	it('should show Undo request button when roomOpen is true and transcriptRequest exist', () => {
		const onDiscardMock = spy();
		render(<TranscriptModal {...defaultProps} onDiscard={onDiscardMock} />);
		const undoRequestButton = screen.getByText('Undo_request');

		fireEvent.click(undoRequestButton);

		expect(onDiscardMock).to.have.been.called();
	});

	it('should show Request button when roomOpen is true and transcriptRequest not exist', () => {
		render(<TranscriptModal {...{ ...defaultProps, room: { ...room, transcriptRequest: undefined } }} />);

		const requestBtn = screen.getByRole('button', { name: 'request-button' });
		expect(requestBtn).to.be.visible;
	});

	it('should show Send button when roomOpen is false', () => {
		render(<TranscriptModal {...{ ...defaultProps, room: { ...room, open: false } }} />);

		const sendBtn = screen.getByRole('button', { name: 'send-button' });
		expect(sendBtn).to.be.visible;
	});
});
