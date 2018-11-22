import { Meteor } from 'meteor/meteor';

export function applyMeteor() {
	return {
		created() {
			Object.keys(this.actions).forEach((name) => {
				const original = this.actions[name];
				this.actions[name] = function(...args) {
					return new Promise(Meteor.bindEnvironment((resolve) => {
						resolve(original(...args));
					}));
				};
			});
		},
	};
}
