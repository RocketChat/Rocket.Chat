import type { IOmnichannelRoom } from '@rocket.chat/core-typings';
import React from 'react';
import { render, fireEvent } from '@testing-library/react';
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
	it('should show Discard button when roomOpen is true and transcriptRequest exist', () => {
		const onDiscardMock = spy();
		const { getByText } = render(<TranscriptModal {...defaultProps} onDiscard={onDiscardMock} />);
		const discardButton = getByText('Discard');

		fireEvent.click(discardButton);

		expect(onDiscardMock).to.have.been.called();
	});

	it('should show Request button when roomOpen is true and transcriptRequest not exist', () => {
		const onRequestMock = spy();
		const { getByText } = render(
			<TranscriptModal {...{ ...defaultProps, room: { ...room, transcriptRequest: undefined } }} onRequest={onRequestMock} />,
		);
		const requestButton = getByText('Request');

		fireEvent.click(requestButton);

		expect(onRequestMock).to.have.been.called();
	});

	it('should show Send button when roomOpen is false', () => {
		const onSendMock = spy();
		const { getByText } = render(<TranscriptModal {...{ ...defaultProps, room: { ...room, open: false } }} onSend={onSendMock} />);
		const requestButton = getByText('Send');

		fireEvent.click(requestButton);

		expect(onSendMock).to.have.been.called();
	});
});
