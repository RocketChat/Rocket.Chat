/* eslint-disable new-cap, no-proto */

import ByteBuffer from 'bytebuffer';

const StaticArrayBufferProto = new ArrayBuffer().__proto__;

export const toString = (thing) => {
	if (typeof thing === 'string') {
		return thing;
	}
	return new ByteBuffer.wrap(thing).toString('binary');
};

export const toArrayBuffer = (thing) => {
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
};
