import {RoomTypeConfig, RoomTypeRouteConfig} from '../../lib/RoomTypeConfig';


Meteor.methods({
	createRoomType(order, icon, header, label, name, path, creationTemplate = 'SimpleRoomCreateDialog') {
		if (!process.env.TEST_MODE) {
			throw new Meteor.Error('This method is currently only intended for testing');
		}

		const roomTypeConfig = new RoomTypeConfig({
			order,
			icon,
			header,
			label,
			roote: new RoomTypeRouteConfig(name, path)
		});

		roomTypeConfig.creationLabel = name;
		roomTypeConfig.creationTemplate = creationTemplate;
		roomTypeConfig.canBeCreated = () => true;

		return RocketChat.roomTypes.add(roomTypeConfig);
	}
});
