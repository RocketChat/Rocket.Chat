import { DDPCommon } from 'meteor/ddp-common';
import { DDP } from 'meteor/ddp';

class MethodInvocation extends DDPCommon.MethodInvocation {
	public twoFactorChecked: boolean;

	constructor(options: {
		connection: {
			close: () => void;
			clientAddress: string;
			httpHeaders: Record<string, any>;
		};
		isSimulation?: boolean;
		userId?: string;
	}) {
		const result = super(options);
		const currentInvocation = DDP._CurrentInvocation.get();

		if (currentInvocation) {
			this.twoFactorChecked = currentInvocation.twoFactorChecked;
		}

		// @ts-expect-error - `super` return is typed as `void` even when types says it returns an instance of `MethodInvocation`
		return result;
	}
}

DDPCommon.MethodInvocation = MethodInvocation;
