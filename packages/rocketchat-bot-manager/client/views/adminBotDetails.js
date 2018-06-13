import toastr from 'toastr';

Template.adminBotDetails.onCreated(function _adminBotDetailsOnCreated() {
	this.bot = new ReactiveVar({});
	this.changed = new ReactiveVar(false);
	this.ping = new ReactiveVar(undefined);

	this.updateBot = () => {
		const bot = this.bot.get();
		bot.name = $('[name=name]').val().trim();
		bot.username = $('[name=username]').val().trim();
		bot.password = $('[name=password]').val().trim();
		this.changed.set(true);
		this.bot.set(bot);
	};

	this.autorun(() => {
		const username = this.data && this.data.params && this.data.params().username;

		if (username) {
			const sub = this.subscribe('fullUserData', username, 1);
			if (sub.ready()) {
				let bot;

				if (RocketChat.authz.hasAllPermission('edit-bot-account')) {
					bot = Meteor.users.findOne({ username });
				}

				if (bot) {
					bot.botData = bot.customClientData;
					this.bot.set(bot);
				} else {
					toastr.error(TAPi18n.__('No_bot_found'));
					FlowRouter.go('admin-bots');
				}
			}
		}
	});

	this.isOnline = () => {
		const bot = this.bot.get();
		if (bot.statusConnection && bot.statusConnection !== 'offline') {
			return true;
		}
		return false;
	};

	this.autorun(() => {
		let finished = true;
		this.interval = Meteor.setInterval(async() => {
			if (!finished || !this.isOnline()) {
				return;
			}
			finished = false;
			Meteor.call('pingBot', this.bot.get(), (err, ping) => {
				if (err) {
					this.ping.set(Infinity);
				} else {
					this.ping.set(ping);
				}
				finished = true;
			});
		}, 1500);
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
		if (seconds >= 0) {
			out += `${ seconds } ${ TAPi18n.__('seconds') }`;
		}
		return out;
	};
});

Template.adminBotDetails.onDestroyed(function _adminBotDetailsOnDestroyed() {
	Meteor.clearInterval(this.interval);
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
		const bot = Template.instance().bot.get();
		if (bot.botData && bot.botData.framework) {
			return bot.botData.framework;
		}
		return 'Undefined';
	},

	getRoles() {
		const bot = Template.instance().bot.get();
		return bot.roles;
	},

	isPaused() {
		const bot = Template.instance().bot.get();
		if (bot.botData) {
			return bot.botData.pausedMsgStream;
		}
	},

	isOnline() {
		return Template.instance().isOnline();
	},

	ipAddress() {
		const bot = Template.instance().bot.get();
		if (bot.botData) {
			return bot.botData.ipAddress;
		}
	},

	ping() {
		const ping = Template.instance().ping.get();
		const formattedPing = (ping === Infinity ? TAPi18n.__('Infinity') : `${ Math.round(ping) }ms`);
		return `Ping: ${ formattedPing }`;
	},

	connectedUptime() {
		const bot = Template.instance().bot.get();
		const diff = (new Date()).getTime() - bot.lastLogin.getTime();
		return `Connected: ${ Template.instance().humanReadableTime(diff / 1000) }`;
	},

	isChanged() {
		return Template.instance().changed.get();
	},

	disabled(cursor) {
		return cursor.length === 0 ? 'disabled' : '';
	},

	rolesCursor() {
		const bot = Template.instance().bot.get();
		if (!bot.roles) {
			return [];
		}
		const roles = bot.roles;
		return RocketChat.models.Roles.find({_id: {$nin:roles}, scope: 'Users'}, { sort: { description: 1, _id: 1 } });
	},

	roleName() {
		return this.description || this._id;
	},

	canDelete() {
		return RocketChat.authz.hasAllPermission('delete-bot-account');
	}
});

Template.adminBotDetails.events({
	'blur input': (e, t) => {
		t.updateBot();
	},

	'click .resume': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('resumeBot', bot, (err) => {
			if (err) {
				return toastr.error(TAPi18n.__(err));
			}
			toastr.success(TAPi18n.__('Bot_resumed'));
		});
	},

	'click .pause': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('pauseBot', bot, (err) => {
			if (err) {
				return toastr.error(TAPi18n.__(err));
			}
			toastr.success(TAPi18n.__('Bot_paused'));
		});
	},

	'click .remove-role'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		const bot = t.bot.get();
		bot.roles = bot.roles.filter(el => el !== this.valueOf());
		t.bot.set(bot);
		$(`[title=${ this }]`).remove();
		t.updateBot();
	},

	'click #addRole'(e, t) {
		e.stopPropagation();
		e.preventDefault();
		if ($('#roleSelect').find(':selected').is(':disabled')) {
			return;
		}
		const bot = t.bot.get();
		bot.roles.push($('#roleSelect').val());
		t.bot.set(bot);
		$('#roleSelect').val('placeholder');
		t.updateBot();
	},

	'click .expand': (e) => {
		$(e.currentTarget).closest('.section').removeClass('section-collapsed');
		$(e.currentTarget).closest('button').removeClass('expand').addClass('collapse').find('span').text(TAPi18n.__('Collapse'));
		$('.CodeMirror').each((index, codeMirror) => codeMirror.CodeMirror.refresh());
	},

	'click .collapse': (e) => {
		$(e.currentTarget).closest('.section').addClass('section-collapsed');
		$(e.currentTarget).closest('button').addClass('expand').removeClass('collapse').find('span').text(TAPi18n.__('Expand'));
	},

	'click .rc-header__section-button > .save': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('insertOrUpdateBot', bot, (err) => {
			if (err) {
				return handleError(err);
			}

			toastr.success(TAPi18n.__('Details_updated'));
			t.changed.set(false);
			FlowRouter.go('admin-bots-username', { username: bot.username });
		});
	},

	'click .rc-header__section-button > .delete': (e, instance) => {
		const bot = instance.bot.get();

		modal.open({
			title: t('Are_you_sure'),
			text: t('You_will_not_be_able_to_recover'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes_delete_it'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false
		}, () => {
			Meteor.call('deleteBot', bot._id, (err) => {
				if (err) {
					return handleError(err);
				}

				modal.open({
					title: t('Deleted'),
					text: t('Your_entry_has_been_deleted'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false
				});

				FlowRouter.go('admin-bots');
			});
		});
	}
});
