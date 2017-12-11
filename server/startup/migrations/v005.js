RocketChat.Migrations.add({
	version: 5,
	up() {
		console.log('Dropping test rooms with less than 2 messages');

		RocketChat.models.Rooms.find({
			msgs: {
				$lt: 2
			}
		}).forEach((room) => {
			console.log('Dropped: ', room.name);
			RocketChat.models.Rooms.removeById(room._id);
			RocketChat.models.Messages.removeByRoomId(room._id);
			return RocketChat.models.Subscriptions.removeByRoomId(room._id);
		});

		console.log('Dropping test rooms with less than 2 user');
		RocketChat.models.Rooms.find({
			usernames: {
				$size: 1
			}
		}).forEach((room) => {
			console.log('Dropped: ', room.name);
			RocketChat.models.Rooms.removeById(room._id);
			RocketChat.models.Messages.removeByRoomId(room._id);
			return RocketChat.models.Subscriptions.removeByRoomId(room._id);
		});

		console.log('Adding username to all users');
		RocketChat.models.Users.find({
			username: {
				$exists: 0
			},
			emails: {
				$exists: 1
			}
		}).forEach((user) => {
			let newUserName = user.emails[0].address.split('@')[0];
			if (RocketChat.models.Users.findOneByUsername(newUserName)) {
				newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
				if (RocketChat.models.Users.findOneByUsername(newUserName)) {
					newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
					if (RocketChat.models.Users.findOneByUsername(newUserName)) {
						newUserName = newUserName + Math.floor((Math.random() * 10) + 1);
					}
				}
			}
			console.log(`Adding: username ${ newUserName } to all user ${ user._id }`);
			return RocketChat.models.Users.setUsername(user._id, newUserName);
		});

		console.log('Fixing _id of direct messages rooms');
		RocketChat.models.Rooms.findByType('d').forEach(function(room) {
			let newId = '';
			const id0 = RocketChat.models.Users.findOneByUsername(room.usernames[0])._id;
			const id1 = RocketChat.models.Users.findOneByUsername(room.usernames[1])._id;
			const ids = [id0, id1];

			newId = ids.sort().join('');
			if (newId !== room._id) {
				console.log(`Fixing: _id ${ room._id } to ${ newId }`);
				RocketChat.models.Subscriptions.update({
					rid: room._id
				}, {
					$set: {
						rid: newId
					}
				}, {
					multi: 1
				});
				RocketChat.models.Messages.update({
					rid: room._id
				}, {
					$set: {
						rid: newId
					}
				}, {
					multi: 1
				});
				RocketChat.models.Rooms.removeById(room._id);
				room._id = newId;
				RocketChat.models.Rooms.insert(room);
			}

			RocketChat.models.Subscriptions.update({
				rid: room._id,
				'u._id': id0
			}, {
				$set: {
					name: room.usernames[1]
				}
			});

			return RocketChat.models.Subscriptions.update({
				rid: room._id,
				'u._id': id1
			}, {
				$set: {
					name: room.usernames[0]
				}
			});
		});

		console.log('Adding u.username to all documents');
		RocketChat.models.Users.find({}, {
			username: 1
		}).forEach((user) => {
			console.log(`Adding: u.username ${ user.username } to all document`);
			RocketChat.models.Rooms.update({
				'u._id': user._id
			}, {
				$set: {
					'u.username': user.username
				}
			}, {
				multi: 1
			});

			RocketChat.models.Subscriptions.update({
				'u._id': user._id
			}, {
				$set: {
					'u.username': user.username
				}
			}, {
				multi: 1
			});

			RocketChat.models.Messages.update({
				'u._id': user._id
			}, {
				$set: {
					'u.username': user.username
				}
			}, {
				multi: 1
			});

			RocketChat.models.Messages.update({
				uid: user._id
			}, {
				$set: {
					u: user
				}
			}, {
				multi: 1
			});

			RocketChat.models.Messages.update({
				by: user._id
			}, {
				$set: {
					u: user
				}
			}, {
				multi: 1
			});

			RocketChat.models.Messages.update({
				uid: {
					$exists: 1
				}
			}, {
				$unset: {
					uid: 1,
					by: 1
				}
			}, {
				multi: 1
			});
		});

		return console.log('End');
	}
});
