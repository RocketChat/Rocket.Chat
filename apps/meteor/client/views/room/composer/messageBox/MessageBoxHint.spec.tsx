import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import MessageBoxHint from './MessageBoxHint';
import { E2ERoomState } from '../../../../../app/e2e/client/E2ERoomState';
import { useRoom } from '../../contexts/RoomContext';
import { useE2EERoomState } from '../../hooks/useE2EERoomState';

jest.mock('../../hooks/useE2EERoomState', () => ({
	useE2EERoomState: jest.fn(),
}));

jest.mock('../../contexts/RoomContext', () => ({
	useRoom: jest.fn(),
}));

const renderOptions = {
	wrapper: mockAppRoot()
		.withTranslations('en', 'core', {
			Editing_message: 'Editing message',
			Editing_message_hint: '<strong>esc</strong> to cancel · <strong>enter</strong> to save',
			This_room_is_read_only: 'This room is read only',
			E2EE_Composer_Unencrypted_Message: "You're sending an unencrypted message",
		})
		.build(),
};

describe('MessageBoxHint', () => {
	beforeEach(() => {
		(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId', ro: false });
		(useE2EERoomState as jest.Mock).mockReturnValue(E2ERoomState.WAITING_KEYS);
	});

	describe('Editing message', () => {
		it('renders hint text when isEditing is true', () => {
			render(<MessageBoxHint isEditing={true} isMobile={false} />, renderOptions);
			expect(screen.getByText('Editing message')).toBeInTheDocument();
			expect(screen.getByText('Editing message')).toBeInTheDocument();
		});

		it('renders helpText when isEditing is true and it is not mobile', () => {
			render(<MessageBoxHint isEditing={true} isMobile={false} />, renderOptions);
			expect(screen.getByText(/to save/)).toBeInTheDocument();
		});

		it('renders hint without helpText when isEditing is true and it is mobile', () => {
			render(<MessageBoxHint isEditing={true} isMobile={true} />, renderOptions);
			expect(screen.queryByText(/to save/)).not.toBeInTheDocument();
		});
	});

	describe('Read only', () => {
		beforeEach(() => {
			(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId', ro: true });
		});

		it('renders hint text when Read only is true', () => {
			render(<MessageBoxHint />, renderOptions);
			expect(screen.getByText('This room is read only')).toBeInTheDocument();
		});
	});

	describe('Unencrypted message', () => {
		it('renders hint text when E2EE room with unencrypted messages is true', () => {
			render(<MessageBoxHint e2eEnabled={true} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.getByText("You're sending an unencrypted message")).toBeInTheDocument();
		});

		it('renders "Read only" hint text when E2EE room with unencrypted messages is true', () => {
			(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId', ro: true });

			render(<MessageBoxHint e2eEnabled={true} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.getByText('This room is read only')).toBeInTheDocument();
		});

		it('renders "Editing message" hint text when isEditing is truem, E2EE is enabled and unencrypted messages is true', () => {
			(useRoom as jest.Mock).mockReturnValue({ _id: 'roomId', ro: true });

			render(<MessageBoxHint isEditing={true} e2eEnabled={true} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.getByText('Editing message')).toBeInTheDocument();
		});

		it('does not renders hint text when E2ERoomState is READY', () => {
			(useE2EERoomState as jest.Mock).mockReturnValue(E2ERoomState.READY);

			render(<MessageBoxHint e2eEnabled={true} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.queryByText("You're sending an unencrypted message")).not.toBeInTheDocument();
		});

		it('does not renders hint text when E2ERoomState is DISABLED', () => {
			(useE2EERoomState as jest.Mock).mockReturnValue(E2ERoomState.DISABLED);

			render(<MessageBoxHint e2eEnabled={true} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.queryByText("You're sending an unencrypted message")).not.toBeInTheDocument();
		});

		it('does not renders hint text when unencrypted messages is true and E2EE is disabled', () => {
			render(<MessageBoxHint e2eEnabled={false} unencryptedMessagesAllowed={true} />, renderOptions);
			expect(screen.queryByText("You're sending an unencrypted message")).not.toBeInTheDocument();
		});

		it('does not renders hint text when unencrypted messages is false and E2EE is enabled', () => {
			render(<MessageBoxHint e2eEnabled={true} unencryptedMessagesAllowed={false} />, renderOptions);
			expect(screen.queryByText("You're sending an unencrypted message")).not.toBeInTheDocument();
		});
	});
});
