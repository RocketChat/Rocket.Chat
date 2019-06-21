export const userStatus = {
	packages: {
		base: {
			render(html) {
				return html;
			},
		},
	},

	list: {
		online: {
			name: 'online',
			localizeName: true,
			id: 'online',
			statusType: 'online',
		},
		away: {
			name: 'away',
			localizeName: true,
			id: 'away',
			statusType: 'away',
		},
		busy: {
			name: 'busy',
			localizeName: true,
			id: 'busy',
			statusType: 'busy',
		},
		invisible: {
			name: 'invisible',
			localizeName: true,
			id: 'offline',
			statusType: 'offline',
		},
	},
};
