import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import { userEvent } from '@storybook/testing-library';
import { render, screen } from '@testing-library/react';
import { expect, spy } from 'chai';
import React from 'react';

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

		userEvent.click(undoRequestButton);

		expect(onDiscardMock).to.have.been.called();
	});

	it('should show Request button when roomOpen is true and transcriptRequest not exist', async () => {
		render(<TranscriptModal {...{ ...defaultProps, room: { ...room, transcriptRequest: undefined } }} />);

		const requestBtn = await screen.findByRole('button', { name: 'request-button' });
		expect(requestBtn).to.be.visible;
	});

	it('should show Send button when roomOpen is false', async () => {
		render(<TranscriptModal {...{ ...defaultProps, room: { ...room, open: false } }} />);

		const sendBtn = await screen.findByRole('button', { name: 'send-button' });
		expect(sendBtn).to.be.visible;
	});
});
