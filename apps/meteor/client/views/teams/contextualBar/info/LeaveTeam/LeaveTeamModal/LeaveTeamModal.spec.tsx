import type { IRoom, Serialized } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';

import LeaveTeamModal from './LeaveTeamModal';
import { createFakeRoom } from '../../../../../../../tests/mocks/data';

const room = JSON.parse(JSON.stringify(createFakeRoom({ t: 'c', name: 'general-room' }))) as Serialized<IRoom>;

// StrictMode runs state updaters twice, which exposes updaters that mutate the previous state.
it('unchecks a room that was checked', async () => {
	render(
		<StrictMode>
			<LeaveTeamModal rooms={[room]} onCancel={jest.fn()} onConfirm={jest.fn()} />
		</StrictMode>,
		{ wrapper: mockAppRoot().build() },
	);

	const checkbox = screen.getByRole('checkbox', { name: 'general-room' });

	await userEvent.click(checkbox);
	expect(checkbox).toBeChecked();

	await userEvent.click(checkbox);
	expect(checkbox).not.toBeChecked();
});
