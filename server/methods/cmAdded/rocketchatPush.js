import { restfulJpush } from 'meteor/cmftadmin:cmjpush'

const appkey = '9bdc62105f1e43d8e9991875'
const secretkey = '620ea63469dafe225cb35b07'

Meteor.methods({
  jpush(rid, isDirect) {
    console.log(`get jpush request rid: ${rid}, isDirect: ${isDirect}`)
    check(rid, String);
    check(isDirect, Boolean);

    const userId = Meteor.userId();

		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'jpush'
			});
    }
    
    this.unblock()

    const user = RocketChat.models.Users.findOneById(userId, { fields: { username: 1, name: 1 }})
    if (!user) {
      throw new Meteor.Error('error-invalid-user', 'Invalid user', { method: 'jpush' });
    }
    const room = RocketChat.models.Rooms.findOneById(rid, { fields: { fname: 1, name: 1 }})
    if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'jpush' });
    }
    
    const canAccessRoom = Meteor.call('canAccessRoom', rid, Meteor.userId());
		if (!canAccessRoom) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', { method: 'jpush' });
    }
    
    if (isDirect) {
      restfulJpush(user.name, '给您发送了一条消息', rid)
    } else {
      restfulJpush(room.fname || room.name, `${user.name}: 发送了一条消息`, rid)
    }
  }
})