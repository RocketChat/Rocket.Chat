import isEqualWith from 'lodash/isEqualWith';

const compare = (value: any, other: any, indexOrKey: number | string | symbol | undefined): boolean | undefined =>
	(indexOrKey === undefined ? undefined : Object.is(value, other));

export const isShallowEqual = (value: any, other: any): boolean => isEqualWith(value, other, compare);
