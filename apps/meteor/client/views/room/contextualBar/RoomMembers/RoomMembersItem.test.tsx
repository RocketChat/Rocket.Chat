import { after, before, beforeEach, describe, it, mock } from 'node:test';

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect } from 'expect';
import { ModuleMocker } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';

import { enterModuleScope, leaveModuleScope } from '../../../../../tests/mocks/moduleScope';

let RoomMembersItem: (typeof import('./RoomMembersItem'))['default'];

const mocker = new ModuleMocker(globalThis);
const fn: ModuleMocker['fn'] = mocker.fn.bind(mocker);

const defaultProps = {
	_id: 'user1',
	name: 'John Doe',
	username: 'johndoe',
	rid: 'GENERAL',
	useRealName: false,
	reload: fn<FunctionLike>(),
	onClickView: fn<FunctionLike>(),
	subscription: { _id: 'sub1', ts: '2025-01-01T00:00:00Z' },
};

describe('keyboard navigation', () => {
	before(() => {
		enterModuleScope();
		mock.module(require.resolve('@rocket.chat/ui-avatar'), {
			exports: {
				UserAvatar: () => null,
			},
		});
		mock.module('../../../../components/UserStatus', {
			exports: {
				ReactiveUserStatus: () => null,
			},
		});
		mock.module('./RoomMembersActions', {
			exports: {
				default: {
					__esModule: true,
					default: () => <button>Actions</button>,
				},
			},
		});
		({ default: RoomMembersItem } = require('./RoomMembersItem'));
	});

	after(leaveModuleScope);

	beforeEach(() => {
		mocker.clearAllMocks();
	});
	it('should be focusable via keyboard', () => {
		render(<RoomMembersItem {...defaultProps} />);
		expect(screen.getByRole('listitem', { name: 'johndoe' })).toHaveAttribute('tabindex', '0');
	});

	it('should call onClickView when Enter is pressed while focused', async () => {
		const user = userEvent.setup();
		const onClickView = fn<FunctionLike>();
		render(<RoomMembersItem {...defaultProps} onClickView={onClickView} />);

		await user.tab();
		await user.keyboard('{Enter}');

		expect(onClickView).toHaveBeenCalledTimes(1);
	});

	it('should call onClickView when Space is pressed while focused', async () => {
		const user = userEvent.setup();
		const onClickView = fn<FunctionLike>();
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
