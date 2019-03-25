import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { modal } from '/app/ui-utils';
import { t, handleError } from '/app/utils';
import _ from 'underscore';
import moment from 'moment';

const LivechatRoom = new Mongo.Collection('livechatRoom');

Template.livechatCurrentChats.helpers({
	livechatRoom() {
		return LivechatRoom.find({ t: 'l' }, { sort: { ts: -1 } });
	},
	startedAt() {
		return moment(this.ts).format('L LTS');
	},
	lastMessage() {
		return moment(this.lm).format('L LTS');
	},
	servedBy() {
		return this.servedBy && this.servedBy.username;
	},
	status() {
		return this.open ? t('Opened') : t('Closed');
	},
	isClosed() {
		return !this.open;
	},
	agentAutocompleteSettings() {
		return {
			limit: 10,
			inputDelay: 300,
			rules: [{
				collection: 'UserAndRoom',
				subscription: 'userAutocomplete',
				field: 'username',
				template: Template.userSearch,
				noMatchTemplate: Template.userSearchEmpty,
				matchAll: true,
				selector(match) {
					return { term: match };
				},
				sort: 'username',
			}],
		};
	},
});

Template.livechatCurrentChats.events({
	'click .row-link'() {
		FlowRouter.go('live', { id: this._id });
	},
	'click .load-more'(event, instance) {
		instance.limit.set(instance.limit.get() + 20);
	},
	'submit form'(event, instance) {
		event.preventDefault();

		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (this.name) {
				filter[this.name] = $(this).val();
			}
		});

		if (!_.isEmpty(filter.from)) {
			filter.from = moment(filter.from, moment.localeData().longDateFormat('L')).toDate();
		} else {
			delete filter.from;
		}

		if (!_.isEmpty(filter.to)) {
			filter.to = moment(filter.to, moment.localeData().longDateFormat('L')).toDate();
		} else {
			delete filter.to;
		}

		if (!_.isEmpty(instance.selectedAgent.get())) {
			filter.agent = instance.selectedAgent.get();
		}

		instance.filter.set(filter);
		instance.limit.set(20);
	},
	'click .remove-livechat-room'(event) {
		event.preventDefault();
		event.stopPropagation();

		modal.open({
			title: t('Are_you_sure'),
			type: 'warning',
			showCancelButton: true,
			confirmButtonColor: '#DD6B55',
			confirmButtonText: t('Yes'),
			cancelButtonText: t('Cancel'),
			closeOnConfirm: false,
			html: false,
		}, () => {
			Meteor.call('livechat:removeRoom', this._id, function(error/* , result*/) {
				if (error) {
					return handleError(error);
				}
				modal.open({
					title: t('Deleted'),
					text: t('Room_has_been_deleted'),
					type: 'success',
					timer: 1000,
					showConfirmButton: false,
				});
			});
		});
	},
	'autocompleteselect input[id=agent]'(event, template, agent) {
		template.selectedAgent.set(agent._id);
	},

	'input [id=agent]'(event, template) {
		const input = event.currentTarget;
		if (input.value === '') {
			template.selectedAgent.set();
		}
	},
});

Template.livechatCurrentChats.onCreated(function() {
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.selectedAgent = new ReactiveVar;
	this.autorun(() => {
		this.subscribe('livechat:rooms', this.filter.get(), 0, this.limit.get());
	});
});

Template.livechatCurrentChats.onRendered(function() {
	this.$('.input-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase(),
	});
});
