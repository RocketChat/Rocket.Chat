import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import AuditMessageList from './AuditMessageList';
import { createFakeMessage } from '../../../../tests/mocks/data';

jest.mock('../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../components/message/variants/RoomMessage', () => ({
	__esModule: true,
	default: () => {
		const MessageContextsProbe = jest.requireActual('../../../../tests/mocks/client/MessageContextsProbe').default;
		return <MessageContextsProbe />;
	},
}));

it('shows audited messages with the app renderers and no interaction (R32)', () => {
	render(<AuditMessageList messages={[createFakeMessage()]} />, { wrapper: mockAppRoot().withJohnDoe().build() });

	expect(screen.getByText('app renderers, interaction off')).toBeInTheDocument();
});
