import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsDeleteProps } from './TeamsDeleteProps';

describe('TeamsDeleteProps (definition/rest/v1)', () => {
	describe('isTeamsDeleteProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsDeleteProps, 'function');
		});

		it('should return false if neither teamName or teamId is provided', () => {
			assert.equal(isTeamsDeleteProps({}), false);
		});

		it('should return true if teamId is provided', () => {
			assert.equal(isTeamsDeleteProps({ teamId: 'teamId' }), true);
		});

		it('should return true if teamName is provided', () => {
			assert.equal(isTeamsDeleteProps({ teamName: 'teamName' }), true);
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is empty', () => {
			assert.equal(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: [] }), false);
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is empty', () => {
			assert.equal(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: [] }), false);
		});

		it('should return true if teamId and roomsToRemove are provided', () => {
			assert.equal(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomId'] }), true);
		});

		it('should return true if teamName and roomsToRemove are provided', () => {
			assert.equal(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: ['roomId'] }), true);
		});

		it('should return false if teamId and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			assert.equal(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: {} }), false);
		});

		it('should return false if teamName and roomsToRemove are provided, but roomsToRemove is not an array', () => {
			assert.equal(isTeamsDeleteProps({ teamName: 'teamName', roomsToRemove: {} }), false);
		});

		it('should return false if teamName and rooms are provided but an extra property is provided', () => {
			assert.equal(
				isTeamsDeleteProps({
					teamName: 'teamName',
					roomsToRemove: ['roomsToRemove'],
					extra: 'extra',
				}),
				false,
			);
		});

		it('should return false if teamId and rooms are provided but an extra property is provided', () => {
			assert.equal(isTeamsDeleteProps({ teamId: 'teamId', roomsToRemove: ['roomsToRemove'], extra: 'extra' }), false);
		});
	});
});
