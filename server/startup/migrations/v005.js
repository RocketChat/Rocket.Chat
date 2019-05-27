import { Migrations } from '../../../app/migrations';
import { Rooms, Subscriptions, Messages, Users } from '../../../app/models';

Migrations.add({
	version: 5,
	up() {
		console.log('Dropping test rooms with less than 2 messages');

		Rooms.find({
			msgs: {
				$lt: 2,
			},
		}).forEach((room) => {
			console.log('Dropped: ', room.name);
			Rooms.removeById(room._id);
			Messages.removeByRoomId(room._id);
			return Subscriptions.removeByRoomId(room._id);
		});

		console.log('Dropping test rooms with less than 2 user');
		Rooms.find({
			usernames: {
				$size: 1,
			},
		}).forEach((room) => {
			console.log('Dropped: ', room.name);
			Rooms.removeById(room._id);
			Messages.removeByRoomId(room._id);
			return Subscriptions.removeByRoomId(room._id);
		});

		console.log('Adding username to all users');
		Users.find({
			username: {
				$exists: 0,
			},
			emails: {
				$exists: 1,
			},
		}).forEach((user) => {
			let newUserName = user.emails[0].address.split('@')[0];
			if (Users.findOneByUsernameIgnoringCase(newUserName)) {
				newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
				if (Users.findOneByUsernameIgnoringCase(newUserName)) {
					newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
					if (Users.findOneByUsernameIgnoringCase(newUserName)) {
						newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
					}
				}
			}
			console.log(`Adding: username ${ newUserName } to all user ${ user._id }`);
			return Users.setUsername(user._id, newUserName);
		});

		console.log('Fixing _id of direct messages rooms');
		Rooms.findByType('d').forEach(function(room) {
			let newId = '';
			const id0 = Users.findOneByUsernameIgnoringCase(room.usernames[0])._id;
			const id1 = Users.findOneByUsernameIgnoringCase(room.usernames[1])._id;
			const ids = [id0, id1];

			newId = ids.sort().join('');
			if (newId !== room._id) {
				console.log(`Fixing: _id ${ room._id } to ${ newId }`);
				Subscriptions.update({
					rid: room._id,
				}, {
					$set: {
						rid: newId,
					},
				}, {
					multi: 1,
				});
				Messages.update({
					rid: room._id,
				}, {
					$set: {
						rid: newId,
					},
				}, {
					multi: 1,
				});
				Rooms.removeById(room._id);
				room._id = newId;
				Rooms.insert(room);
			}

			Subscriptions.update({
				rid: room._id,
				'u._id': id0,
			}, {
				$set: {
					name: room.usernames[1],
				},
			});

			return Subscriptions.update({
				rid: room._id,
				'u._id': id1,
			}, {
				$set: {
					name: room.usernames[0],
				},
			});
		});

		console.log('Adding u.username to all documents');
		Users.find({}, {
			username: 1,
		}).forEach((user) => {
			console.log(`Adding: u.username ${ user.username } to all document`);
			Rooms.update({
				'u._id': user._id,
			}, {
				$set: {
					'u.username': user.username,
				},
			}, {
				multi: 1,
			});

			Subscriptions.update({
				'u._id': user._id,
			}, {
				$set: {
					'u.username': user.username,
				},
			}, {
				multi: 1,
			});

			Messages.update({
				'u._id': user._id,
			}, {
				$set: {
					'u.username': user.username,
				},
			}, {
				multi: 1,
			});

			Messages.update({
				uid: user._id,
			}, {
				$set: {
					u: user,
				},
			}, {
				multi: 1,
			});

			Messages.update({
				by: user._id,
			}, {
				$set: {
					u: user,
				},
			}, {
				multi: 1,
			});

			Messages.update({
				uid: {
					$exists: 1,
				},
			}, {
				$unset: {
					uid: 1,
					by: 1,
				},
			}, {
				multi: 1,
			});
		});

		return console.log('End');
	},
});
