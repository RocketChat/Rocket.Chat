import { Meteor } from 'meteor/meteor';

export function applyMeteor(keys = [], schema = []) {
	return {
		created() {
			function apply(obj, key) {
				Object.keys(obj[key]).forEach((name) => {
					const original = obj[key][name];
					obj[key][name] = function meteorEnvironment(...args) {
						return new Promise(Meteor.bindEnvironment((resolve) => {
							resolve(original(...args));
						}));
					};
				});
			}
			['actions', ...keys].forEach((name) => apply(this, name));
			schema.forEach((name) => apply(this.schema, name));
		},
	};
}
