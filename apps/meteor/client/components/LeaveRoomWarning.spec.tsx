import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';

import LeaveRoomWarning from './LeaveRoomWarning';

it('should render standard warning without E2EE warning when isEncrypted is false', () => {
	render(<LeaveRoomWarning name='general' warnText='Are_you_sure_you_want_to_leave_the_room' isEncrypted={false} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByText('Are_you_sure_you_want_to_leave_the_room')).toBeInTheDocument();
	expect(screen.queryByText('E2E_Leave_Room_Warning')).not.toBeInTheDocument();
});

it('should render E2EE warning when isEncrypted is true', () => {
	render(<LeaveRoomWarning name='secret-room' warnText='Are_you_sure_you_want_to_leave_the_room' isEncrypted={true} />, {
		wrapper: mockAppRoot().build(),
	});

	expect(screen.getByText('Are_you_sure_you_want_to_leave_the_room')).toBeInTheDocument();
	expect(screen.getByText('E2E_Leave_Room_Warning')).toBeInTheDocument();
});

