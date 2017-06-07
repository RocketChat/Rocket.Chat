
// window.signalStore = SignalProtocolStore;

// function SignalProtocolStore() {
// 	this.store = {};
// }

class SignalProtocolStore {
	constructor() {
		this.store = {};
	}

	getIdentityKeyPair() {
		return Promise.resolve(this.get('identityKey'));
	}
	getLocalRegistrationId() {
		return Promise.resolve(this.get('registrationId'));
	}
	put(key, value) {
		if (key === undefined || value === undefined || key === null || value === null)
			throw new Error("Tried to store undefined/null");
		this.store[key] = value;
	}
	get(key, defaultValue) {
		if (key === null || key === undefined)
			throw new Error("Tried to get value for undefined/null key");
		if (key in this.store) {
			return this.store[key];
		} else {
			return defaultValue;
		}
	}
	remove(key) {
		if (key === null || key === undefined)
			throw new Error("Tried to remove value for undefined/null key");
		delete this.store[key];
	}

	isTrustedIdentity(identifier, identityKey) {
		if (identifier === null || identifier === undefined) {
			throw new Error("tried to check identity key for undefined/null key");
    }
		if (!(identityKey instanceof ArrayBuffer)) {
			throw new Error("Expected identityKey to be an ArrayBuffer");
    }
		var trusted = this.get('identityKey' + identifier);
    if (trusted === undefined) {
      return Promise.resolve(true);
    }
    return Promise.resolve(util.toString(identityKey) === util.toString(trusted));
	}
	loadIdentityKey(identifier) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to get identity key for undefined/null key");
		return Promise.resolve(this.get('identityKey' + identifier));
	}
	saveIdentity(identifier, identityKey) {
		if (identifier === null || identifier === undefined)
			throw new Error("Tried to put identity key for undefined/null key");
		return Promise.resolve(this.put('identityKey' + identifier, identityKey));
	}

	/* Returns a prekeypair object or undefined */
	loadPreKey(keyId) {
    var res = this.get('25519KeypreKey' + keyId);
    if (res !== undefined) {
      res = { pubKey: res.pubKey, privKey: res.privKey };
    }
    return res;
	}
	storePreKey(keyId, keyPair) {
		return Promise.resolve(this.put('25519KeypreKey' + keyId, keyPair));
	}
	removePreKey(keyId) {
		return Promise.resolve(this.remove('25519KeypreKey' + keyId));
	}

	/* Returns a signed keypair object or undefined */
	loadSignedPreKey(keyId) {
    var res = this.get('25519KeysignedKey' + keyId);
    if (res !== undefined) {
      res = { pubKey: res.pubKey, privKey: res.privKey };
    }
    return res;
	}
	storeSignedPreKey(keyId, keyPair) {
		return Promise.resolve(this.put('25519KeysignedKey' + keyId, keyPair));
	}
	removeSignedPreKey(keyId) {
		return Promise.resolve(this.remove('25519KeysignedKey' + keyId));
	}

	loadSession(identifier) {
		return Promise.resolve(this.get('session' + identifier));
	}
	storeSession(identifier, record) {
		return Promise.resolve(this.put('session' + identifier, record));
	}
  removeSession(identifier) {
		return Promise.resolve(this.remove('session' + identifier));
  }
  removeAllSessions(identifier) {
    for (var id in this.store) {
      if (id.startsWith('session' + identifier)) {
        delete this.store[id];
      }
    }
    return Promise.resolve();
  }
}

RocketChat.signalStore = new SignalProtocolStore();
