import { ServerContext } from '@rocket.chat/ui-contexts';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import type { ContextType, ReactNode } from 'react';
import { useState } from 'react';

const users = [
	{ _id: 'u1', username: 'rocket.cat', name: 'Rocket Cat' },
	{ _id: 'u2', username: 'john.doe', name: 'John Doe' },
	{ _id: 'u3', username: 'jane.roe', name: 'Jane Roe' },
];

const rooms = [
	{ _id: 'GENERAL', name: 'general', fname: 'general', t: 'c' },
	{ _id: 'r2', name: 'design', fname: 'design', t: 'c' },
	{ _id: 'r3', name: 'leadership', fname: 'leadership', t: 'p' },
];

const directMessages = [{ _id: 'd1', name: 'john.doe', fname: 'John Doe', t: 'd' }];

const matches = (term: string | undefined, ...values: (string | undefined)[]) =>
	!term || values.some((value) => value?.toLowerCase().includes(term.toLowerCase()));

const searchTerm = (selector: unknown, key: string): string | undefined => {
	try {
		const parsed: Record<string, string | undefined> = JSON.parse(String(selector));
		return parsed[key];
	} catch {
		return undefined;
	}
};

// The playground has no Rocket.Chat server; elements that fetch users or rooms read this sample data instead.
const respond = (pathPattern: string, params: Record<string, unknown> | undefined) => {
	switch (pathPattern) {
		case '/v1/users.autocomplete': {
			const term = searchTerm(params?.selector, 'term');
			return { items: users.filter(({ username, name }) => matches(term, username, name)) };
		}

		case '/v1/rooms.autocomplete.channelAndPrivate': {
			const term = searchTerm(params?.selector, 'name');
			return { items: rooms.filter(({ name, fname }) => matches(term, name, fname)) };
		}

		case '/v1/users.info':
			return { user: users.find(({ username }) => username === params?.username) };

		case '/v1/rooms.info':
			return { room: [...rooms, ...directMessages].find(({ _id }) => _id === params?.roomId) };

		case '/v1/subscriptions.get':
			return { update: [...rooms, ...directMessages].map(({ _id, ...room }) => ({ _id: `sub-${_id}`, rid: _id, ...room })), remove: [] };

		default:
			throw new Error(`The playground does not mock ${pathPattern}`);
	}
};

const serverContextValue = {
	absoluteUrl: (path: string) => path,
	callMethod: async () => undefined,
	callEndpoint: async ({ pathPattern, params }: { pathPattern: string; params?: Record<string, unknown> }) => respond(pathPattern, params),
	getStream: () => () => undefined,
} as unknown as ContextType<typeof ServerContext>;

const PlaygroundServer = ({ children }: { children: ReactNode }) => {
	const [queryClient] = useState(() => new QueryClient());

	return (
		<ServerContext.Provider value={serverContextValue}>
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		</ServerContext.Provider>
	);
};

export default PlaygroundServer;
