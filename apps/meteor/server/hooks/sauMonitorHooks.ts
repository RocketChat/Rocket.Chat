import { hashLoginToken } from '@rocket.chat/account-utils';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';
import type { IncomingHttpHeaders } from 'http';

import type { ILoginAttempt } from '../../app/authentication/server/ILoginAttempt';
import { deviceManagementEvents } from '../services/device-management/events';
import { sauEvents } from '../services/sauMonitor/events';

type HeaderLike = IncomingHttpHeaders | Headers | Record<string, string | string[] | undefined>;

const getHeader = <T extends string | string[] = string>(headers: HeaderLike, key: string): T => {
	if (!headers) {
		return '' as T;
	}

	if (headers instanceof Headers) {
		return (headers.get(key) ?? '') as T;
	}

	return (headers[key] ?? '') as T;
};

Accounts.onLogin((info: ILoginAttempt) => {
	const {
		methodArguments,
		connection: { httpHeaders },
	} = info;

	if (!info.user) {
		return;
	}

	const { resume } = methodArguments.find((arg) => 'resume' in arg) ?? {};
	const loginToken = resume ? hashLoginToken(resume) : '';
	const instanceId = InstanceStatus.id();
	const clientAddress = info.connection.clientAddress || getHeader(httpHeaders, 'x-real-ip');
	const userAgent = getHeader(httpHeaders, 'user-agent');
	const host = getHeader(httpHeaders, 'host');

	sauEvents.emit('sau.accounts.login', {
		userId: info.user._id,
		instanceId,
		userAgent,
		loginToken,
		connectionId: info.connection.id,
		clientAddress,
		host,
	});

	if (!loginToken) {
		deviceManagementEvents.emit('device-login', { userId: info.user._id, userAgent, clientAddress });
	}
});

Accounts.onLogout((info) => {
	if (!info.user) {
		return;
	}

	sauEvents.emit('sau.accounts.logout', { userId: info.user._id, sessionId: info.connection.id });
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		sauEvents.emit('sau.socket.disconnected', { connectionId: connection.id, instanceId: InstanceStatus.id() });
	});
});

Meteor.onConnection((connection) => {
	sauEvents.emit('sau.socket.connected', { instanceId: InstanceStatus.id(), connectionId: connection.id });
});
