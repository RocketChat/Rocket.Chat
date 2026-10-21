import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ConnectionStatusContext } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import UserPresenceProvider from './UserPresenceProvider';
import { Presence } from '../lib/presence';

jest.mock('../lib/presence', () => ({
	Presence: {
		setStatus: jest.fn(),
		resync: jest.fn(),
	},
}));

jest.mock('../lib/userPresence', () => ({
	UserPresence: class {
		use = () => undefined;
	},
}));

const Connection = ({ connected, children }: { connected: boolean; children: ReactNode }) => (
	<ConnectionStatusContext.Provider value={{ ...useContext(ConnectionStatusContext), connected }}>
		{children}
	</ConnectionStatusContext.Provider>
);

it('should resync presence once the connection is re-established', () => {
	const { rerender } = render(
		<Connection connected={false}>
			<UserPresenceProvider />
		</Connection>,
		{ wrapper: mockAppRoot().build() },
	);

	expect(Presence.resync).not.toHaveBeenCalled();

	rerender(
		<Connection connected>
			<UserPresenceProvider />
		</Connection>,
	);

	expect(Presence.resync).toHaveBeenCalledTimes(1);
});
