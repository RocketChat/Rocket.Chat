import { Random } from 'meteor/random';

/**
 * Facade for Meteor's `Random.id` function
 *
 * @param length length of the identifier in characters
 * @returns a unique identifier, such as `"Jjwjg6gouWLXhMGKW"`, that is likely to be unique in the whole world
 */
export const getRandomId = (length?: number): string => Random.id(length);

/**
 * Facade for Meteor's `Random.fraction` function
 *
 * @returns a strong random number between 0 and 1
 */
export const getRandomFraction = (): number => Random.fraction();
