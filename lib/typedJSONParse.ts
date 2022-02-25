import { Jsonify } from '../definition/utils';

export const typedJsonParse = <T>(str: string): Jsonify<T> => {
	return JSON.parse(JSON.stringify(str));
};
