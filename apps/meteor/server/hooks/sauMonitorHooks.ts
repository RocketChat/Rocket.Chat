import { hashLoginToken } from '@rocket.chat/account-utils';
import { InstanceStatus } from '@rocket.chat/instance-status';
import { getHeader } from '@rocket.chat/tools';
import { Accounts } from 'meteor/accounts-base';
import { Meteor } from 'meteor/meteor';

import type { ILoginAttempt } from '../lib/auth/ILoginAttempt';
import { deviceManagementEvents } from '../services/device-management/events';
import { sauEvents } from '../services/sauMonitor/events';

// Methods such as verifyEmail pass non-object arguments (e.g. token strings) in methodArguments.
const getResumeToken = (methodArguments: unknown): string | undefined => {
	if (!Array.isArray(methodArguments)) {
		return undefined;
	}

	const resumeArg = methodArguments.find(
		(arg): arg is { resume: string } => typeof arg === 'object' && arg !== null && 'resume' in arg && typeof arg.resume === 'string',
	);

	return resumeArg?.resume;
};

Accounts.onLogin((info: ILoginAttempt) => {
	if (!info.user) {
		return;
	}

	const { methodArguments, connection } = info;
	const httpHeaders = connection?.httpHeaders ?? {};

	const resume = getResumeToken(methodArguments);
	const loginToken = resume ? hashLoginToken(resume) : '';
	const instanceId = InstanceStatus.id();
	const clientAddress = connection?.clientAddress || getHeader(httpHeaders, 'x-real-ip');
	const userAgent = getHeader(httpHeaders, 'user-agent');
	const host = getHeader(httpHeaders, 'host');

	sauEvents.emit('sau.accounts.login', {
		userId: info.user._id,
		instanceId,
		userAgent,
		loginToken,
		connectionId: connection?.id ?? '',
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

	sauEvents.emit('sau.accounts.logout', { userId: info.user._id, sessionId: info.connection?.id ?? '' });
});

Meteor.onConnection((connection) => {
	connection.onClose(async () => {
		sauEvents.emit('sau.socket.disconnected', { connectionId: connection.id, instanceId: InstanceStatus.id() });
	});
});

Meteor.onConnection((connection) => {
	sauEvents.emit('sau.socket.connected', { instanceId: InstanceStatus.id(), connectionId: connection.id });
});
