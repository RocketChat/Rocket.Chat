import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import UserInfoActions from './UserInfoActions';
import { useUserInfoActions } from '../../hooks/useUserInfoActions';

jest.mock('../../hooks/useUserInfoActions', () => ({
	useUserInfoActions: jest.fn(),
}));

jest.mock('../../../hooks/useMemberExists', () => ({
	useMemberExists: () => ({ data: { isMember: true }, refetch: jest.fn(), isSuccess: true, isPending: false }),
}));

it('labels every action, including the ones that only carry a title', () => {
	jest.mocked(useUserInfoActions).mockReturnValue({
		actions: [
			['openDirectMessage', { content: 'Message', icon: 'balloon', onClick: jest.fn() }],
			['videoCall', { title: 'Video call', icon: 'video', onClick: jest.fn() }],
		],
		menuActions: undefined,
	} as unknown as ReturnType<typeof useUserInfoActions>);

	render(<UserInfoActions user={{ _id: 'user-id', username: 'user' }} rid='room-id' />, { wrapper: mockAppRoot().build() });

	expect(screen.getByRole('button', { name: 'Message' })).toHaveTextContent('Message');
	expect(screen.getByRole('button', { name: 'Video call' })).toHaveTextContent('Video call');
});
