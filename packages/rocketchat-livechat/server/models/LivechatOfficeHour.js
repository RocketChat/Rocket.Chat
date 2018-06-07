import moment from 'moment';

class LivechatOfficeHour extends RocketChat.models._Base {
	constructor() {
		super('livechat_office_hour');

		this.tryEnsureIndex({ 'day': 1 }); // the day of the week monday - sunday
		this.tryEnsureIndex({ 'start': 1 }); // the opening hours of the office
		this.tryEnsureIndex({ 'finish': 1 }); // the closing hours of the office
		this.tryEnsureIndex({ 'open': 1 }); // whether or not the offices are open on this day

		// if there is nothing in the collection, add defaults
		if (this.find().count() === 0) {
			this.insert({'day' : 'Monday', 'start' : '08:00', 'finish' : '20:00', 'code' : 1, 'open' : true });
			this.insert({'day' : 'Tuesday', 'start' : '08:00', 'finish' : '20:00', 'code' : 2, 'open' : true });
			this.insert({'day' : 'Wednesday', 'start' : '08:00', 'finish' : '20:00', 'code' : 3, 'open' : true });
			this.insert({'day' : 'Thursday', 'start' : '08:00', 'finish' : '20:00', 'code' : 4, 'open' : true });
			this.insert({'day' : 'Friday', 'start' : '08:00', 'finish' : '20:00', 'code' : 5, 'open' : true });
			this.insert({'day' : 'Saturday', 'start' : '08:00', 'finish' : '20:00', 'code' : 6, 'open' : false });
			this.insert({'day' : 'Sunday', 'start' : '08:00', 'finish' : '20:00', 'code' : 0, 'open' : false });
		}
	}

	/*
	 * update the given days start and finish times and whether the office is open on that day
	 */
	updateHours(day, newStart, newFinish, newOpen) {
		this.update({
			day
		}, {
			$set: {
				start: newStart,
				finish: newFinish,
				open: newOpen
			}
		});
	}

	/*
	 * Check if the current server time (utc) is within the office hours of that day
	 * returns true or false
	 */
	isNowWithinHours() {
		// get current time on server in utc
		// var ct = moment().utc();
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');

		// get todays office hours from db
		const todaysOfficeHours = this.findOne({day: currentTime.format('dddd')});
		if (!todaysOfficeHours) {
			return false;
		}

		// check if offices are open today
		if (todaysOfficeHours.open === false) {
			return false;
		}

		const start = moment.utc(`${ todaysOfficeHours.day }:${ todaysOfficeHours.start }`, 'dddd:HH:mm');
		const finish = moment.utc(`${ todaysOfficeHours.day }:${ todaysOfficeHours.finish }`, 'dddd:HH:mm');

		// console.log(finish.isBefore(start));
		if (finish.isBefore(start)) {
			// finish.day(finish.day()+1);
			finish.add(1, 'days');
		}

		const result = currentTime.isBetween(start, finish);

		// inBetween  check
		return result;
	}

	isOpeningTime() {
		// get current time on server in utc
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');

		// get todays office hours from db
		const todaysOfficeHours = this.findOne({day: currentTime.format('dddd')});
		if (!todaysOfficeHours) {
			return false;
		}

		// check if offices are open today
		if (todaysOfficeHours.open === false) {
			return false;
		}

		const start = moment.utc(`${ todaysOfficeHours.day }:${ todaysOfficeHours.start }`, 'dddd:HH:mm');

		return start.isSame(currentTime, 'minute');
	}

	isClosingTime() {
		// get current time on server in utc
		const currentTime = moment.utc(moment().utc().format('dddd:HH:mm'), 'dddd:HH:mm');

		// get todays office hours from db
		const todaysOfficeHours = this.findOne({day: currentTime.format('dddd')});
		if (!todaysOfficeHours) {
			return false;
		}

		const finish = moment.utc(`${ todaysOfficeHours.day }:${ todaysOfficeHours.finish }`, 'dddd:HH:mm');

		return finish.isSame(currentTime, 'minute');
	}
}

RocketChat.models.LivechatOfficeHour = new LivechatOfficeHour();
