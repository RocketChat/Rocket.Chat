import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import ComposerContainer from './ComposerContainer';
import { createFakeRoom } from '../../../../tests/mocks/data';

const fakeRoom = createFakeRoom({ t: 'p' });

const isAbacLocked = jest.fn(() => false);
const isReadOnly = jest.fn(() => false);
const isArchived = jest.fn(() => false);

jest.mock('../contexts/RoomContext', () => ({
	useRoom: () => fakeRoom,
	useUserIsSubscribed: () => true,
}));

jest.mock('./ComposerMessage', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerOmnichannel', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerFederation', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerAnonymous', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerBlocked', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerJoinWithPassword', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerSelectMessages', () => ({ __esModule: true, default: () => null }));
jest.mock('./ComposerAirGappedRestricted', () => ({ __esModule: true, default: () => null }));

jest.mock('../hooks/useIsRoomAbacLocked', () => ({
	useIsRoomAbacLocked: () => isAbacLocked(),
}));

jest.mock('./hooks/useMessageComposerIsReadOnly', () => ({
	useMessageComposerIsReadOnly: () => isReadOnly(),
}));

jest.mock('./hooks/useMessageComposerIsArchived', () => ({
	useMessageComposerIsArchived: () => isArchived(),
}));

jest.mock('./hooks/useMessageComposerIsAnonymous', () => ({
	useMessageComposerIsAnonymous: () => false,
}));

jest.mock('./hooks/useMessageComposerIsBlocked', () => ({
	useMessageComposerIsBlocked: () => false,
}));

jest.mock('../../../hooks/useAirGappedRestriction', () => ({
	useAirGappedRestriction: () => [false],
}));

jest.mock('../MessageList/contexts/SelectedMessagesContext', () => ({
	useIsSelecting: () => false,
}));

const appRoot = mockAppRoot().withTranslations('en', 'core', {
	ABAC_Room_locked_member: 'abac-locked',
	room_is_read_only: 'read-only',
	Room_archived: 'archived',
});

const renderComposer = () => render(<ComposerContainer />, { wrapper: appRoot.build() });

describe('ComposerContainer ABAC precedence', () => {
	beforeEach(() => {
		isAbacLocked.mockReturnValue(false);
		isReadOnly.mockReturnValue(false);
		isArchived.mockReturnValue(false);
	});

	it('should render the locked callout for a locked room', () => {
		isAbacLocked.mockReturnValue(true);

		renderComposer();

		expect(screen.getByText('abac-locked')).toBeInTheDocument();
	});

	it('should prefer read-only over locked', () => {
		isAbacLocked.mockReturnValue(true);
		isReadOnly.mockReturnValue(true);

		renderComposer();

		expect(screen.getByText('read-only')).toBeInTheDocument();
		expect(screen.queryByText('abac-locked')).not.toBeInTheDocument();
	});

	it('should prefer archived over locked', () => {
		isAbacLocked.mockReturnValue(true);
		isArchived.mockReturnValue(true);

		renderComposer();

		expect(screen.getByText('archived')).toBeInTheDocument();
		expect(screen.queryByText('abac-locked')).not.toBeInTheDocument();
	});
});
