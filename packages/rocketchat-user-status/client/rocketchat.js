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
      id: 'online',
      statusType: 'online'
    },
    'away' : {
      name: 'Away',
      id: 'away',
      statusType: 'away'
    },
    'busy' : {
      name: 'Busy',
      id: 'busy',
      statusType: 'busy'
    },
    'invisible': {
      name: 'Invisible',
      id: 'offline',
      statusType: 'ofline'
    }
  }
};
