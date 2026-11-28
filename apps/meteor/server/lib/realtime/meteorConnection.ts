import type { Session } from '@rocket.chat/ddp-server';
import { Meteor } from 'meteor/meteor';

type MeteorConnection = Omit<Meteor.Connection, 'httpHeaders'> & { httpHeaders: Session['connection']['httpHeaders'] };

const connections = new WeakMap<Session, MeteorConnection>();

/**
 * The session as Meteor code sees a connection, the same object for the session's whole life.
 */
export const getMeteorConnection = (session: Session): MeteorConnection => {
	let connection = connections.get(session);
	if (!connection) {
		connection = {
			id: session.connection.id,
			close: () => session.ws.close(),
			onClose: (fn) => {
				const callback = Meteor.bindEnvironment(fn);
				// as in Meteor, a callback registered after the close still runs
				if (session.ws.readyState === session.ws.CLOSED) {
					Meteor.defer(callback);
					return;
				}
				session.connection.onClose(callback);
			},
			clientAddress: session.connection.clientAddress ?? '',
			httpHeaders: session.connection.httpHeaders,
		};
		connections.set(session, connection);
	}
	return connection;
};

type OnConnectionHook = { each(iterator: (callback: (connection: MeteorConnection) => void) => boolean): void };

/**
 * Runs the `Meteor.onConnection` callbacks for a session, as Meteor does for the sessions it serves itself.
 */
export const announceConnection = (session: Session): void => {
	const connection = getMeteorConnection(session);
	(Meteor.server as unknown as { onConnectionHook: OnConnectionHook }).onConnectionHook.each((callback) => {
		callback(connection);
		return true;
	});
};
