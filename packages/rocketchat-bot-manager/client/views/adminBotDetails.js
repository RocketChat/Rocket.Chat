import toastr from 'toastr';

Template.adminBotDetails.onCreated(function _adminBotDetailsOnCreated() {
	this.bot = new ReactiveVar({});
	this.now = new ReactiveVar(new Date());
	this.statistics = new ReactiveVar({});
	this.changed = new ReactiveVar(false);
	this.ping = new ReactiveVar(undefined);

	this.updateBot = () => {
		if (!RocketChat.authz.hasAllPermission('edit-bot-account')) {
			return;
		}

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

				if (RocketChat.authz.hasAllPermission('view-full-bot-account')) {
					bot = Meteor.users.findOne({ username });
				}

				if (bot) {
					this.bot.set(bot);
				} else {
					toastr.error(TAPi18n.__('Bot_not_found'));
					FlowRouter.go('admin-bots');
				}
			}

			Meteor.call('getBotStatistics', username, (err, statistics) => {
				this.statistics.set(statistics);
			});
		}
	});

	this.isOnline = () => {
		const bot = this.bot.get();
		if (bot.statusConnection && bot.statusConnection !== 'offline') {
			return true;
		}
		return false;
	};

	// check  bot aliveness each 1500ms
	this.autorun(() => {
		let finished = true;
		this.interval = Meteor.setInterval(() => {
			this.now.set(new Date());
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
		}, 1000);
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
		return RocketChat.authz.hasAllPermission('view-full-bot-account');
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
		const isOnline = Template.instance().isOnline();
		if (isOnline && bot.customClientData && bot.customClientData.framework) {
			return bot.customClientData.framework;
		}
		return 'Undefined';
	},

	getRoles() {
		const bot = Template.instance().bot.get();
		return bot.roles;
	},

	canPause() {
		const bot = Template.instance().bot.get();
		const isOnline = Template.instance().isOnline();
		return isOnline && bot.customClientData && bot.customClientData.canPauseResumeMsgStream;
	},

	isPaused() {
		const bot = Template.instance().bot.get();
		const isOnline = Template.instance().isOnline();
		if (isOnline && bot.customClientData) {
			return bot.customClientData.pausedMsgStream;
		}
	},

	isOnline() {
		return Template.instance().isOnline();
	},

	ipAddress() {
		const bot = Template.instance().bot.get();
		const isOnline = Template.instance().isOnline();
		if (isOnline && bot.customClientData) {
			return bot.customClientData.ipAddress;
		}
	},

	canPing() {
		const bot = Template.instance().bot.get();
		const isOnline = Template.instance().isOnline();
		return isOnline && bot.customClientData && bot.customClientData.canListenToHeartbeat;
	},

	ping() {
		const ping = Template.instance().ping.get();
		return (ping === Infinity ? TAPi18n.__('Infinity') : `${ Math.round(ping) }ms`);
	},

	connectedUptime() {
		const bot = Template.instance().bot.get();
		const now = Template.instance().now.get();
		const diff = now.getTime() - bot.lastLogin.getTime();
		return Template.instance().humanReadableTime(diff / 1000);
	},

	activeUptime() {
		const bot = Template.instance().bot.get();
		const now = Template.instance().now.get();
		const isOnline = Template.instance().isOnline();
		let diff = now.getTime() - bot.lastLogin.getTime();

		if (isOnline && bot.customClientData.pausedMsgStream) {
			return TAPi18n.__('Paused');
		}

		if (isOnline && bot.customClientData.msgStreamLastActive) {
			// Use min in case the bot relogs in but does not reset stream last active
			diff = Math.min(diff, now.getTime() - bot.customClientData.msgStreamLastActive.getTime());
		}
		return Template.instance().humanReadableTime(diff / 1000);
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

	statistics() {
		return Template.instance().statistics.get();
	},

	canDelete() {
		return RocketChat.authz.hasAllPermission('delete-bot-account');
	},

	canChange() {
		return RocketChat.authz.hasAllPermission('edit-bot-account');
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
				return toastr.error(TAPi18n.__('Bot_resumed_error'));
			}
			toastr.success(TAPi18n.__('Bot_resumed'));
		});
	},

	'click .pause': (e, t) => {
		const bot = t.bot.get();
		Meteor.call('pauseBot', bot, (err) => {
			if (err) {
				return toastr.error(TAPi18n.__('Bot_paused_error'));
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

		if (!RocketChat.authz.hasAllPermission('edit-bot-account')) {
			const error = new Meteor.Error('error-action-not-allowed', 'Editing bot is not allowed');
			return handleError(error);
		}

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

		if (!RocketChat.authz.hasAllPermission('delete-bot-account')) {
			const error = new Meteor.Error('error-action-not-allowed', 'Deleting bot is not allowed');
			return handleError(error);
		}

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
	},

	'click .rc-header__section-button > .change': (e, instance) => {
		const bot = instance.bot.get();

		if (!RocketChat.authz.hasAllPermission('edit-bot-account')) {
			const error = new Meteor.Error('error-action-not-allowed', 'Changing bot type is not allowed');
			return handleError(error);
		}

		const warningModal = (email) => {
			modal.open({
				title: t('Are_you_sure'),
				text: t('The_bot_will_become_a_user_and_its_roles_will_be_reset'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes_convert_it'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: false,
				html: false
			}, () => {
				Meteor.call('turnBotIntoUser', bot._id, email, (err) => {
					if (err) {
						return handleError(err);
					}

					modal.open({
						title: t('Converted'),
						text: t('Bot_is_now_a_user'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false
					});

					FlowRouter.go('admin-bots');
				});
			});
		};
		if (!bot.emails) {
			modal.open({
				title: t('Insert_email'),
				text: t('All_accounts_must_have_an_email'),
				type: 'input',
				showCancelButton: true,
				closeOnConfirm: false,
				inputPlaceholder: 'example@rocket.chat'
			}, (email) => warningModal(email));
		} else {
			warningModal();
		}
	}
});
