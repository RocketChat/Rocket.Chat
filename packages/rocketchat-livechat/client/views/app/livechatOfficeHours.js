import toastr from 'toastr';
/* globals LivechatOfficeHour */
import moment from 'moment';

Template.livechatOfficeHours.helpers({
	days() {
		return LivechatOfficeHour.find({}, { sort: { code: 1 } });
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
	enableOfficeHoursTrueChecked() {
		if (Template.instance().enableOfficeHours.get()) {
			return 'checked';
		}
	},
	enableOfficeHoursFalseChecked() {
		if (!Template.instance().enableOfficeHours.get()) {
			return 'checked';
		}
	}
});

Template.livechatOfficeHours.events({
	'change .preview-settings, keydown .preview-settings'(e, instance) {
		const temp = e.currentTarget.name.split('_');

		const newTime = moment(e.currentTarget.value, 'HH:mm');

		// check if start and stop do not cross
		if (temp[1] === 'start') {
			if (newTime.isSameOrBefore(moment(instance.dayVars[temp[0]].finish.get(), 'HH:mm'))) {
				instance.dayVars[temp[0]].start.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[temp[0]].start.get();
			}
		} else if (temp[1] === 'finish') {
			if (newTime.isSameOrAfter(moment(instance.dayVars[temp[0]].start.get(), 'HH:mm'))) {
				instance.dayVars[temp[0]].finish.set(e.currentTarget.value);
			} else {
				e.currentTarget.value = instance.dayVars[temp[0]].finish.get();
			}
		}
	},
	'change .dayOpenCheck input'(e, instance) {
		const temp = e.currentTarget.name.split('_');
		instance.dayVars[temp[0]][temp[1]].set(e.target.checked);
	},
	'change .preview-settings, keyup .preview-settings'(e, instance) {
		let value = e.currentTarget.value;
		if (e.currentTarget.type === 'radio') {
			value = value === 'true';
			instance[e.currentTarget.name].set(value);
		}
	},
	'submit .rocket-form'(e, instance) {
		e.preventDefault();

		// convert all times to utc then update them in db
		for (const d in instance.dayVars) {
			if (instance.dayVars.hasOwnProperty(d)) {
				const day = instance.dayVars[d];
				const start_utc = moment(day.start.get(), 'HH:mm').utc().format('HH:mm');
				const finish_utc = moment(day.finish.get(), 'HH:mm').utc().format('HH:mm');

				Meteor.call('livechat:saveOfficeHours', d, start_utc, finish_utc, day.open.get(), function(err /*,result*/) {
					if (err) {
						return handleError(err);
					}
				});
			}
		}

		RocketChat.settings.set('Livechat_enable_office_hours', instance.enableOfficeHours.get(), (err/*, success*/) => {
			if (err) {
				return handleError(err);
			}
			toastr.success(t('Office_hours_updated'));
		});
	}
});

Template.livechatOfficeHours.onCreated(function() {
	this.dayVars = {
		Monday: {
			start: new ReactiveVar('08:00'),
			finish: new ReactiveVar('20:00'),
			open: new ReactiveVar(true)
		},
		Tuesday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true)
		},
		Wednesday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true)
		},
		Thursday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true)
		},
		Friday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(true)
		},
		Saturday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(false)
		},
		Sunday: {
			start: new ReactiveVar('00:00'),
			finish: new ReactiveVar('00:00'),
			open: new ReactiveVar(false)
		}
	};

	this.autorun(() => {
		this.subscribe('livechat:officeHour');

		if (this.subscriptionsReady()) {
			LivechatOfficeHour.find().forEach(function(d) {
				Template.instance().dayVars[d.day].start.set(moment.utc(d.start, 'HH:mm').local().format('HH:mm'));
				Template.instance().dayVars[d.day].finish.set(moment.utc(d.finish, 'HH:mm').local().format('HH:mm'));
				Template.instance().dayVars[d.day].open.set(d.open);
			});
		}
	});

	this.enableOfficeHours = new ReactiveVar(null);

	this.autorun(() => {
		this.enableOfficeHours.set(RocketChat.settings.get('Livechat_enable_office_hours'));
	});
});
