import { DDP } from 'meteor/ddp';
import { DDPCommon } from 'meteor/ddp-common';

class MethodInvocation extends DDPCommon.MethodInvocation {
	twoFactorChecked?: boolean;

	constructor(options: {
		connection: {
			id: string;
			close: () => void;
			clientAddress: string;
			httpHeaders: Record<string, any>;
		};
		isSimulation?: boolean;
		userId?: string;
	}) {
		super(options);
		const currentInvocation = DDP._CurrentInvocation.get();

		if (currentInvocation) {
			this.twoFactorChecked = (currentInvocation as MethodInvocation).twoFactorChecked;
		}
	}
}

DDPCommon.MethodInvocation = MethodInvocation;
