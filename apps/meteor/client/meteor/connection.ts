// Single point of access to Meteor's DDP connection for code outside
// client/meteor, so an SDK-only transport replaces one module instead of every
// caller.
import { Meteor } from 'meteor/meteor';

export type ConnectionStatus = {
	status: 'connected' | 'connecting' | 'failed' | 'waiting' | 'offline';
	connected: boolean;
	retryCount: number;
	retryTime?: number;
};

export const getConnectionStatus = (): ConnectionStatus => ({ ...Meteor.status() });

export const disconnect = () => Meteor.disconnect();

export const reconnect = () => Meteor.reconnect();

export const callMethod = (method: string, ...args: unknown[]): Promise<any> => Meteor.callAsync(method, ...args);

export const callMethodWithoutResult = (method: string, ...args: unknown[]): void => {
	Meteor.call(method, ...args);
};

/** Whether method calls are still waiting for their results, which a store sync must not race */
export const hasPendingMethods = (): boolean => Meteor.connection._outstandingMethodBlocks.length !== 0;

export const onRawMessage = (listener: (rawMessage: string) => void): void => {
	Meteor.connection._stream!.on('message', listener);
};

export const subscribeRaw = (...args: Parameters<typeof Meteor.connection.subscribe>) => Meteor.connection.subscribe(...args);
