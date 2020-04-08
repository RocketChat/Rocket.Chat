import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

const options = new ReactiveVar([]);

export const AdminBox = {
	addOption: (option) => {
		Tracker.nonreactive(() => options.set([...options.get(), option]));
	},
	getOptions: () => options.get().filter((option) => !option.permissionGranted || option.permissionGranted()),
};
