import type { DDPCommon } from 'meteor/ddp-common';

declare module 'meteor/ddp' {
	namespace DDP {
		const _CurrentInvocation: {
			withValue(invocation: DDPCommon.MethodInvocation, func: () => Promise<any>): Promise<any>;
		};
	}
}
