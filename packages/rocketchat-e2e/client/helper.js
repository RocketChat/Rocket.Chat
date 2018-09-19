/* eslint-disable new-cap, no-proto */

import ByteBuffer from 'bytebuffer';

RocketChat.signalUtils = (function() {
	const StaticArrayBufferProto = new ArrayBuffer().__proto__;

	return {
		toString(thing) {
			if (typeof thing === 'string') {
				return thing;
			}
			return new ByteBuffer.wrap(thing).toString('binary');
		},
		toArrayBuffer(thing) {
			if (thing === undefined) {
				return undefined;
			}
			if (thing === Object(thing)) {
				if (thing.__proto__ === StaticArrayBufferProto) {
					return thing;
				}
			}

			if (typeof thing !== 'string') {
				throw new Error(`Tried to convert a non-string of type ${ typeof thing } to an array buffer`);
			}
			return new ByteBuffer.wrap(thing, 'binary').toArrayBuffer();
		},
		isEqual(a, b) {
			// TODO: Special-case arraybuffers, etc
			if (a === undefined || b === undefined) {
				return false;
			}
			a = RocketChat.signalUtils.toString(a);
			b = RocketChat.signalUtils.toString(b);
			const maxLength = Math.max(a.length, b.length);
			if (maxLength < 5) {
				throw new Error('a/b compare too short');
			}
			return a.substring(0, Math.min(maxLength, a.length)) === b.substring(0, Math.min(maxLength, b.length));
		},
	};
}());
