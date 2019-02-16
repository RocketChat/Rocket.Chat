import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Template } from 'meteor/templating';
import { modal } from 'meteor/rocketchat:ui-utils';
import { t, handleError } from 'meteor/rocketchat:utils';
import { AgentUsers } from '../../collections/AgentUsers';
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
	agents() {
		return AgentUsers.find({}, { sort: { name: 1 } });
	},
	isClosed() {
		return !this.open;
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
});

Template.livechatCurrentChats.onCreated(function() {
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});

	this.subscribe('livechat:agents');

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
