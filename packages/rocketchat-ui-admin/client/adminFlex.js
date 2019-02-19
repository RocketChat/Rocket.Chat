import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/tap:i18n';
import { settings } from 'meteor/rocketchat:settings';
import { CachedCollection } from 'meteor/rocketchat:ui-cached-collection';
import { SideNav, AdminBox, Layout } from 'meteor/rocketchat:ui-utils';
import { t } from 'meteor/rocketchat:utils';
import _ from 'underscore';
import s from 'underscore.string';

Template.adminFlex.onCreated(function() {
	this.settingsFilter = new ReactiveVar('');
	if (settings.cachedCollectionPrivate == null) {
		settings.cachedCollectionPrivate = new CachedCollection({
			name: 'private-settings',
			eventType: 'onLogged',
			useCache: false,
		});
		settings.collectionPrivate = settings.cachedCollectionPrivate.collection;
		settings.cachedCollectionPrivate.init();
	}
});

const label = function() {
	return TAPi18n.__(this.i18nLabel || this._id);
};

// Template.adminFlex.onRendered(function() {
// 	$(this.find('.rooms-list')).perfectScrollbar();
// });

Template.adminFlex.helpers({
	groups() {
		const filter = Template.instance().settingsFilter.get();
		const query = {
			type: 'group',
		};
		if (filter) {
			const filterRegex = new RegExp(s.escapeRegExp(filter), 'i');
			const records = settings.collectionPrivate.find().fetch();
			let groups = [];
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
		return settings.collectionPrivate.find(query).fetch().map(function(el) {
			el.label = label.apply(el);
			return el;
		}).sort(function(a, b) {
			if (a.label.toLowerCase() >= b.label.toLowerCase()) {
				return 1;
			} else {
				return -1;
			}
		});
	},
	label,
	adminBoxOptions() {
		return AdminBox.getOptions();
	},
	menuItem(name, icon, section, group) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
			isLightSidebar: true,
		};
	},
	embeddedVersion() {
		return Layout.isEmbedded();
	},
});

Template.adminFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
	'keyup [name=settings-search]'(e, t) {
		t.settingsFilter.set(e.target.value);
	},
});
