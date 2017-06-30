RocketChat.Migrations.add({
	version: 4,
	up() {
		RocketChat.models.Messages.tryDropIndex('rid_1');
		RocketChat.models.Subscriptions.tryDropIndex('u._id_1');

		console.log('Rename rn to name');

		RocketChat.models.Subscriptions.update({
			rn: {
				$exists: true
			}
		}, {
			$rename: {
				rn: 'name'
			}
		}, {
			multi: true
		});

		console.log('Adding names to rooms without name');

		RocketChat.models.Rooms.find({
			name: ''
		}).forEach((item) => {
			const name = Random.id().toLowerCase();

			RocketChat.models.Rooms.setNameById(item._id, name);

			return RocketChat.models.Subscriptions.update({
				rid: item._id
			}, {
				$set: {
					name
				}
			}, {
				multi: true
			});
		});

		console.log('Making room names unique');

		RocketChat.models.Rooms.find().forEach(function(room) {

			return RocketChat.models.Rooms.find({
				name: room.name,
				_id: {
					$ne: room._id
				}
			}).forEach((item) => {
				const name = `${ room.name }-${ Random.id(2).toLowerCase() }`;

				RocketChat.models.Rooms.setNameById(item._id, name);

				return RocketChat.models.Subscriptions.update({
					rid: item._id
				}, {
					$set: {
						name
					}
				}, {
					multi: true
				});
			});
		});

		return console.log('End');
	}
});
