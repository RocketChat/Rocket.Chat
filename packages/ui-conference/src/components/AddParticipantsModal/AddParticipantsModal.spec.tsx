import { RING_RECIPIENTS_LIMIT } from '@rocket.chat/core-typings';
import { mockAppRoot } from '@rocket.chat/mock-providers';
import { composeStories } from '@storybook/react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'jest-axe';
import type { ReactNode } from 'react';

import AddParticipantsModal from './AddParticipantsModal';
import * as stories from './AddParticipantsModal.stories';
import { ConferenceContext } from '../../context/ConferenceContext';
import type { UserPickerProps } from '../../context/definitions';
import { buildConferenceContext } from '../../fixtures/storyFixtures';
import { callPreferencesStorageKey } from '../../hooks/useCallDevicesInitialState';

// The mocked app root leaves its toast provider commented out, so what the modal reports has to be observed
// at the dispatch instead of in the DOM.
const dispatchToastMessage = jest.fn();
jest.mock('@rocket.chat/ui-contexts', () => ({
	...jest.requireActual('@rocket.chat/ui-contexts'),
	useToastMessageDispatch: () => dispatchToastMessage,
}));

/**
 * A picker with no server behind it.
 *
 * Which names are on offer, and which of them are already in the room, is the application's to answer — it is
 * handed in whole for exactly that reason. What is left to this modal is what it does with a selection, so the
 * stand-in is the smallest thing that can make one.
 */
const StubPicker = ({ value, onChange, placeholder }: UserPickerProps) => (
	<>
		{['grace', 'alan', 'katherine', 'margaret', 'ada', 'linus'].map((username) => (
			<button key={username} type='button' aria-label={`${placeholder}: ${username}`} onClick={() => onChange([...value, username])}>
				{username}
			</button>
		))}
	</>
);

const addParticipants = jest.fn(async (users: string[]) => ({ added: users.length }));

const preferencesKey = callPreferencesStorageKey('john.doe');

const renderModal = ({ canRing = true, ring = true }: { canRing?: boolean; ring?: boolean } = {}) => {
	localStorage.setItem(preferencesKey, JSON.stringify({ mic: true, cam: false, ring }));

	const AppRoot = mockAppRoot().withJohnDoe().build();
	const conference = buildConferenceContext({
		actions: { addParticipants },
		slots: { renderUserPicker: (props) => <StubPicker {...props} /> },
		viewer: { canRingUsers: canRing },
	});

	const wrapper = ({ children }: { children: ReactNode }) => (
		<AppRoot>
			<ConferenceContext.Provider value={conference}>{children}</ConferenceContext.Provider>
		</AppRoot>
	);

	return render(<AddParticipantsModal onClose={jest.fn()} />, { wrapper });
};

const choose = async (...usernames: string[]) => {
	for await (const username of usernames) {
		await userEvent.click(screen.getByRole('button', { name: `Choose_users: ${username}` }));
	}
};

beforeEach(() => {
	addParticipants.mockClear();
	addParticipants.mockImplementation(async (users: string[]) => ({ added: users.length }));
	dispatchToastMessage.mockClear();
	localStorage.removeItem(preferencesKey);
});

const testCases = Object.values(composeStories(stories)).map((Story) => [Story.storyName || 'Story', Story] as const);

describe('AddParticipantsModal', () => {
	test.each(testCases)('%s should have no a11y violations', async (_storyname, Story) => {
		const { baseElement } = render(<Story />);

		const results = await axe(baseElement);
		expect(results).toHaveNoViolations();
	});
});

it('disables the Add button until a user is selected', async () => {
	renderModal();

	expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();

	await choose('grace');

	await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeEnabled());
});

it('adds the selected user to the conference', async () => {
	renderModal();

	await choose('grace');
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(addParticipants).toHaveBeenCalledWith(['grace'], true));
});

// The endpoint takes at most `RING_RECIPIENTS_LIMIT` at a time and refuses the whole body past that, so a
// picker that went on accepting names was collecting a selection it could only fail to send.
it('refuses to add more people than the call can take at once', async () => {
	renderModal();

	const usernames = ['grace', 'alan', 'katherine', 'margaret', 'ada', 'linus'].slice(0, RING_RECIPIENTS_LIMIT + 1);

	// Only worth running where the stand-in has more names than the limit; otherwise there is nothing to overrun.
	if (usernames.length <= RING_RECIPIENTS_LIMIT) {
		return;
	}

	await choose(...usernames);

	await waitFor(() => expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled());
	expect(addParticipants).not.toHaveBeenCalled();
});

// Anyone already associated with the call is skipped, so a selection can come back empty. Reporting that as
// success would claim people were called who never were.
it('says so when everyone selected was already in the call', async () => {
	addParticipants.mockImplementation(async () => ({ added: 0 }));

	renderModal();

	await choose('grace');
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() =>
		expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'info', message: 'Selected_users_are_already_in_the_call' }),
	);
});

it('reports the users it did add', async () => {
	renderModal();

	await choose('grace');
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(dispatchToastMessage).toHaveBeenCalledWith({ type: 'success', message: 'Users_added' }));
});

it('adds without ringing when ringing is turned off', async () => {
	renderModal({ ring: false });

	await choose('grace');
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(addParticipants).toHaveBeenCalledWith(['grace'], false));
});

// The server checks the same permission before it honours `ring`: without it the request is accepted and the
// ringing quietly dropped, so offering the choice would promise a call nobody's phone is going to make.
it('does not offer to ring where the workspace would not let this caller ring', async () => {
	renderModal({ canRing: false });

	expect(screen.queryByText('Ring_people')).not.toBeInTheDocument();

	await choose('grace');
	await userEvent.click(screen.getByRole('button', { name: 'Add' }));

	await waitFor(() => expect(addParticipants).toHaveBeenCalledWith(['grace'], false));
});
