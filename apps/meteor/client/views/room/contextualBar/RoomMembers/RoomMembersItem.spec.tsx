import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';

import RoomMembersItem from './RoomMembersItem';

jest.mock('@rocket.chat/ui-avatar', () => ({
	...jest.requireActual('@rocket.chat/ui-avatar'),
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
	it('should be focusable via keyboard', async () => {
		const user = userEvent.setup();
		render(<RoomMembersItem {...defaultProps} />);

		await user.tab();

		expect(screen.getByRole('button', { name: 'johndoe' })).toHaveFocus();
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

	it('should keep the actions menu outside the member button', async () => {
		const user = userEvent.setup();
		render(<RoomMembersItem {...defaultProps} />);

		await user.tab();

		expect(screen.getByRole('button', { name: 'johndoe' })).not.toContainElement(screen.getByRole('button', { name: 'Actions' }));
	});
});

describe('user info', () => {
	it('should pass the member id to onClickView', async () => {
		const user = userEvent.setup();
		const onClickView = jest.fn((e) => e.currentTarget.dataset.userid);
		render(<RoomMembersItem {...defaultProps} onClickView={onClickView} />);

		await user.click(screen.getByRole('button', { name: 'johndoe' }));

		expect(onClickView).toHaveReturnedWith('user1');
	});

	it('should render as a list item', () => {
		render(<RoomMembersItem {...defaultProps} />);

		expect(screen.getByRole('listitem')).toHaveAttribute('data-username', 'johndoe');
	});
});

describe('accessibility', () => {
	it('should have no a11y violations inside the members list', async () => {
		const { container } = render(
			<div role='list' aria-label='Members'>
				<RoomMembersItem {...defaultProps} />
			</div>,
		);

		const results = await axe(container);
		expect(results).toHaveNoViolations();
	});
});
