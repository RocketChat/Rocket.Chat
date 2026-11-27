import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import CategoryMenu from './CategoryMenu';

jest.mock('./hooks/useCategoryModals', () => ({
	useCategoryModals: () => ({ openCreate: jest.fn(), openManage: jest.fn(), openDelete: jest.fn() }),
}));

const defaultProps = {
	showUnreads: false,
	keepUnreadsOnTop: false,
	canMoveUp: true,
	canMoveDown: true,
	onMoveUp: jest.fn(),
	onMoveDown: jest.fn(),
};

const renderOptions = {
	wrapper: mockAppRoot()
		.withJohnDoe()
		.withTranslations('en', 'core', {
			Options: 'Options',
			Move_up: 'Move up',
			Move_down: 'Move down',
			Unreads: 'Unreads',
			Always_display: 'Always display',
			Keep_on_top: 'Keep on top',
		})
		.build(),
};

const openMenu = async () => userEvent.click(screen.getByRole('button', { name: 'Options' }));

it('should offer both reordering and unread options on a group that can be reordered', async () => {
	render(<CategoryMenu groupKey='Channels' {...defaultProps} />, renderOptions);

	await openMenu();

	expect(await screen.findByRole('menuitemcheckbox', { name: 'Move up' })).toBeInTheDocument();
	expect(screen.getByRole('menuitemcheckbox', { name: 'Move down' })).toBeInTheDocument();
	expect(screen.getByRole('menuitemcheckbox', { name: /Always display/ })).toBeInTheDocument();
	expect(screen.getByRole('menuitemcheckbox', { name: /Keep on top/ })).toBeInTheDocument();
});

it('should offer only the unread options on a dynamic group, which cannot be reordered', async () => {
	render(<CategoryMenu groupKey='Open_Livechats' {...defaultProps} />, renderOptions);

	await openMenu();

	expect(await screen.findByRole('menuitemcheckbox', { name: /Always display/ })).toBeInTheDocument();
	expect(screen.getByRole('menuitemcheckbox', { name: /Keep on top/ })).toBeInTheDocument();
	expect(screen.queryByRole('menuitemcheckbox', { name: 'Move up' })).not.toBeInTheDocument();
	expect(screen.queryByRole('menuitemcheckbox', { name: 'Move down' })).not.toBeInTheDocument();
});
