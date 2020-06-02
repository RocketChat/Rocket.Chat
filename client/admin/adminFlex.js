import _ from 'underscore';
import s from 'underscore.string';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import { FlowRouter } from 'meteor/kadira:flow-router';

import { settings } from '../../app/settings';
import { menu, SideNav, Layout } from '../../app/ui-utils/client';
import { t } from '../../app/utils/client';
import { PrivateSettingsCachedCollection } from './PrivateSettingsCachedCollection';
import { hasAtLeastOnePermission } from '../../app/authorization/client';
import { sidebarItems } from './sidebarItems';
import './adminFlex.html';

Template.adminFlex.onCreated(function() {
	this.settingsFilter = new ReactiveVar('');
	if (settings.cachedCollectionPrivate == null) {
		settings.cachedCollectionPrivate = new PrivateSettingsCachedCollection();
		settings.collectionPrivate = settings.cachedCollectionPrivate.collection;
		settings.cachedCollectionPrivate.init();
	}
});

Template.adminFlex.helpers({
	isEmbedded: () => Layout.isEmbedded(),
	sidebarItems: () => sidebarItems.get()
		.filter((sidebarItem) => !sidebarItem.permissionGranted || sidebarItem.permissionGranted())
		.map(({ _id, i18nLabel, icon, href }) => ({
			name: t(i18nLabel || _id),
			icon,
			pathSection: href,
			darken: true,
			isLightSidebar: true,
			active: href === FlowRouter.getRouteName(),
		})),
	hasSettingPermission: () =>
		hasAtLeastOnePermission(['view-privileged-setting', 'edit-privileged-setting', 'manage-selected-settings']),
	groups: () => {
		const filter = Template.instance().settingsFilter.get();
		const query = {
			type: 'group',
		};
		let groups = [];
		if (filter) {
			const filterRegex = new RegExp(s.escapeRegExp(filter), 'i');
			const records = settings.collectionPrivate.find().fetch();
			records.forEach(function(record) {
				if (filterRegex.test(TAPi18n.__(record.i18nLabel || record._id))) {
					groups.push(record.group || record._id);
				}
			});
			groups = _.unique(groups);
			if (groups.length > 0) {
				query._id = {
					$in: groups,
				};
			}
		}

		if (filter && groups.length === 0) {
			return [];
		}

		return settings.collectionPrivate.find(query)
			.fetch()
			.map((item) => ({ ...item, name: t(item.i18nLabel || item._id) }))
			.sort(({ name: a }, { name: b }) => (a.toLowerCase() >= b.toLowerCase() ? 1 : -1))
			.map(({ _id, name }) => ({
				name,
				pathSection: 'admin',
				pathGroup: _id,
				darken: true,
				isLightSidebar: true,
				active: _id === FlowRouter.getParam('group'),
			}));
	},
});

Template.adminFlex.events({
	'click [data-action="close"]'() {
		if (Layout.isEmbedded()) {
			menu.close();
			return;
		}

		SideNav.closeFlex();
	},
	'keyup [name=settings-search]'(e, t) {
		t.settingsFilter.set(e.target.value);
	},
});
