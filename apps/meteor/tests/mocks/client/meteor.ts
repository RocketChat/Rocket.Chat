import { jest } from '@jest/globals';

export const Meteor = {
	loginWithSamlToken: jest.fn((_token, callback: () => void) => callback()),
};

export const Mongo = {
	Collection: class Collection {},
};
