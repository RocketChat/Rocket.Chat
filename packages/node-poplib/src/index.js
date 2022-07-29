/*

	Node.js POP3 client library

	Copyright (C) 2011-2013 by Ditesh Shashikant Gathani <ditesh@gathani.org>

	Permission is hereby granted, free of charge, to any person obtaining a copy
	of this software and associated documentation files (the "Software"), to deal
	in the Software without restriction, including without limitation the rights
	to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
	copies of the Software, and to permit persons to whom the Software is
	furnished to do so, subject to the following conditions:

	The above copyright notice and this permission notice shall be included in
	all copies or substantial portions of the Software.

	THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
	IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
	FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
	AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
	LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
	OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
	THE SOFTWARE.

*/

var net = require('net'),
	tls = require('tls'),
	util = require('util'),
	crypto = require('crypto'),
	events = require('events');

// Constructor
function POP3Client(port, host, options) {
	if (options === undefined) options = {};

	// Optional constructor arguments
	var enabletls = options.enabletls !== undefined ? options.enabletls : false;
	var ignoretlserrs = options.ignoretlserrs !== undefined ? options.ignoretlserrs : false;
	var debug = options.debug || false;

	var tlsDirectOpts = options.tlsopts !== undefined ? options.tlsopts : {};

	// Private variables follow
	var self = this;
	var response = null;
	var checkResp = true;
	var bufferedData = '';
	var state = 0;
	var locked = false;
	var multiline = false;
	var socket = null;
	var tlssock = null;
	var callback = function (resp, data) {
		if (resp === false) {
			locked = false;
			callback = function () {};
			self.emit('connect', false, data);
		} else {
			// Checking for APOP support
			var banner = data.trim();
			var bannerComponents = banner.split(' ');

			for (var i = 0; i < bannerComponents.length; i++) {
				if (bannerComponents[i].indexOf('@') > 0) {
					self.data['apop'] = true;
					self.data['apop-timestamp'] = bannerComponents[i];
					break;
				}
			}

			state = 1;
			self.data['banner'] = banner;
			self.emit('connect', true, data);
		}
	};

	// Public variables follow
	this.data = {
		host: host,
		port: port,
		banner: '',
		stls: false,
		apop: false,
		username: '',
		tls: enabletls,
		ignoretlserrs: ignoretlserrs,
	};

	// Privileged methods follow
	this.setCallback = function (cb) {
		callback = cb;
	};
	this.getCallback = function () {
		return callback;
	};
	this.setState = function (val) {
		state = val;
	};
	this.getState = function () {
		return state;
	};
	this.setLocked = function (val) {
		locked = val;
	};
	this.getLocked = function () {
		return locked;
	};
	this.setMultiline = function (val) {
		multiline = val;
	};
	this.getMultiline = function () {
		return multiline;
	};

	// Writes to remote server socket
	this.write = function (command, argument) {
		var text = command;

		if (argument !== undefined) text = text + ' ' + argument + '\r\n';
		else text = text + '\r\n';

		if (debug) console.log('Client: ' + util.inspect(text));

		socket.write(text);
	};

	// Kills the socket connection
	this.end = function () {
		socket.end();
	};

	// Upgrades a standard unencrypted TCP connection to use TLS
	// Liberally copied and modified from https://gist.github.com/848444
	// starttls() should be a private function, but I can't figure out
	// how to get a public prototypal method (stls) to talk to private method (starttls)
	// which references private variables without going through a privileged method
	this.starttls = function (options) {
		var s = socket;
		s.removeAllListeners('end');
		s.removeAllListeners('data');
		s.removeAllListeners('error');
		socket = null;

		var sslcontext = require('crypto').createCredentials(options);
		var pair = tls.createSecurePair(sslcontext, false);
		var cleartext = pipe(pair);

		pair.on('secure', function () {
			var verifyError = pair.ssl.verifyError();
			cleartext.authorized = true;

			if (verifyError) {
				cleartext.authorized = false;
				cleartext.authorizationError = verifyError;
			}

			cleartext.on('data', onData);
			cleartext.on('error', onError);
			cleartext.on('end', onEnd);
			socket = cleartext;
			self.getCallback()(cleartext.authorized, cleartext.authorizationError);
		});

		cleartext._controlReleased = true;

		function pipe(pair) {
			pair.encrypted.pipe(s);
			s.pipe(pair.encrypted);

			pair.fd = s.fd;
			var cleartext = pair.cleartext;
			cleartext.socket = s;
			cleartext.encrypted = pair.encrypted;
			cleartext.authorized = false;

			function onerror(e) {
				if (cleartext._controlReleased) cleartext.emit('error', e);
			}

			function onclose() {
				s.removeListener('error', onerror);
				s.removeListener('close', onclose);
			}

			s.on('error', onerror);
			s.on('close', onclose);
			return cleartext;
		}
	};

	// Private methods follow
	// Event handlers follow
	function onData(data) {
		data = data.toString('ascii');
		bufferedData += data;

		if (debug) console.log('Server: ' + util.inspect(data));

		if (checkResp === true) {
			if (bufferedData.substr(0, 3) === '+OK') {
				checkResp = false;
				response = true;
			} else if (bufferedData.substr(0, 4) === '-ERR') {
				checkResp = false;
				response = false;

				// The following is only used for SASL
			} else if (multiline === false) {
				checkResp = false;
				response = true;
			}
		}

		if (checkResp === false) {
			if (multiline === true && (response === false || bufferedData.substr(bufferedData.length - 5) === '\r\n.\r\n')) {
				// Make a copy to avoid race conditions
				var responseCopy = response;
				var bufferedDataCopy = bufferedData;

				response = null;
				checkResp = true;
				multiline = false;
				bufferedData = '';

				callback(responseCopy, bufferedDataCopy);
			} else if (multiline === false) {
				// Make a copy to avoid race conditions
				var responseCopy = response;
				var bufferedDataCopy = bufferedData;

				response = null;
				checkResp = true;
				multiline = false;
				bufferedData = '';

				callback(responseCopy, bufferedDataCopy);
			}
		}
	}

	function onError(err) {
		if (err.errno === 111) self.emit('connect', false, err);
		else self.emit('error', err);
	}

	function onEnd(data) {
		self.setState(0);
		socket = null;
	}

	function onClose() {
		self.emit('close');
	}

	// Constructor code follows
	// Set up EventEmitter constructor function
	events.EventEmitter.call(this);

	// Remote end socket
	if (enabletls === true) {
		tlssock = tls.connect(
			{
				host: host,
				port: port,
				rejectUnauthorized: !self.data.ignoretlserrs,
			},
			function () {
				if (tlssock.authorized === false && self.data['ignoretlserrs'] === false) self.emit('tls-error', tlssock.authorizationError);
			},
		);

		socket = tlssock;
	} else socket = new net.createConnection(port, host);

	// Set up event handlers
	socket.on('data', onData);
	socket.on('error', onError);
	socket.on('end', onEnd);
	socket.on('close', onClose);
}

util.inherits(POP3Client, events.EventEmitter);

POP3Client.prototype.login = function (username, password) {
	var self = this;

	if (self.getState() !== 1) self.emit('invalid-state', 'login');
	else if (self.getLocked() === true) self.emit('locked', 'login');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			if (resp === false) {
				self.setLocked(false);
				self.setCallback(function () {});
				self.emit('login', false, data);
			} else {
				self.setCallback(function (resp, data) {
					self.setLocked(false);
					self.setCallback(function () {});

					if (resp !== false) self.setState(2);
					self.emit('login', resp, data);
				});

				self.setMultiline(false);
				self.write('PASS', password);
			}
		});

		self.setMultiline(false);
		self.write('USER', username);
	}
};

// SASL AUTH implementation
// Currently supports SASL PLAIN and CRAM-MD5
POP3Client.prototype.auth = function (type, username, password) {
	type = type.toUpperCase();
	var self = this;
	var types = { 'PLAIN': 1, 'CRAM-MD5': 1 };
	var initialresp = '';

	if (self.getState() !== 1) self.emit('invalid-state', 'auth');
	else if (self.getLocked() === true) self.emit('locked', 'auth');

	if (type in types === false) {
		self.emit('auth', false, 'Invalid auth type', null);
		return;
	}

	function tlsok() {
		if (type === 'PLAIN') {
			initialresp = ' ' + new Buffer(username + '\u0000' + username + '\u0000' + password).toString('base64') + '=';
			self.setCallback(function (resp, data) {
				if (resp !== false) self.setState(2);
				self.emit('auth', resp, data, data);
			});
		} else if (type === 'CRAM-MD5') {
			self.setCallback(function (resp, data) {
				if (resp === false) self.emit('auth', resp, 'Server responded -ERR to AUTH CRAM-MD5', data);
				else {
					var challenge = new Buffer(data.trim().substr(2), 'base64').toString();
					var hmac = crypto.createHmac('md5', password);
					var response = new Buffer(username + ' ' + hmac.update(challenge).digest('hex')).toString('base64');

					self.setCallback(function (resp, data) {
						var errmsg = null;

						if (resp !== false) self.setState(2);
						else errmsg = 'Server responded -ERR to response';

						self.emit('auth', resp, null, data);
					});

					self.write(response);
				}
			});
		}

		self.write('AUTH ' + type + initialresp);
	}

	if (self.data['tls'] === false && self.data['stls'] === false) {
		// Remove all existing STLS listeners
		self.removeAllListeners('stls');

		self.on('stls', function (resp, rawdata) {
			if (resp === false) {
				// We (optionally) ignore self signed cert errors,
				// in blatant violation of RFC 2595, Section 2.4
				if (self.data['ignoretlserrs'] === true && rawdata === 'DEPTH_ZERO_SELF_SIGNED_CERT') tlsok();
				else self.emit('auth', false, 'Unable to upgrade connection to STLS', rawdata);
			} else tlsok();
		});

		self.stls();
	} else tlsok();
};

POP3Client.prototype.apop = function (username, password) {
	var self = this;

	if (self.getState() !== 1) self.emit('invalid-state', 'apop');
	else if (self.getLocked() === true) self.emit('locked', 'apop');
	else if (self.data['apop'] === false) self.emit('apop', false, 'APOP support not detected on remote server');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp === true) self.setState(2);
			self.emit('apop', resp, data);
		});

		self.setMultiline(false);
		self.write(
			'APOP',
			username +
				' ' +
				crypto
					.createHash('md5')
					.update(self.data['apop-timestamp'] + password)
					.digest('hex'),
		);
	}
};

POP3Client.prototype.stls = function () {
	var self = this;

	if (self.getState() !== 1) self.emit('invalid-state', 'stls');
	else if (self.getLocked() === true) self.emit('locked', 'stls');
	else if (self.data['tls'] === true) self.emit('stls', false, 'Unable to execute STLS as TLS connection already established');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp === true) {
				self.setCallback(function (resp, data) {
					if (resp === false && self.data['ignoretlserrs'] === true && data === 'DEPTH_ZERO_SELF_SIGNED_CERT') resp = true;

					self.data['stls'] = true;
					self.emit('stls', resp, data);
				});

				self.starttls();
			} else self.emit('stls', false, data);
		});

		self.setMultiline(false);
		self.write('STLS');
	}
};

POP3Client.prototype.top = function (msgnumber, lines) {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'top');
	else if (self.getLocked() === true) self.emit('locked', 'top');
	else {
		self.setCallback(function (resp, data) {
			var returnValue = null;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp !== false) {
				returnValue = '';
				var startOffset = data.indexOf('\r\n', 0) + 2;
				var endOffset = data.indexOf('\r\n.\r\n', 0) + 2;

				if (endOffset > startOffset) returnValue = data.substr(startOffset, endOffset - startOffset);
			}

			self.emit('top', resp, msgnumber, returnValue, data);
		});

		self.setMultiline(true);
		self.write('TOP', msgnumber + ' ' + lines);
	}
};

POP3Client.prototype.list = function (msgnumber) {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'list');
	else if (self.getLocked() === true) self.emit('locked', 'list');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			var returnValue = null;
			var msgcount = 0;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp !== false) {
				returnValue = [];

				if (msgnumber !== undefined) {
					msgcount = 1;
					listitem = data.split(' ');
					returnValue[listitem[1]] = listitem[2];
				} else {
					var offset = 0;
					var listitem = '';
					var newoffset = 0;
					var returnValue = [];
					var startOffset = data.indexOf('\r\n', 0) + 2;
					var endOffset = data.indexOf('\r\n.\r\n', 0) + 2;

					if (endOffset > startOffset) {
						data = data.substr(startOffset, endOffset - startOffset);

						while (true) {
							if (offset > endOffset) break;

							newoffset = data.indexOf('\r\n', offset);

							if (newoffset < 0) break;

							msgcount++;
							listitem = data.substr(offset, newoffset - offset);
							listitem = listitem.split(' ');
							returnValue[listitem[0]] = listitem[1];
							offset = newoffset + 2;
						}
					}
				}
			}

			self.emit('list', resp, msgcount, msgnumber, returnValue, data);
		});

		if (msgnumber !== undefined) self.setMultiline(false);
		else self.setMultiline(true);

		self.write('LIST', msgnumber);
	}
};

POP3Client.prototype.stat = function () {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'stat');
	else if (self.getLocked() === true) self.emit('locked', 'stat');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			var returnValue = null;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp !== false) {
				listitem = data.split(' ');
				returnValue = {
					count: listitem[1].trim(),
					octets: listitem[2].trim(),
				};
			}

			self.emit('stat', resp, returnValue, data);
		});

		self.setMultiline(false);
		self.write('STAT', undefined);
	}
};

POP3Client.prototype.uidl = function (msgnumber) {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'uidl');
	else if (self.getLocked() === true) self.emit('locked', 'uidl');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			var returnValue = null;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp !== false) {
				returnValue = [];

				if (msgnumber !== undefined) {
					listitem = data.split(' ');
					returnValue[listitem[1]] = listitem[2].trim();
				} else {
					var offset = 0;
					var listitem = '';
					var newoffset = 0;
					var returnValue = [];
					var startOffset = data.indexOf('\r\n', 0) + 2;
					var endOffset = data.indexOf('\r\n.\r\n', 0) + 2;

					if (endOffset > startOffset) {
						data = data.substr(startOffset, endOffset - startOffset);
						endOffset -= startOffset;

						while (offset < endOffset) {
							newoffset = data.indexOf('\r\n', offset);
							listitem = data.substr(offset, newoffset - offset);
							listitem = listitem.split(' ');
							returnValue[listitem[0]] = listitem[1];
							offset = newoffset + 2;
						}
					}
				}
			}

			self.emit('uidl', resp, msgnumber, returnValue, data);
		});

		if (msgnumber !== undefined) self.setMultiline(false);
		else self.setMultiline(true);

		self.write('UIDL', msgnumber);
	}
};

POP3Client.prototype.retr = function (msgnumber) {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'retr');
	else if (self.getLocked() === true) self.emit('locked', 'retr');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			var returnValue = null;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp !== false) {
				var startOffset = data.indexOf('\r\n', 0) + 2;
				var endOffset = data.indexOf('\r\n.\r\n', 0);
				returnValue = data.substr(startOffset, endOffset - startOffset);
			}

			self.emit('retr', resp, msgnumber, returnValue, data);
		});

		self.setMultiline(true);
		self.write('RETR', msgnumber);
	}
};

POP3Client.prototype.dele = function (msgnumber) {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'dele');
	else if (self.getLocked() === true) self.emit('locked', 'dele');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});
			self.emit('dele', resp, msgnumber, data);
		});

		self.setMultiline(false);
		self.write('DELE', msgnumber);
	}
};

POP3Client.prototype.noop = function () {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'noop');
	else if (self.getLocked() === true) self.emit('locked', 'noop');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});
			self.emit('noop', resp, data);
		});

		self.setMultiline(false);
		self.write('NOOP', undefined);
	}
};

POP3Client.prototype.rset = function () {
	var self = this;

	if (self.getState() !== 2) self.emit('invalid-state', 'rset');
	else if (self.getLocked() === true) self.emit('locked', 'rset');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});
			self.emit('rset', resp, data);
		});

		self.setMultiline(false);
		self.write('RSET', undefined);
	}
};

POP3Client.prototype.capa = function () {
	var self = this;

	if (self.getState() === 0) self.emit('invalid-state', 'quit');
	else if (self.getLocked() === true) self.emit('locked', 'capa');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			var returnValue = null;
			self.setLocked(false);
			self.setCallback(function () {});

			if (resp === true) {
				var startOffset = data.indexOf('\r\n', 0) + 2;
				var endOffset = data.indexOf('\r\n.\r\n', 0);
				returnValue = data.substr(startOffset, endOffset - startOffset);
				returnValue = returnValue.split('\r\n');
			}

			self.emit('capa', resp, returnValue, data);
		});

		self.setMultiline(true);
		self.write('CAPA', undefined);
	}
};

POP3Client.prototype.quit = function () {
	var self = this;

	if (self.getState() === 0) self.emit('invalid-state', 'quit');
	else if (self.getLocked() === true) self.emit('locked', 'quit');
	else {
		self.setLocked(true);
		self.setCallback(function (resp, data) {
			self.setLocked(false);
			self.setCallback(function () {});

			self.end();
			self.emit('quit', resp, data);
		});

		self.setMultiline(false);
		self.write('QUIT', undefined);
	}
};

module.exports = POP3Client;
