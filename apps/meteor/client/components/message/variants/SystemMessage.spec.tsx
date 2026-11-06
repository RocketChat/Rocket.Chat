import { faker } from '@faker-js/faker';
import type { IMessage } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { Random } from '@rocket.chat/random';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import SystemMessage from './SystemMessage';
import { selectedMessageStore } from '../../../views/room/providers/SelectedMessagesProvider';

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
	it('should not show escaped html while rendering system message', () => {
		const message = createBaseMessage('& test &');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('changed room description to: & test &')).toBeInTheDocument();
		expect(screen.queryByText('changed room description to: &amp; test &amp;')).not.toBeInTheDocument();
	});

	it('should show a placeholder instead of failing when the message cannot be rendered', () => {
		jest.spyOn(console, 'error').mockImplementation(() => undefined);
		const message = { ...createBaseMessage('test'), actionLinks: [null] } as unknown as IMessage;

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.getByText('Message_could_not_be_displayed')).toBeInTheDocument();
		expect(screen.getByRole('listitem')).toBeInTheDocument();
		expect(screen.getByText('changed room description to: test')).toBeInTheDocument();
	});

	it('should not inject html', () => {
		const message = createBaseMessage('<button title="test-title">OK</button>');

		render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

		expect(screen.queryByTitle('test-title')).not.toBeInTheDocument();
		expect(screen.getByText('changed room description to: <button title="test-title">OK</button>')).toBeInTheDocument();
	});

	describe('while selecting messages', () => {
		const renderMessage = () => {
			const message = createBaseMessage('test');
			render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });
			return message._id;
		};

		beforeEach(() => {
			selectedMessageStore.setIsSelecting(true);
		});

		afterEach(() => {
			selectedMessageStore.reset();
		});

		it('should select the message on a click', async () => {
			const id = renderMessage();

			await userEvent.click(screen.getByRole('listitem'));

			expect(selectedMessageStore.isSelected(id)).toBe(true);
		});

		it.each(['Space', 'Enter'])('should select the message with the %s key', (code) => {
			const id = renderMessage();

			fireEvent.keyDown(screen.getByRole('listitem'), { code });

			expect(selectedMessageStore.isSelected(id)).toBe(true);
		});

		it('should ignore other keys', () => {
			const id = renderMessage();

			fireEvent.keyDown(screen.getByRole('listitem'), { code: 'KeyA' });

			expect(selectedMessageStore.isSelected(id)).toBe(false);
		});

		it('should show a checkbox', () => {
			renderMessage();

			expect(screen.getByRole('checkbox')).toBeInTheDocument();
		});
	});

	describe('outside message selection', () => {
		it('should not select the message on a click or a key', async () => {
			const message = createBaseMessage('test');
			render(<SystemMessage message={message} showUserAvatar />, { wrapper: wrapper.build() });

			await userEvent.click(screen.getByRole('listitem'));
			fireEvent.keyDown(screen.getByRole('listitem'), { code: 'Enter' });

			expect(selectedMessageStore.isSelected(message._id)).toBe(false);
			expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
		});
	});
});
