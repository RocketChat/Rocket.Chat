Meteor.methods({
if(typeof room === 'string'){
	setLastVisitedRoom(this.userId, room) {
		Meteor.users.update(this.userId, { $set: { lastVisitedRoom: room } });
    	return true;
	}
 } 
});
