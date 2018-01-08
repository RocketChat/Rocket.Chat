RocketChat.userStatus = {
	packages: {
		base: {
			render(html) {
				return html;
			}
		}
	},

	list: {
		'online': {
			name: 'Online',
			localizeName: true,
			id: 'online',
			statusType: 'online'
		},
		'away' : {
			name: 'Away',
			localizeName: true,
			id: 'away',
			statusType: 'away'
		},
		'busy' : {
			name: 'Busy',
			localizeName: true,
			id: 'busy',
			statusType: 'busy'
		},
		'invisible': {
			name: 'Invisible',
			localizeName: true,
			id: 'offline',
			statusType: 'offline'
		}
	}
};
