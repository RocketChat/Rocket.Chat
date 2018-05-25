import toastr from 'toastr';

Template.adminBotDetails.onCreated(function _adminBotDetailsOnCreated() {
	this.bot = new ReactiveVar({});

	this.updateBot = () => {
	};

	this.autorun(() => {
		const username = this.data && this.data.params && this.data.params().username;

		if (username) {
			const sub = this.subscribe('fullUserData');
			if (sub.ready()) {
				let bot;

				if (RocketChat.authz.hasAllPermission('edit-bot-account')) {
					bot = Meteor.users.findOne({ username });
				}

				if (bot) {
					this.bot.set(bot);
				} else {
					toastr.error(TAPi18n.__('No_bot_found'));
					FlowRouter.go('admin-bots');
				}
			}
		}
	});
});

Template.adminBotDetails.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('edit-bot-account');
	},

	bot() {
		return Template.instance().bot.get();
	}
});

Template.adminBotDetails.events({
	'blur input': (e, t) => {
		t.updateBot();
	},

	'click input[type=radio]': (e, t) => {
		t.updateBot();
	},

	'change select[name=event]': (e, t) => {
		const record = t.record.get();
		record.event = $('[name=event]').val().trim();

		t.record.set(record);
	},

	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each((index, codeMirror) => codeMirror.CodeMirror.refresh());
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	}
});
