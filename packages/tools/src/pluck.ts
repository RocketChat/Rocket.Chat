import type { KeyOfEach, ValueOfOptional } from '@rocket.chat/core-typings';

import { deepGet } from './deepGet';

export function pluck<TObject extends Record<string, any>, K extends KeyOfEach<TObject>>(
	list: TObject[],
	key: K,
): ValueOfOptional<TObject, K>[];
export function pluck<TObject extends Record<string, any>, K extends KeyOfEach<TObject>, L extends KeyOfEach<ValueOfOptional<TObject, K>>>(
	list: TObject[],
	key: `${string & K}.${string & L}`,
): ValueOfOptional<ValueOfOptional<TObject, K>, L>[];
export function pluck<
	TObject extends Record<string, any>,
	K extends KeyOfEach<TObject>,
	L extends KeyOfEach<ValueOfOptional<TObject, K>>,
	M extends KeyOfEach<ValueOfOptional<ValueOfOptional<TObject, K>, L>>,
>(list: TObject[], key: `${string & K}.${string & L}.${string & M}`): ValueOfOptional<ValueOfOptional<ValueOfOptional<TObject, K>, L>, M>[];
export function pluck<
	TObject extends Record<string, any>,
	K extends KeyOfEach<TObject>,
	L extends KeyOfEach<ValueOfOptional<TObject, K>>,
	M extends KeyOfEach<ValueOfOptional<ValueOfOptional<TObject, K>, L>>,
>(list: TObject[], key: `${string & K}.${string & L}.${string & M}.${string}`): any[];

export function pluck<TObject extends Record<string, any>>(list: TObject[], key: string) {
	return list.map((item) => deepGet(item as any, key));
}
