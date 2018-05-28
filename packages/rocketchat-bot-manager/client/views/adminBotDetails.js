import toastr from 'toastr';

Template.adminBotDetails.onCreated(function _adminBotDetailsOnCreated() {
	this.bot = new ReactiveVar({});
	this.botData = new ReactiveVar({});

	this.updateBot = () => {
	};

	this.autorun(() => {
		const username = this.data && this.data.params && this.data.params().username;

		if (username) {
			const subBot = this.subscribe('fullUserData', username, 1);
			const subData = this.subscribe('fullBotData', username, 1);
			if (subBot.ready() && subData.ready()) {
				let bot;
				let botData;

				if (RocketChat.authz.hasAllPermission('edit-bot-account')) {
					bot = Meteor.users.findOne({ username });
					botData = RocketChat.models.Bots.findOneByUsername(username);
				}

				if (bot) {
					this.bot.set(bot);
					if (botData) {
						this.botData.set(botData);
					}
				} else {
					toastr.error(TAPi18n.__('No_bot_found'));
					FlowRouter.go('admin-bots');
				}
			}
		}
	});

	this.humanReadableTime = (time) => {
		const days = Math.floor(time / 86400);
		const hours = Math.floor((time % 86400) / 3600);
		const minutes = Math.floor(((time % 86400) % 3600) / 60);
		const seconds = Math.floor(((time % 86400) % 3600) % 60);
		let out = '';
		if (days > 0) {
			out += `${ days } ${ TAPi18n.__('days') }, `;
		}
		if (hours > 0) {
			out += `${ hours } ${ TAPi18n.__('hours') }, `;
		}
		if (minutes > 0) {
			out += `${ minutes } ${ TAPi18n.__('minutes') }, `;
		}
		if (seconds > 0) {
			out += `${ seconds } ${ TAPi18n.__('seconds') }`;
		}
		return out;
	};
});

Template.adminBotDetails.helpers({
	hasPermission() {
		return RocketChat.authz.hasAllPermission('edit-bot-account');
	},

	getName() {
		const bot = Template.instance().bot.get();
		return bot.name;
	},

	getUsername() {
		const bot = Template.instance().bot.get();
		return bot.username;
	},

	getFramework() {
		const botData = Template.instance().botData.get();
		return botData.framework;
	},

	getRoles() {
		const bot = Template.instance().bot.get();
		return bot.roles;
	},

	ipAddress() {
		const botData = Template.instance().botData.get();
		return `IP Address: ${ botData.ipAddress }`;
	},

	connectedUptime() {
		const bot = Template.instance().bot.get();
		if (bot.statusConnection && bot.statusConnection !== 'offline') {
			const diff = (new Date()).getTime() - bot.lastLogin.getTime();
			return `Connected: ${ Template.instance().humanReadableTime(diff / 1000) }`;
		}
		return 'Offline';
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
