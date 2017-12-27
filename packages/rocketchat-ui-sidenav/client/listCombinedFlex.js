import _ from 'underscore';
import s from 'underscore.string';

Template.listCombinedFlex.helpers({
	channel() {
		return Template.instance().channelsList.get();
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	sortChannelsSelected(sort) {
		return Template.instance().sortChannels.get() === sort;
	},
	sortSubscriptionsSelected(sort) {
		return Template.instance().sortSubscriptions.get() === sort;
	},
	showSelected(show) {
		return Template.instance().show.get() === show;
	},
	channelTypeSelected(type) {
		return Template.instance().channelType.get() === type;
	},
	member() {
		return !!RocketChat.models.Subscriptions.findOne({ name: this.name, open: true });
	},
	hidden() {
		return !!RocketChat.models.Subscriptions.findOne({ name: this.name, open: false });
	},
	roomIcon() {
		return RocketChat.roomTypes.getIcon(this.t);
	},
	url() {
		return this.t === 'p' ? 'group' : 'channel';
	}
});

Template.listCombinedFlex.events({
	'click header'() {
		return SideNav.closeFlex();
	},

	'click .channel-link'() {
		return SideNav.closeFlex();
	},

	'mouseenter header'() {
		return SideNav.overArrow();
	},

	'mouseleave header'() {
		return SideNav.leaveArrow();
	},

	'scroll .content': _.throttle(function(e, t) {
		if (t.hasMore.get() && (e.target.scrollTop >= (e.target.scrollHeight - e.target.clientHeight))) {
			return t.limit.set(t.limit.get() + 50);
		}
	}, 200),

	'submit .search-form'(e) {
		return e.preventDefault();
	},

	'keyup #channel-search': _.debounce((e, instance) => instance.nameFilter.set($(e.currentTarget).val()), 300),

	'change #sort-channels'(e, instance) {
		return instance.sortChannels.set($(e.currentTarget).val());
	},

	'change #channel-type'(e, instance) {
		return instance.channelType.set($(e.currentTarget).val());
	},

	'change #sort-subscriptions'(e, instance) {
		return instance.sortSubscriptions.set($(e.currentTarget).val());
	},

	'change #show'(e, instance) {
		const show = $(e.currentTarget).val();
		if (show === 'joined') {
			instance.$('#sort-channels').hide();
			instance.$('#sort-subscriptions').show();
		} else {
			instance.$('#sort-channels').show();
			instance.$('#sort-subscriptions').hide();
		}
		return instance.show.set(show);
	}
});

Template.listCombinedFlex.onCreated(function() {
	this.channelsList = new ReactiveVar([]);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.nameFilter = new ReactiveVar('');
	this.sortChannels = new ReactiveVar('name');
	this.sortSubscriptions = new ReactiveVar('name');
	this.channelType = new ReactiveVar('all');
	this.show = new ReactiveVar('all');
	this.type = this.t === 'p' ? 'group' : 'channel';

	return this.autorun(() => {
		if (this.show.get() === 'joined') {
			this.hasMore.set(true);
			const options = { fields: { name: 1, t: 1 } };
			if (_.isNumber(this.limit.get())) {
				options.limit = this.limit.get();
			}
			if (s.trim(this.sortSubscriptions.get())) {
				switch (this.sortSubscriptions.get()) {
					case 'name':
						options.sort = { name: 1 };
						break;
					case 'ls':
						options.sort = { ls: -1 };
						break;
				}
			}
			let type = {$in: ['c', 'p']};
			if (s.trim(this.channelType.get())) {
				switch (this.channelType.get()) {
					case 'public':
						type = 'c';
						break;
					case 'private':
						type = 'p';
						break;
				}
			}
			this.channelsList.set(RocketChat.models.Subscriptions.find({
				name: new RegExp(s.trim(s.escapeRegExp(this.nameFilter.get())), 'i'),
				t: type
			}, options).fetch()
			);
			if (this.channelsList.get().length < this.limit.get()) {
				return this.hasMore.set(false);
			}
		} else {
			return Meteor.call('channelsList', this.nameFilter.get(), this.channelType.get(), this.limit.get(), this.sortChannels.get(), (err, result) => {
				if (result) {
					this.hasMore.set(true);
					this.channelsList.set(result.channels);
					if (result.channels.length < this.limit.get()) {
						return this.hasMore.set(false);
					}
				}
			}
			);
		}
	}
	);
});
