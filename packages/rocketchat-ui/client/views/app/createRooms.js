const roomTypesBeforeStandard = function() {
	const orderLow = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'c')[0].order;
	return RocketChat.roomTypes.roomTypesOrder.filter(
		(roomTypeOrder) => roomTypeOrder.order < orderLow
	).map(
		(roomTypeOrder) => {
			return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
		}
	).filter((roomType) => roomType.creationTemplate && roomType.canBeCreated());
};

const roomTypesAfterStandard = function() {
	const orderHigh = RocketChat.roomTypes.roomTypesOrder.filter((roomTypeOrder) => roomTypeOrder.identifier === 'd')[0].order;
	return RocketChat.roomTypes.roomTypesOrder.filter(
		(roomTypeOrder) => roomTypeOrder.order > orderHigh
	).map(
		(roomTypeOrder) => {
			return RocketChat.roomTypes.roomTypes[roomTypeOrder.identifier];
		}
	).filter((roomType) => roomType.creationTemplate && roomType.canBeCreated());
};

const allTemplatesOrdered = function() {
	return roomTypesBeforeStandard()
		.concat([{
			creationLabel: 'Create_A_New_Channel',
			creationTemplate: 'createChannel'
		}])
		.concat(roomTypesAfterStandard())
		.map((roomtype) => {
			return {
				label: roomtype.creationLabel,
				template: roomtype.creationTemplate
			};
		});
};

Template.createRooms.helpers({
	tabsNeeded() {
		const instance = Template.instance();
		return !!(instance.data.roomTypesBeforeStandard.length || instance.data.roomTypesAfterStandard.length);
	}
});

Template.createRooms.onCreated(function() {
	this.data.roomTypesBeforeStandard = roomTypesBeforeStandard();
	this.data.roomTypesAfterStandard = roomTypesAfterStandard();
	this.data.tabs = allTemplatesOrdered();
});
