import { DDP } from 'meteor/ddp';
import { DDPCommon } from 'meteor/ddp-common';

class MethodInvocation extends DDPCommon.MethodInvocation {
	constructor(options) {
		const result = super(options);
		const currentInvocation = DDP._CurrentInvocation.get();

		if (currentInvocation) {
			this.twoFactorChecked = currentInvocation.twoFactorChecked;
		}

		return result;
	}
}

DDPCommon.MethodInvocation = MethodInvocation;
