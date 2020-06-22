declare module 'meteor/meteor' {
	module Meteor {
		function runAsUser(userId: string, f: function): void;
	}
}
