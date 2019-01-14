import _ from 'underscore';
import s from 'underscore.string';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { SideNav } from 'meteor/rocketchat:ui-utils';
import { Subscriptions } from 'meteor/rocketchat:models';

Template.listPrivateGroupsFlex.helpers({
	groups() {
		return Template.instance().groups.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	sortSelected(sort) {
		return Template.instance().sort.get() === sort;
	},
	hidden() {
		return !!Subscriptions.findOne({ name: this.name, open: false });
	},
});

Template.listPrivateGroupsFlex.events({
	'click header'() {
		return SideNav.closeFlex();
	},

	'click .channel-link'() {
		return SideNav.closeFlex();
	},

	'scroll .content': _.throttle(function(e, t) {
		if (t.hasMore.get() && (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight))) {
			return t.limit.set(t.limit.get() + 50);
		}
	}, 200),

	'keyup #channel-search': _.debounce((e, instance) => instance.nameFilter.set($(e.currentTarget).val()), 300),

	'submit .search-form'(e) {
		return e.preventDefault();
	},

	'change #sort'(e, instance) {
		return instance.sort.set($(e.currentTarget).val());
	},
});

Template.listPrivateGroupsFlex.onCreated(function() {
	this.groups = new ReactiveVar([]);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.nameFilter = new ReactiveVar('');
	this.sort = new ReactiveVar('name');

	return this.autorun(() => {
		this.hasMore.set(true);
		const options = { fields: { name: 1 } };
		if (_.isNumber(this.limit.get())) {
			options.limit = this.limit.get();
		}
		if (s.trim(this.sort.get())) {
			switch (this.sort.get()) {
				case 'name':
					options.sort = { name: 1 };
					break;
				case 'ls':
					options.sort = { ls: -1 };
					break;
			}
		}

		this.groups.set(Subscriptions.find({
			name: new RegExp(s.trim(s.escapeRegExp(this.nameFilter.get())), 'i'),
			t: 'p',
			archived: { $ne: true },
		}, options).fetch()
		);
		if (this.groups.get().length < this.limit.get()) {
			return this.hasMore.set(false);
		}
	}
	);
});
