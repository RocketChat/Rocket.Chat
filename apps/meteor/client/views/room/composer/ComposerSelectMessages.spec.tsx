import { mockAppRoot } from '@rocket.chat/mock-providers';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import ComposerSelectMessages from './ComposerSelectMessages';
import { selectedMessageStore } from '../providers/SelectedMessageStore';

const wrapper = mockAppRoot()
	.withTranslations('en', 'core', {
		__count__messages_selected: '{{count}} messages selected',
		Select__count__messages: 'Select {{count}} messages',
		Clear_selection: 'Clear selection',
	})
	.build();

afterEach(() => {
	act(() => selectedMessageStore.reset());
	selectedMessageStore.availableMessages.clear();
});

it('counts the rendered messages not selected, follows selecting and is disabled at 0 (R48)', async () => {
	const onClickSelectAll = jest.fn();
	render(<ComposerSelectMessages onClickSelectAll={onClickSelectAll} />, { wrapper });
	const selectAll = () => screen.getByRole('button', { name: /^Select \d+ messages$/ });
	expect(selectAll()).toBeDisabled();
	expect(screen.getByText('0 messages selected')).toBeInTheDocument();

	act(() => {
		selectedMessageStore.addAvailableMessage('first');
		selectedMessageStore.addAvailableMessage('second');
		selectedMessageStore.addAvailableMessage('third');
	});
	expect(selectAll()).toHaveTextContent('Select 3 messages');
	expect(selectAll()).toBeEnabled();

	act(() => {
		selectedMessageStore.toggle('first');
		selectedMessageStore.removeAvailableMessage('first');
	});
	expect(screen.getByText('1 messages selected')).toBeInTheDocument();
	expect(selectAll()).toHaveTextContent('Select 2 messages');

	act(() => selectedMessageStore.removeAvailableMessage('third'));
	expect(selectAll()).toHaveTextContent('Select 1 messages');

	await userEvent.click(selectAll());
	expect(onClickSelectAll).toHaveBeenCalledTimes(1);

	act(() => selectedMessageStore.removeAvailableMessage('second'));
	expect(selectAll()).toBeDisabled();
});
