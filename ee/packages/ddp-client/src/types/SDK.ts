import type { RestClient } from '@rocket.chat/api-client';

import type { Connection } from '../Connection';
import type { TimeoutControl } from '../TimeoutControl';
import type { Account } from './Account';
import type { ClientStream } from './ClientStream';

/*
* The following procedure is used for streaming data:
* In the original Meteor DDP, Collections were used and publications and subscriptions were used to synchronize data between the client and server.
* However, controlling the `mergebox` can be expensive and doesn't scale well for many clients.
* To address this issue, we are using a specific part of the original implementation of the DDP protocol to send the data directly to the client without using the mergebox.
* This allows the client to receive more data directly from the server, even if the data is the same as before.

* To maintain compatibility with the original Meteor DDP, we use virtual collections.
* These collections are not real collections, but rather a way to send data to the client.
* They are named with the prefix stream- followed by the name of the stream.
* Instead of storing the data, they simply call the changed method.
* It's up to the application to handle the changed method and use the data it contains.

* In order for the server to function properly, it is important that it is aware of the 'agreement' and uses the same assumptions.
*/

export interface SDK {
	stream(name: string, params: unknown[], cb: (...data: unknown[]) => void): ReturnType<ClientStream['subscribe']>;

	connection: Connection;
	account: Account;
	client: ClientStream;

	timeoutControl: TimeoutControl;
	rest: RestClient;
}
