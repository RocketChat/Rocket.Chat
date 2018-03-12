import _ from 'underscore'
import net from 'net'
import util from 'util'
import { EventEmitter } from 'events'

import parseMessage from './parseMessage'

import peerCommandHandlers from './peerCommandHandlers'
import localCommandHandlers from './localCommandHandlers'

class RFC2813 {
  constructor(config) {
    this.config = config

    // Hold registered state
    this.registerSteps = []
    this.isRegistered = false

    // Hold peer server information
    this.serverPrefix = null

    // Hold the buffer while receiving
    this.receiveBuffer = new Buffer('')

    // Setup socket
    this.socket = new net.Socket()
    this.socket.setNoDelay()
    this.socket.setEncoding('utf-8')
    this.socket.setKeepAlive(true)
    this.socket.setTimeout(90000)

    this.socket.on('data', this.onReceiveFromPeer.bind(this))
    // this.socket.on('close', this.onClose)
    // this.socket.on('timeout', this.onTimeout)
    // this.socket.on('error', this.onError)

    this.socket.on('connect', this.onConnect.bind(this))
    this.socket.on('error', (err) => console.log(`[irc][server][err]`, err))

    // Setup local
    this.on('onReceiveFromLocal', this.onReceiveFromLocal.bind(this))
  }

  /**
   * Log helper
   */
  log(message) {
    console.log(`[irc][server] ${message}`)
  }

  /**
   * Connect
   */
  register() {
    this.log(`Connecting to @${this.config.server.host}:${this.config.server.port}`)

    this.socket.connect(this.config.server.port, this.config.server.host)
  }

  /**
   * Setup the server connection
   */
  onConnect() {
    this.log('Connected! Registering as server...')

    this.write({
      command: 'PASS',
      parameters: [ this.config.passwords.local, '0210', 'ngircd' ]
    })

    this.write({
      command: 'SERVER', parameters: [ this.config.server.name ],
      trailer: this.config.server.description
    })
  }

  /**
   * Sends a command message through the socket
   */
  write(command) {
    let buffer = command.prefix ? `:${command.prefix} ` : ''
    buffer += command.command

    if (command.parameters && command.parameters.length > 0) {
      buffer += ` ${command.parameters.join(' ')}`
    }

    if (command.trailer) {
      buffer += ` :${command.trailer}`
    }

    this.log(`Sending Command: ${buffer}`)

    return this.socket.write(`${buffer}\r\n`)
  }

  /**
   *
   *
   * Peer message handling
   *
   *
   */
  onReceiveFromPeer(chunk) {
    if (typeof (chunk) === 'string') {
      this.receiveBuffer += chunk
    } else {
      this.receiveBuffer = Buffer.concat([this.receiveBuffer, chunk])
    }

    var lines = this.receiveBuffer.toString().split(new RegExp('\r\n|\r|\n'))

    // If the buffer does not end with \r\n, more chunks are coming
    if (lines.pop()) return

    // Reset the buffer
    this.receiveBuffer = new Buffer('')

    lines.forEach((line) => {
      if (line.length) {
        var parsedMessage = parseMessage(line)

        if (peerCommandHandlers[parsedMessage.command]) {
          this.log(`Handling peer message: ${line}`)

          const command = peerCommandHandlers[parsedMessage.command].call(this, parsedMessage)

          if (command) {
            this.log(`Emitting peer command to local: ${JSON.stringify(command)}`)

            this.emit('peerCommand', command)
          }

        } else {
          this.log(`Unhandled peer message: ${JSON.stringify(parsedMessage)}`)
        }
      }
    })
  }

  /**
   *
   *
   * Local message handling
   *
   *
   */
  onReceiveFromLocal(command, parameters) {
    if (localCommandHandlers[command]) {
      this.log(`Handling local command: ${command}`)

      localCommandHandlers[command].call(this, parameters)

    } else {
      this.log(`Unhandled local command: ${JSON.stringify(command)}`)
    }
  }
}

util.inherits(RFC2813, EventEmitter)

export default RFC2813
