import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import PinMessageModal from './PinMessageModal';
import { createFakeMessage } from '../../../../../tests/mocks/data';

jest.mock('../../../../../rocketchat.info', () => ({ Info: {} }));
jest.mock('../../../../lib/rooms/roomCoordinator', () => ({ roomCoordinator: { isLivechatRoom: () => false } }));
jest.mock('../../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));

it('highlights the words the viewer highlights in the quoted message (R36)', () => {
	const message = createFakeMessage({
		msg: 'say alpha',
		md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'say alpha' }] }],
	});

	render(<PinMessageModal message={message} onConfirm={jest.fn()} onCancel={jest.fn()} />, {
		wrapper: mockAppRoot().withJohnDoe().withUserPreference('highlights', ['alpha']).build(),
	});

	expect(screen.getByTitle('Highlighted_chosen_word')).toHaveTextContent('alpha');
});
