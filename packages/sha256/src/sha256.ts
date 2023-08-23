import { binb2hex } from './binb2hex';
import { core } from './core';
import { str2binb } from './str2binb';
import { utf8Encode } from './utf8Encode';

export function SHA256(input: string) {
	input = utf8Encode(input);
	const chrsz = 8;
	return binb2hex(core(str2binb(input, chrsz), input.length * chrsz));
}
