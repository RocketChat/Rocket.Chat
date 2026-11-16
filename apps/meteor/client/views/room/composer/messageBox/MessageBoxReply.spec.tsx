import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import MessageBoxReply from './MessageBoxReply';
import { createFakeMessage } from '../../../../../tests/mocks/data';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../components/message/content/attachments/QuoteAttachment', () => ({
	QuoteAttachment: () => {
		const MessageContextsProbe = jest.requireActual('../../../../../tests/mocks/client/MessageContextsProbe').default;
		return <MessageContextsProbe />;
	},
}));

it('shows the quoted message with the app renderers and no interaction (R32)', () => {
	render(<MessageBoxReply reply={createFakeMessage()} />, { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(screen.getByText('app renderers, interaction off')).toBeInTheDocument();
});
