/* globals _ */
/* globals s */
function __guard__(value, transform) {
	return (typeof value !== 'undefined' && value !== null) ? transform(value) : undefined;
}

/**
 * Left-handside panel allowing to find requests which are currently not subscribed to
 * Adapted copy of packages/rocketchat-ui-sidenav/client/listChannelsFlex.coffee
 * Only the method call selecting the channels is changed.
 */
Template.listRequestsFlex.helpers({
	channel() {
		return __guard__(Template.instance().channelsList, x => x.get());
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
	member() {
		return !!RocketChat.models.Subscriptions.findOne({ name: this.name, open: true });
	},
	hidden() {
		return !!RocketChat.models.Subscriptions.findOne({ name: this.name, open: false });
	}
});

Template.listRequestsFlex.events({
	'click header'() {
		return SideNav.closeFlex();
	},

	'click .channel-link'() {
		return SideNav.closeFlex();
	},

	'click footer .create'() {
		if (RocketChat.authz.hasAtLeastOnePermission('create-p')) {
			return SideNav.setFlex('createRequestFlex');
		}
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
	}
		, 200),

	'submit .search-form'(e) {
		return e.preventDefault();
	},

	'keyup #channel-search': _.debounce((e, instance) => instance.nameFilter.set($(e.currentTarget).val())
		, 300),

	'change #sort-channels'(e, instance) {
		return instance.sortChannels.set($(e.currentTarget).val());
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

Template.listRequestsFlex.onCreated(function() {
	this.channelsList = new ReactiveVar([]);
	this.hasMore = new ReactiveVar(true);
	this.limit = new ReactiveVar(50);
	this.nameFilter = new ReactiveVar('');
	this.sortChannels = new ReactiveVar('name');
	this.sortSubscriptions = new ReactiveVar('name');
	this.show = new ReactiveVar('all');

	return this.autorun(() => {
		if (this.show.get() === 'joined') {
			this.hasMore.set(true);
			const options = { fields: { name: 1 } };
			if (_.isNumber(this.limit.get())) {
				options.limit = this.limit.get();
			}
			if (_.trim(this.sortSubscriptions.get())) {
				switch (this.sortSubscriptions.get()) {
					case 'name':
						options.sort = { name: 1 };
						break;
					case 'ls':
						options.sort = { ls: -1 };
						break;
				}
			}
			this.channelsList.set(RocketChat.models.Subscriptions.find({
				name: new RegExp(s.trim(s.escapeRegExp(this.nameFilter.get())), 'i'),
				t: 'c'
			}, options).fetch()
			);
			if (this.channelsList.get().length < this.limit.get()) {
				return this.hasMore.set(false);
			}
		} else {
			return Meteor.call('requestsList', this.nameFilter.get(), 'public', this.limit.get(), this.sortChannels.get(), (err, result) => {
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
