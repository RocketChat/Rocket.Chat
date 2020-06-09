import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import toastr from 'toastr';
import moment from 'moment';

import { t, handleError, APIClient } from '../../../../utils/client';
import './livechatBusinessHours.html';

Template.livechatBusinessHours.helpers({
	days() {
		return Template.instance().businessHour.get().workHours;
	},
	startName(day) {
		return `${ day.day }_start`;
	},
	finishName(day) {
		return `${ day.day }_finish`;
	},
	openName(day) {
		return `${ day.day }_open`;
	},
	start(day) {
		return Template.instance().dayVars[day.day].start.get();
	},
	finish(day) {
		return Template.instance().dayVars[day.day].finish.get();
	},
	name(day) {
		return TAPi18n.__(day.day);
	},
	open(day) {
		return Template.instance().dayVars[day.day].open.get();
	},
});

const splitDayAndPeriod = (value) => value.split('_');

Template.livechatBusinessHours.events({
	'change .preview-settings, keydown .preview-settings'(e, instance) {
		const [day, period] = splitDayAndPeriod(e.currentTarget.name);

		const newTime = moment(e.currentTarget.value, 'HH:mm');

		// check if start and stop do not cross
		if (period === 'start') {
			if (newTime.isSameOrBefore(moment(instance.dayVars[day].finish.get(), 'HH:mm'))) {
				instance.dayVars[day].start.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[day].start.get();
			}
		} else if (period === 'finish') {
			if (newTime.isSameOrAfter(moment(instance.dayVars[day].start.get(), 'HH:mm'))) {
				instance.dayVars[day].finish.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[day].finish.get();
			}
		}
	},
	'change .dayOpenCheck input'(e, instance) {
		const [day, period] = splitDayAndPeriod(e.currentTarget.name);
		instance.dayVars[day][period].set(e.target.checked);
	},
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let { value } = e.currentTarget;
		if (e.currentTarget.type === 'radio') {
			value = value === 'true';
			instance[e.currentTarget.name].set(value);
		}
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		// convert all times to utc then update them in db
		const days = [];
		for (const d in instance.dayVars) {
			if (instance.dayVars.hasOwnProperty(d)) {
				const day = instance.dayVars[d];
				const start = moment(day.start.get(), 'HH:mm').format('HH:mm');
				const finish = moment(day.finish.get(), 'HH:mm').format('HH:mm');
				days.push({
					day: d,
					start,
					finish,
					open: day.open.get(),
				});
			}
		}
		Meteor.call('livechat:saveBusinessHour', {
			...instance.businessHour.get(),
			workHours: days,
		}, function(err /* ,result*/) {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Business_hours_updated'));
		});
	},
});

Template.livechatBusinessHours.onCreated(async function() {
	this.dayVars = {
		Monday: {
			start: new ReactiveVar('08:00'),
			finish: new ReactiveVar('20:00'),
			open: new ReactiveVar(true),
		},
		Tuesday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true),
		},
		Wednesday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true),
		},
		Thursday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true),
		},
		Friday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true),
		},
		Saturday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(false),
		},
		Sunday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(false),
		},
	};
	this.businessHour = new ReactiveVar({});

	const { businessHour } = await APIClient.v1.get('livechat/business-hour');
	this.businessHour.set(businessHour);
	businessHour.workHours.forEach((d) => {
		if (businessHour.timezone.name) {
			this.dayVars[d.day].start.set(moment.utc(d.start, 'HH:mm').tz(businessHour.timezone.name).format('HH:mm'));
			this.dayVars[d.day].finish.set(moment.utc(d.finish, 'HH:mm').tz(businessHour.timezone.name).format('HH:mm'));
		} else {
			this.dayVars[d.day].start.set(moment.utc(d.start, 'HH:mm').local().format('HH:mm'));
			this.dayVars[d.day].finish.set(moment.utc(d.finish, 'HH:mm').local().format('HH:mm'));
		}
		this.dayVars[d.day].open.set(d.open);
	});
});
