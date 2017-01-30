RocketChat.integrations = {
	outgoingEvents: {
		sendMessage: {
			label: 'Integrations_Outgoing_Type_SendMessage',
			value: 'sendMessage',
			use: {
				channel: true,
				triggerWords: true,
				targetRoom: false
			}
		},
		roomCreated: {
			label: 'Integrations_Outgoing_Type_RoomCreated',
			value: 'roomCreated',
			use: {
				channel: false,
				triggerWords: false,
				targetRoom: false
			}
		},
		userCreated: {
			label: 'Integrations_Outgoing_Type_UserCreated',
			value: 'userCreated',
			use: {
				channel: false,
				triggerWords: false,
				targetRoom: true
			}
		}
	}
};
