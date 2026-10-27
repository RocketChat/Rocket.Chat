import { ConnectionLifecycle, ConnectionRegistry } from '@rocket.chat/ddp-server';

export const lifecycle = new ConnectionLifecycle();

/** The websocket sessions this process serves. */
export const sessions = new ConnectionRegistry(lifecycle);
