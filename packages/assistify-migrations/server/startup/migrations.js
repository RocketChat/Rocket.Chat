/*
Up to now, there's no "DB version" stored for assistify.
Until we've got expensive of contradicting migrations, we'll just use this file to write functions running
on startup which migrate data - ignoring the actual version
 */

Meteor.startup(() => {
	const topics = RocketChat.models.Rooms.findByType('e').fetch();
	let counterRequests = 0;
	// Update room type and parent room id for request

	const mapRoomParentRoom = new Map();
	RocketChat.models.Rooms.findByType('r').forEach((request) => {
		const update = {};
		update.$set = {};
		let parentTopic = null;

		if (request.expertise) {
			parentTopic = topics.find((topic) => request.expertise === topic.name);
			if (!parentTopic) {
				console.log('couldn\'t find topic', request.expertise, '- ignoring');
			} else {
				update.$set.parentRoomId = parentTopic._id;
				mapRoomParentRoom.set(request._id, parentTopic._id); // buffer the mapping for the subscriptions update lateron
			}
		}
		update.$set.oldType = request.t;
		update.$set.t = 'p';
		// update requests
		RocketChat.models.Rooms.update({ _id: request._id }, update);
		counterRequests++;
	});
	console.log('Migrated', counterRequests, 'requests to private groups');

	// Update room type and parent room id for expertises
	RocketChat.models.Rooms.update({
		t: 'e',
	}, {
		$set: {
			oldType: 'e', // move the room type as old room type
			t: 'c', // set new room type to public channel
		},
	}, {
		multi: true,
	});

	// update subscriptions for requests
	RocketChat.models.Subscriptions.update({
		t: 'r',
	}, {
		$set: {
			oldType: 'r',
			t: 'p',
		},
	}, {
		multi: true,
	});

	// provide parent Room links in the subscriptions as well
	mapRoomParentRoom.forEach((value, key) => {
		RocketChat.models.Subscriptions.update({
			rid: key,
		}, {
			$set: {
				parentRoomId: value,
			},
		}, {
			multi: true,
		});
	});

	// update subscriptions for expertises
	RocketChat.models.Subscriptions.update({
		t: 'e',
	}, {
		$set: {
			oldType: 'e',
			t: 'c',
		},
	}, {
		multi: true,
	});

});
