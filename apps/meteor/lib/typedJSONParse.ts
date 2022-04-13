import { Jsonify } from '@rocket.chat/core-typings';

export const typedJsonParse = <T>(str: string): Jsonify<T> => {
	return JSON.parse(JSON.stringify(str));
};
