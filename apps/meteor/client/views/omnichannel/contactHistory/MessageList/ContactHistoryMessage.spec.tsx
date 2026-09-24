import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ContactHistoryMessage from './ContactHistoryMessage';
import SequentialContactHistoryMessage from './SequentialContactHistoryMessage';

jest.mock('../../../../lib/utils/fireGlobalEvent', () => ({ fireGlobalEvent: () => undefined }));
jest.mock('../../../room/hooks/useGoToRoom', () => ({ useGoToRoom: () => undefined }));

const message: IMessage = {
	_id: 'mid',
	rid: 'rid',
	ts: new Date('2021-10-27T00:00:00.000Z'),
	u: { _id: 'uid', username: 'agent', name: 'Agent' },
	msg: 'hello there',
	md: [{ type: 'PARAGRAPH', value: [{ type: 'PLAIN_TEXT', value: 'hello there' }] }],
	_updatedAt: new Date('2021-10-27T00:00:00.000Z'),
};

describe('contact history message variants', () => {
	it('opens a group with the author line', () => {
		render(<ContactHistoryMessage message={message} isNewDay={false} showUserAvatar />, { wrapper: mockAppRoot().build() });

		expect(screen.getByText('hello there')).toBeInTheDocument();
		expect(screen.getByText('@agent')).toBeInTheDocument();
	});

	it('continues a group without the author line', () => {
		render(<SequentialContactHistoryMessage message={message} isNewDay={false} showUserAvatar />, { wrapper: mockAppRoot().build() });

		expect(screen.getByText('hello there')).toBeInTheDocument();
		expect(screen.queryByText('@agent')).not.toBeInTheDocument();
	});
});
