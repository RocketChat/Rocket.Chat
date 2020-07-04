import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

const items = new ReactiveVar([]);

export const registerAdminSidebarItem = (itemOptions) => {
	Tracker.nonreactive(() => items.set([...items.get(), itemOptions]));
};

export const getSidebarItems = () => items.get().filter((option) => !option.permissionGranted || option.permissionGranted());
