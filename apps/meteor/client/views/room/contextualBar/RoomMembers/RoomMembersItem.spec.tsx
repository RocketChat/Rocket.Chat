import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

import RoomMembersItem from './RoomMembersItem';

jest.mock('@rocket.chat/ui-avatar', () => ({
	UserAvatar: () => null,
}));

jest.mock('../../../../components/UserStatus', () => ({
	ReactiveUserStatus: () => null,
}));

jest.mock('./RoomMembersActions', () => ({
	__esModule: true,
	default: () => <button>Actions</button>,
}));

const defaultProps = {
	_id: 'user1',
	name: 'John Doe',
	username: 'johndoe',
	rid: 'GENERAL',
	useRealName: false,
	reload: jest.fn(),
	onClickView: jest.fn(),
	subscription: { _id: 'sub1', ts: '2025-01-01T00:00:00Z' },
};

beforeEach(() => {
	jest.clearAllMocks();
});

describe('keyboard navigation', () => {
	it('should be focusable via keyboard', () => {
		render(<RoomMembersItem {...defaultProps} />);
		expect(screen.getByRole('listitem', { name: 'johndoe' })).toHaveAttribute('tabindex', '0');
	});

	it('should call onClickView when Enter is pressed while focused', async () => {
		const user = userEvent.setup();
		const onClickView = jest.fn();
		render(<RoomMembersItem {...defaultProps} onClickView={onClickView} />);

		await user.tab();
		await user.keyboard('{Enter}');

		expect(onClickView).toHaveBeenCalledTimes(1);
	});

	it('should call onClickView when Space is pressed while focused', async () => {
		const user = userEvent.setup();
		const onClickView = jest.fn();
		render(<RoomMembersItem {...defaultProps} onClickView={onClickView} />);

		await user.tab();
		await user.keyboard(' ');

		expect(onClickView).toHaveBeenCalledTimes(1);
	});

	it('should reveal the actions menu when focused', async () => {
		const user = userEvent.setup();
		render(<RoomMembersItem {...defaultProps} />);

		expect(screen.queryByRole('button', { name: 'Actions' })).not.toBeInTheDocument();

		await user.tab();

		expect(screen.getByRole('button', { name: 'Actions' })).toBeInTheDocument();
	});

	it('should apply the focus style when focused via keyboard', async () => {
		const user = userEvent.setup();
		render(<RoomMembersItem {...defaultProps} />);

		await user.tab();

		expect(screen.getByRole('listitem', { name: /johndoe/ })).toHaveClass('rcx-option--focus');
		expect(screen.getByRole('listitem', { name: /johndoe/ })).toHaveFocus();
	});
});
