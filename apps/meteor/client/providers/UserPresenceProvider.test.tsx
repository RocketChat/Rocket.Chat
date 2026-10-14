import { after, before, describe, it, mock } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { ServerContext } from '@rocket.chat/ui-contexts';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import type { ReactNode } from 'react';
import { useContext } from 'react';

import { enterModuleScope, leaveModuleScope } from '../../tests/mocks/moduleScope';

let UserPresenceProvider: (typeof import('./UserPresenceProvider'))['default'];
let Presence: (typeof import('../lib/presence'))['Presence'];

const Connection = ({ connected, children }: { connected: boolean; children: ReactNode }) => (
	<ServerContext.Provider value={{ ...useContext(ServerContext), connected }}>{children}</ServerContext.Provider>
);

describe('UserPresenceProvider', () => {
	before(() => {
		enterModuleScope();
		mock.module('../lib/presence', {
			exports: {
				Presence: {
					setStatus: fn<FunctionLike>(),
					resync: fn<FunctionLike>(),
				},
			},
		});
		mock.module('../lib/userPresence', {
			exports: {
				UserPresence: class {
					use = () => undefined;
				},
			},
		});
		({ default: UserPresenceProvider } = require('./UserPresenceProvider'));
		({ Presence } = require('../lib/presence'));
	});

	after(leaveModuleScope);

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
});
