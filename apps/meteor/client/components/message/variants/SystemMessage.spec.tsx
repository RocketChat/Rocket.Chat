import { faker } from '@faker-js/faker';
import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Random } from '@rocket.chat/random';
import { render, screen } from '@testing-library/react';

import SystemMessage from './SystemMessage';
import { createFakeRoom } from '../../../../tests/mocks/data';

jest.mock('../content/Attachments', () => ({
	default: () => <div>attachments</div>,
}));

jest.mock('../content/MessageActions', () => ({
	default: () => <div>message actions</div>,
}));

jest.mock('meteor/meteor', () => {
	const actual = jest.requireActual('meteor/meteor');
	return {
		...actual,
		Meteor: {
			...actual.Meteor,
			startup: (callback: () => void) => callback(),
		},
	};
});

const wrapper = mockAppRoot().withTranslations('en', 'core', {
	changed_room_description_to__room_description_: 'changed room description to: {{room_description}}',
});

const createBaseMessage = (msg: string): IMessage => ({
	_id: Random.id(),
	t: 'room_changed_description',
	rid: Random.id(),
	ts: new Date(),
	msg,
	u: {
		_id: Random.id(),
		username: faker.person.firstName().toLocaleLowerCase(),
		name: faker.person.fullName(),
	},
	groupable: false,
	_updatedAt: new Date(),
});

describe('SystemMessage', () => {
	it('should render system message', () => {
		const message = createBaseMessage('& test &');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
	});

	it('should not show escaped html while rendering system message', () => {
		const message = createBaseMessage('& test &');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
		expect(screen.queryByText('changed room description to: &amp; test &amp;')).not.toBeInTheDocument();
	});

	it('should not inject html', () => {
		const message = createBaseMessage('<button title="test-title">OK</button>');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.queryByTitle('test-title')).not.toBeInTheDocument();
		expect(screen.getByText('changed room description to: <button title="test-title">OK</button>')).toBeInTheDocument();
	});

	describe('left room messages', () => {
		const leftTranslations = {
			User_left_this_channel: 'left the channel',
			User_left_this_discussion: 'left the discussion',
		};

		it('should say the user left the discussion inside a discussion', () => {
			const message = { ...createBaseMessage(''), t: 'ul' } as IMessage;

			render(<SystemMessage message={message} showUserAvatar />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', leftTranslations)
					.withRoom(createFakeRoom({ _id: message.rid, prid: Random.id() }))
					.build(),
			});

			expect(screen.getByText('left the discussion')).toBeInTheDocument();
		});

		it('should say the user left the channel outside a discussion', () => {
			const message = { ...createBaseMessage(''), t: 'ul' } as IMessage;

			render(<SystemMessage message={message} showUserAvatar />, {
				wrapper: mockAppRoot()
					.withTranslations('en', 'core', leftTranslations)
					.withRoom(createFakeRoom({ _id: message.rid }))
					.build(),
			});

			expect(screen.getByText('left the channel')).toBeInTheDocument();
		});
	});
});
