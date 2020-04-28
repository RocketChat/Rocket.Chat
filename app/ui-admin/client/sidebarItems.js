import { ReactiveVar } from 'meteor/reactive-var';
import { Tracker } from 'meteor/tracker';

import { hasPermission } from '../../authorization/client';

const items = new ReactiveVar([]);

export const registerAdminSidebarItem = (itemOptions) => {
	Tracker.nonreactive(() => items.set([...items.get(), itemOptions]));
};

export const getSidebarItems = () => items.get().filter((option) => !option.permissionGranted || option.permissionGranted());

registerAdminSidebarItem({
	href: 'invites',
	i18nLabel: 'Invites',
	icon: 'user-plus',
	permissionGranted: () => hasPermission('create-invite-links'),
});
