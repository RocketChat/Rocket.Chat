import { binb2hex } from './binb2hex.js';
import { core } from './core.js';
import { str2binb } from './str2binb.js';
import { utf8Encode } from './utf8Encode.js';

export function SHA256(input: string) {
	input = utf8Encode(input);
	const chrsz = 8;
	return binb2hex(core(str2binb(input, chrsz), input.length * chrsz));
}
