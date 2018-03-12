export default {
  PASS: function (parsedMessage) {
    this.log('Received PASS command, continue registering...')

    this.registerSteps.push('PASS')
  },

  SERVER: function (parsedMessage) {
    this.log('Received SERVER command, waiting for first PING...')

    this.serverPrefix = parsedMessage.prefix

    this.registerSteps.push('SERVER')
  },

  PING: function (parsedMessage) {
    if (!this.isRegistered && this.registerSteps.length === 2) {
      this.log('Received first PING command, server is registered!')

      this.isRegistered = true

      this.emit('registered')
    }

    this.write({
      prefix: this.config.server.name,
      command: 'PONG',
      parameters: [ this.config.server.name ]
    })
  },

  NICK: function (parsedMessage) {
    let command

    // Check if the message comes from the server,
    // which means it is a new user
    if (parsedMessage.prefix === this.serverPrefix) {
      command = {
        identifier: 'userRegistered',
        args: {
          nick: parsedMessage.args[0],
          username: parsedMessage.args[2].substring(1),
          host: parsedMessage.args[3],
          name: parsedMessage.args[6],
        }
      }
    } else { // Otherwise, it is a nick change
      command = {
        identifier: 'nickChanged',
        args: {
          nick: parsedMessage.nick,
          newNick: parsedMessage.args[0],
        }
      }
    }

    return command
  },

  JOIN: function (parsedMessage) {
    const command = {
      identifier: 'joinedChannel',
      args: {
        roomName: parsedMessage.args[0].substring(1),
        nick: parsedMessage.prefix
      }
    }

    return command
  },

  PART: function (parsedMessage) {
    let command = {
      identifier: 'leftChannel',
      args: {
        roomName: parsedMessage.args[0].substring(1),
        nick: parsedMessage.prefix
      }
    }

    return command
  },

  PRIVMSG: function (parsedMessage) {
    let command = {
      identifier: 'sentMessage',
      args: {
        nick: parsedMessage.prefix,
        message: parsedMessage.args[1]
      }
    }

    if (parsedMessage.args[0][0] === '#') {
      command.args.roomName = parsedMessage.args[0].substring(1)
    } else {
      command.args.recipientNick = parsedMessage.args[0]
    }

    return command
  },

  QUIT: function (parsedMessage) {
    let command = {
      identifier: 'disconnected',
      args: {
        nick: parsedMessage.prefix
      }
    }

    return command
  }
}
