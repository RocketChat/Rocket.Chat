import { Accounts } from 'meteor/accounts-base';
import { DDP } from 'meteor/ddp';
import { DDPCommon } from 'meteor/ddp-common';

/**
 * A Meteor method invocation for `connection`, so code run through `applyInvocation` sees the user, the connection and
 * its login token the way a method called over Meteor's own DDP would.
 */
export const createMeteorInvocation = (
	connection: {
		id: string;
		close: () => void;
		clientAddress: string;
		httpHeaders: Record<string, any>;
	},
	userId?: string,
	token?: string,
) => {
	const invocation = new DDPCommon.MethodInvocation({
		connection,
		isSimulation: false,
		userId,
	});

	Accounts._accountData[connection.id] = {
		connection,
	};
	if (token) {
		Accounts._setAccountData(connection.id, 'loginToken', token);
	}

	return {
		invocation,
		applyInvocation: <F extends () => Promise<any>>(action: F): ReturnType<F> => {
			return DDP._CurrentInvocation.withValue(invocation as any, async () => action()) as ReturnType<F>;
		},
		[Symbol.asyncDispose]() {
			return Promise.resolve();
		},
	};
};
