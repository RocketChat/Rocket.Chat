import _ from 'underscore';
import s from 'underscore.string';

Template.adminFlex.onCreated(function() {
	this.settingsFilter = new ReactiveVar('');
	if (RocketChat.settings.cachedCollectionPrivate == null) {
		RocketChat.settings.cachedCollectionPrivate = new RocketChat.CachedCollection({
			name: 'private-settings',
			eventType: 'onLogged'
		});
		RocketChat.settings.collectionPrivate = RocketChat.settings.cachedCollectionPrivate.collection;
		RocketChat.settings.cachedCollectionPrivate.init();
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
			type: 'group'
		};
		if (filter) {
			const filterRegex = new RegExp(s.escapeRegExp(filter), 'i');
			const records = RocketChat.settings.collectionPrivate.find().fetch();
			let groups = [];
			records.forEach(function(record) {
				if (filterRegex.test(TAPi18n.__(record.i18nLabel || record._id))) {
					groups.push(record.group || record._id);
				}
			});
			groups = _.unique(groups);
			if (groups.length > 0) {
				query._id = {
					$in: groups
				};
			}
		}
		return RocketChat.settings.collectionPrivate.find(query).fetch().map(function(el) {
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
		return RocketChat.AdminBox.getOptions();
	},
	menuItem(name, icon, section, group) {
		return {
			name: t(name),
			icon,
			pathSection: section,
			pathGroup: group,
			darken: true,
			isLightSidebar: true
		};
	},
	embeddedVersion() {
		return RocketChat.Layout.isEmbedded();
	}
});

Template.adminFlex.events({
	'click [data-action="close"]'() {
		SideNav.closeFlex();
	},
	'keyup [name=settings-search]'(e, t) {
		t.settingsFilter.set(e.target.value);
	}
});
