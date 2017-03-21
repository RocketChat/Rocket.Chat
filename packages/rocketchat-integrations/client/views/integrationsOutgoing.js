/* global ChatIntegrations */

import hljs from 'highlight.js';
import toastr from 'toastr';

Template.integrationsOutgoing.onCreated(function _integrationsOutgoingOnCreated() {
	this.record = new ReactiveVar({
		username: 'rocket.cat',
		token: Random.id(24),
		retryFailedCalls: true,
		retryCount: 6,
		retryDelay: 'powers-of-ten'
	});

	this.updateRecord = () => {
		this.record.set({
			enabled: $('[name=enabled]:checked').val().trim() === '1',
			event: $('[name=event]').val().trim(),
			name: $('[name=name]').val().trim(),
			alias: $('[name=alias]').val().trim(),
			emoji: $('[name=emoji]').val().trim(),
			avatar: $('[name=avatar]').val().trim(),
			channel: $('[name=channel]').val()? $('[name=channel]').val().trim() : undefined,
			username: $('[name=username]').val().trim(),
			triggerWords: $('[name=triggerWords]').val() ? $('[name=triggerWords]').val().trim() : undefined,
			urls: $('[name=urls]').val().trim(),
			token: $('[name=token]').val().trim(),
			scriptEnabled: $('[name=scriptEnabled]:checked').val().trim() === '1',
			script: $('[name=script]').val().trim(),
			targetRoom: $('[name=targetRoom]').val() ? $('[name=targetRoom]').val().trim() : undefined,
			triggerWordAnywhere: $('[name=triggerWordAnywhere]').val() ? $('[name=triggerWordAnywhere]').val().trim() : undefined,
			retryFailedCalls: $('[name=retryFailedCalls]:checked').val().trim() === '1',
			retryCount: $('[name=retryCount]').val() ? $('[name=retryCount]').val().trim() : 6,
			retryDelay: $('[name=retryDelay]').val() ? $('[name=retryDelay]').val().trim() : 'powers-of-ten'
		});
	};

	this.autorun(() => {
		const id = this.data && this.data.params && this.data.params().id;

		if (id) {
			const sub = this.subscribe('integrations');
			if (sub.ready()) {
				let intRecord;

				if (RocketChat.authz.hasAllPermission('manage-integrations')) {
					intRecord = ChatIntegrations.findOne({ _id: id });
				} else if (RocketChat.authz.hasAllPermission('manage-own-integrations')) {
					intRecord = ChatIntegrations.findOne({ _id: id, '_createdBy._id': Meteor.userId() });
				}

				if (intRecord) {
					this.record.set(intRecord);
				} else {
					toastr.error(TAPi18n.__('No_integration_found'));
					FlowRouter.go('admin-integrations');
				}
			}
		}
	});
});

Template.integrationsOutgoing.helpers({
	join(arr, sep) {
		if (!arr || !arr.join) {
			return arr;
		}

		return arr.join(sep);
	},

	showHistoryButton() {
		return this.params && this.params() && typeof this.params().id !== 'undefined';
	},

	hasPermission() {
		return RocketChat.authz.hasAtLeastOnePermission(['manage-integrations', 'manage-own-integrations']);
	},

	data() {
		return Template.instance().record.get();
	},

	canDelete() {
		return this.params && this.params() && typeof this.params().id !== 'undefined';
	},

	eventTypes() {
		return Object.values(RocketChat.integrations.outgoingEvents);
	},

	hasTypeSelected() {
		const record = Template.instance().record.get();

		return typeof record.event === 'string' && record.event !== '';
	},

	shouldDisplayChannel() {
		const record = Template.instance().record.get();

		return typeof record.event === 'string' && RocketChat.integrations.outgoingEvents[record.event].use.channel;
	},

	shouldDisplayTriggerWords() {
		const record = Template.instance().record.get();

		return typeof record.event === 'string' && RocketChat.integrations.outgoingEvents[record.event].use.triggerWords;
	},

	shouldDisplayTargetRoom() {
		const record = Template.instance().record.get();

		return typeof record.event === 'string' && RocketChat.integrations.outgoingEvents[record.event].use.targetRoom;
	},

	example() {
		const record = Template.instance().record.get();

		return {
			_id: Random.id(),
			alias: record.alias,
			emoji: record.emoji,
			avatar: record.avatar,
			msg: 'Response text',
			bot: {
				i: Random.id()
			},
			groupable: false,
			attachments: [{
				title: 'Rocket.Chat',
				title_link: 'https://rocket.chat',
				text: 'Rocket.Chat, the best open source chat',
				image_url: 'https://rocket.chat/images/mockup.png',
				color: '#764FA5'
			}],
			ts: new Date(),
			u: {
				_id: Random.id(),
				username: record.username
			}
		};
	},

	exampleJson() {
		const record = Template.instance().record.get();
		const data = {
			username: record.alias,
			icon_emoji: record.emoji,
			icon_url: record.avatar,
			text: 'Response text',
			attachments: [{
				title: 'Rocket.Chat',
				title_link: 'https://rocket.chat',
				text: 'Rocket.Chat, the best open source chat',
				image_url: 'https://rocket.chat/images/mockup.png',
				color: '#764FA5'
			}]
		};

		const invalidData = [null, ''];
		Object.keys(data).forEach((key) => {
			if (invalidData.includes(data[key])) {
				delete data[key];
			}
		});

		return hljs.highlight('json', JSON.stringify(data, null, 2)).value;
	},

	editorOptions() {
		return {
			lineNumbers: true,
			mode: 'javascript',
			gutters: [
				// "CodeMirror-lint-markers",
				'CodeMirror-linenumbers',
				'CodeMirror-foldgutter'
			],
			// lint: true,
			foldGutter: true,
			// lineWrapping: true,
			matchBrackets: true,
			autoCloseBrackets: true,
			matchTags: true,
			showTrailingSpace: true,
			highlightSelectionMatches: true
		};
	}
});

Template.integrationsOutgoing.events({
	'blur input': (e, t) => {
		t.updateRecord();
	},

	'click input[type=radio]': (e, t) => {
		t.updateRecord();
	},

	'change select[name=event]': (e, t) => {
		const record = t.record.get();
		record.event = $('[name=event]').val().trim();

		t.record.set(record);
	},

	'click .button.history': () => {
		FlowRouter.go(`/admin/integrations/outgoing/${FlowRouter.getParam('id')}/history`);
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

	'click .submit > .delete': () => {
		const params = Template.instance().data.params();

		swal({
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
			Meteor.call('deleteOutgoingIntegration', params.id, (err) => {
				if (err) {
					handleError(err);
				} else {
					swal({
						title: t('Deleted'),
						text: t('Your_entry_has_been_deleted'),
						type: 'success',
						timer: 1000,
						showConfirmButton: false
					});

					FlowRouter.go('admin-integrations');
				}
			});
		});
	},

	'click .button-fullscreen': () => {
		$('.code-mirror-box').addClass('code-mirror-box-fullscreen content-background-color');
		$('.CodeMirror')[0].CodeMirror.refresh();
	},

	'click .button-restore': () => {
		$('.code-mirror-box').removeClass('code-mirror-box-fullscreen content-background-color');
		$('.CodeMirror')[0].CodeMirror.refresh();
	},

	'click .submit > .save': () => {
		const event = $('[name=event]').val().trim();
		const enabled = $('[name=enabled]:checked').val().trim();
		const name = $('[name=name]').val().trim();
		const impersonateUser = $('[name=impersonateUser]:checked').val().trim();
		const alias = $('[name=alias]').val().trim();
		const emoji = $('[name=emoji]').val().trim();
		const avatar = $('[name=avatar]').val().trim();
		const username = $('[name=username]').val().trim();
		const token = $('[name=token]').val().trim();
		const scriptEnabled = $('[name=scriptEnabled]:checked').val().trim();
		const script = $('[name=script]').val().trim();
		const retryFailedCalls = $('[name=retryFailedCalls]:checked').val().trim();
		let urls = $('[name=urls]').val().trim();

		if (username === '' && impersonateUser === '0') {
			return toastr.error(TAPi18n.__('The_username_is_required'));
		}

		urls = urls.split('\n').filter((url) => url.trim() !== '');
		if (urls.length === 0) {
			return toastr.error(TAPi18n.__('You_should_inform_one_url_at_least'));
		}

		let triggerWords, triggerWordAnywhere;
		if (RocketChat.integrations.outgoingEvents[event].use.triggerWords) {
			triggerWords = $('[name=triggerWords]').val().trim();
			triggerWords = triggerWords.split(',').filter((word) => word.trim() !== '');

			triggerWordAnywhere = $('[name=triggerWordAnywhere]').val().trim();
		}

		let channel;
		if (RocketChat.integrations.outgoingEvents[event].use.channel) {
			channel = $('[name=channel]').val().trim();

			if (!channel || channel.trim() === '') {
				return toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__('Channel') }));
			}
		}

		let targetRoom;
		if (RocketChat.integrations.outgoingEvents[event].use.targetRoom) {
			targetRoom = $('[name=targetRoom]').val().trim();

			if (!targetRoom || targetRoom.trim() === '') {
				return toastr.error(TAPi18n.__('error-the-field-is-required', { field: TAPi18n.__('TargetRoom') }));
			}
		}

		let retryCount, retryDelay;
		if (retryFailedCalls === '1') {
			retryCount = parseInt($('[name=retryCount]').val().trim());
			retryDelay: $('[name=retryDelay]').val().trim();
		}

		const integration = {
			event: event !== '' ? event : undefined,
			enabled: enabled === '1',
			username: username,
			channel: channel !== '' ? channel : undefined,
			targetRoom: targetRoom !== '' ? targetRoom : undefined,
			alias: alias !== '' ? alias : undefined,
			emoji: emoji !== '' ? emoji : undefined,
			avatar: avatar !== '' ? avatar : undefined,
			name: name !== '' ? name : undefined,
			triggerWords: triggerWords !== '' ? triggerWords : undefined,
			urls: urls !== '' ? urls : undefined,
			token: token !== '' ? token : undefined,
			script: script !== '' ? script : undefined,
			scriptEnabled: scriptEnabled === '1',
			impersonateUser: impersonateUser === '1',
			retryFailedCalls: retryFailedCalls === '1',
			retryCount: retryCount ? retryCount : 6,
			retryDelay: retryDelay ? retryDelay : 'powers-of-ten',
			triggerWordAnywhere: triggerWordAnywhere === '1'
		};

		const params = Template.instance().data.params? Template.instance().data.params() : undefined;
		if (params && params.id) {
			Meteor.call('updateOutgoingIntegration', params.id, integration, (err) => {
				if (err) {
					return handleError(err);
				}

				toastr.success(TAPi18n.__('Integration_updated'));
			});
		} else {
			Meteor.call('addOutgoingIntegration', integration, (err, data) => {
				if (err) {
					return handleError(err);
				}

				toastr.success(TAPi18n.__('Integration_added'));
				FlowRouter.go('admin-integrations-outgoing', { id: data._id });
			});
		}
	}
});
