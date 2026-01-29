import type { DDPCommon } from 'meteor/ddp-common';
import type { Meteor } from 'meteor/meteor';

declare module 'meteor/ddp' {
	namespace DDP {
		const _CurrentInvocation: Meteor.EnvironmentVariable<DDPCommon.MethodInvocation>;
	}
}
