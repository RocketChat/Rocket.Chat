Meteor.methods({
	'livechat:saveOfficeHours'(day, start, finish, open) {
		// for each (d in days) {
		// 	RocketChat.models.LivechatOfficeHour.updateHours(d.day, d.start, d.finish);
		// }
		// console.log(day + " " + start + " " + finish + " " + open); 
        RocketChat.models.LivechatOfficeHour.updateHours(day, start, finish, open);
	}
});