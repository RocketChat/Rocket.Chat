RocketChat.integrations = {
	outgoingEvents: {
		sendMessage: {
			label: 'Integrations_Outgoing_Type_SendMessage',
			value: 'sendMessage',
			use: {
				channel: true,
				triggerWords: true
			}
		},
		roomCreated: {
			label: 'Integrations_Outgoing_Type_RoomCreated',
			value: 'roomCreated',
			use: {
				channel: false,
				triggerWords: false
			}
		}
	}
};
