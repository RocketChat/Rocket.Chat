import type { IncomingHttpHeaders } from 'http';

import type { LoginSessionPayload, DeviceLoginPayload } from '@rocket.chat/core-typings';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';
import { getClientAddress } from '../lib/getClientAddress';
import { deviceManagementEvents } from '../services/device-management/events';
import { sauEvents } from '../services/sauMonitor/events';

Accounts.onLogin((info: ILoginAttempt) => {
	const {
		methodArguments,
		connection: { httpHeaders },
	} = info;

	if (!info.user) {
		return;
	}

	const { resume } = methodArguments.find((arg) => 'resume' in arg) ?? {};
	const loginToken = resume ? Accounts._hashLoginToken(resume) : '';
	const instanceId = InstanceStatus.id();
	const userId = info.user._id;
	const connectionId = info.connection.id;
	const clientAddress = getClientAddress(info.connection);
	const userAgent = getHeader(httpHeaders, 'user-agent');
	const host = getHeader(httpHeaders, 'host');

	const loginEventObject: LoginSessionPayload = {
		userId,
		instanceId,
		userAgent,
		loginToken,
		connectionId,
		clientAddress,
		host,
	};
	sauEvents.emit('accounts.login', loginEventObject);

	const deviceLoginEventObject: DeviceLoginPayload = {
		userId,
		userAgent,
		loginToken,
		clientAddress,
	};
	deviceManagementEvents.emit('device-login', deviceLoginEventObject);
});

Accounts.onLogout((info) => {
	const { httpHeaders } = info.connection;

	if (!info.user) {
		return;
	}
	sauEvents.emit('accounts.logout', {
		userId: info.user._id,
		connection: { instanceId: InstanceStatus.id(), ...info.connection, httpHeaders: httpHeaders as IncomingHttpHeaders },
	});
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		const { httpHeaders } = connection;
		sauEvents.emit('socket.disconnected', {
			instanceId: InstanceStatus.id(),
			...connection,
			httpHeaders: httpHeaders as IncomingHttpHeaders,
		});
	});
});

Meteor.onConnection((connection) => {
	const { httpHeaders } = connection;
	sauEvents.emit('socket.connected', { instanceId: InstanceStatus.id(), ...connection, httpHeaders: httpHeaders as IncomingHttpHeaders });
});

// TODO: extract this function to another file
const getHeader = (headers: unknown, key: string): string => {
	if (!headers) {
		return '';
	}

	if (typeof (headers as any).get === 'function') {
		return (headers as Headers).get(key) ?? '';
	}

	return (headers as Record<string, string | undefined>)[key] || '';
};
