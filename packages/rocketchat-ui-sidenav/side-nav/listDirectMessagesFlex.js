/* globals SideNav */

Template.listDirectMessagesFlex.helpers({
	rooms() {
		return Template.instance().roomsList.get();
	},
	sortSelected(sort) {
		return Template.instance().sort.get() === sort;
	},
	hasMore() {
		return Template.instance().hasMore.get();
	},
	userStatus() {
		return 'status-' + (Session.get('user_' + this.name + '_status') || 'offline');
	},
	hidden() {
		return !!RocketChat.models.Subscriptions.findOne({ name: this.name, open: false });
	}
});

Template.listDirectMessagesFlex.events({
	'click header': function() {
		SideNav.closeFlex();
	},

	'click .channel-link': function() {
		SideNav.closeFlex();
	},

	'click footer .create': function() {
		SideNav.setFlex('privateGroupsFlex');
	},

	'mouseenter header': function() {
		SideNav.overArrow();
	},

	'mouseleave header': function() {
		SideNav.leaveArrow();
	},

	'keyup #channel-search': _.debounce((e, instance) => {
		instance.nameFilter.set($(e.currentTarget).val());
	}, 300),

	'scroll .content': _.throttle((e, instance) => {
		if (instance.hasMore.get() && e.target.scrollTop >= e.target.scrollHeight - e.target.clientHeight) {
			instance.limit.set(instance.limit.get() + 50);
		}
	}, 200),

	'change #sort': (e, instance) => {
		instance.sort.set($(e.currentTarget).val());
	}

});

Template.listDirectMessagesFlex.onCreated(function() {
	this.limit = new ReactiveVar(50);
	this.sort = new ReactiveVar('name');
	this.hasMore = new ReactiveVar(true);
	this.nameFilter = new ReactiveVar('');
	this.roomsList = new ReactiveVar([]);
	this.autorun(() => {
		this.hasMore.set(true);
		let options = { fields: { name: 1 } };
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
		let query = { t: 'd' };
		if (s.trim(this.nameFilter.get())) {
			query.name = new RegExp(s.trim(s.escapeRegExp(this.nameFilter.get())), 'i');
		}

		this.roomsList.set(RocketChat.models.Subscriptions.find(query, options).fetch());
		if (this.roomsList.get().length < this.limit.get()) {
			this.hasMore.set(false);
		}
	});
});
