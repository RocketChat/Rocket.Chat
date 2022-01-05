import { Random } from 'meteor/random';

export const getRandomId = (length?: number): string => Random.id(length);
