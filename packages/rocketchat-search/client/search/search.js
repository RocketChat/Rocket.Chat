import toastr from 'toastr';

Meteor.startup(function() {
	RocketChat.MessageAction.addButton({
		id: 'jump-to-search-message',
		icon: 'jump',
		label: 'Jump_to_message',
		action() {
			const message = this._arguments[1];
			if (Session.get('openedRoom') === message.rid) {
				return RoomHistoryManager.getSurroundingMessages(message, 50);
			}

			FlowRouter.goToRoomById(message.rid);
			// RocketChat.MessageAction.hideDropDown();

			if (window.matchMedia('(max-width: 500px)').matches) {
				Template.instance().tabBar.close();
			}

			window.setTimeout(() => {
				RoomHistoryManager.getSurroundingMessages(message, 50);
			}, 400);
			// 400ms is popular among game devs as a good delay before transition starts
			// ie. 50, 100, 200, 400, 800 are the favored timings
		},
		order: 100,
		group: 'menu'
	});
});

Template.RocketSearch.onCreated(function() {

	this.error = new ReactiveVar();
	this.template = new ReactiveVar();

	Meteor.call('rocketchatSearch.getProvider', (error, provider) => {
		if (error) {
			this.error.set({msg:'Cannot load result template for active search provider', error});
		} else {
			this.scope.settings = provider.settings;
			this.template.set(provider.resultTemplate);
		}
	});

	this.search = () => {

		const _p = Object.assign({}, this.scope.parentPayload, this.scope.payload);

		if (this.scope.text.get()) {

			this.scope.searching.set(true);

			Meteor.call('rocketchatSearch.search', this.scope.text.get(), {rid:Session.get('openedRoom')}, _p, (err, result) => {
				if (err) {
					toastr.error(TAPi18n.__('SEARCH_MSG_ERROR_SEARCH_FAILED'));
				} else {
					this.scope.searching.set(false);
					this.scope.result.set(result);
				}
			});
		}
	};

	this.scope = {
		searching: new ReactiveVar(false),
		result: new ReactiveVar(),
		text: new ReactiveVar(),
		settings: {},
		parentPayload: {},
		payload: {},
		search: this.search
	};

});


Template.RocketSearch.events = {
	'keydown #message-search'(evt, t) {
		if (evt.which === 13) {
			evt.preventDefault();
			t.scope.text.set(evt.target.value);
			t.scope.result.set(undefined);
			t.scope.payload = {};
			t.search();
		}
	}
};

Template.RocketSearch.helpers({
	error() {
		return Template.instance().error.get();
	},
	template() {
		return Template.instance().template.get();
	},
	scope() {
		return Template.instance().scope;
	},
	text() {
		return Template.instance().scope.text.get();
	}
});

