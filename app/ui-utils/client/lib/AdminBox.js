import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';
import _ from 'underscore';

export const AdminBox = new class {
	constructor() {
		this.options = new ReactiveVar([]);
	}
	addOption(option) {
		return Tracker.nonreactive(() => {
			const actual = this.options.get();
			actual.push(option);
			return this.options.set(actual);
		});
	}
	getOptions() {
		return _.filter(this.options.get(), function(option) {
			if ((option.permissionGranted == null) || option.permissionGranted()) {
				return true;
			}
		});
	}
};
