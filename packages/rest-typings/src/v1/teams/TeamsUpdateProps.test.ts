import assert from 'node:assert';
import { describe, it } from 'node:test';

import { isTeamsUpdateProps } from './TeamsUpdateProps';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateProps', () => {
		it('should be a function', () => {
			assert.equal(typeof isTeamsUpdateProps, 'function');
		});
		it('should return false when provided anything that is not an TeamsUpdateProps', () => {
			assert.equal(isTeamsUpdateProps(undefined), false);
			assert.equal(isTeamsUpdateProps(null), false);
			assert.equal(isTeamsUpdateProps(''), false);
			assert.equal(isTeamsUpdateProps(123), false);
			assert.equal(isTeamsUpdateProps({}), false);
			assert.equal(isTeamsUpdateProps([]), false);
			assert.equal(isTeamsUpdateProps(new Date()), false);
			assert.equal(isTeamsUpdateProps(new Error()), false);
		});
		it('should return false when only teamName is provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
				}),
				false,
			);
		});

		it('should return false when only teamId is provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
				}),
				false,
			);
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is an empty object', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {},
				}),
				false,
			);
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is an empty object', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {},
				}),
				false,
			);
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is not an object', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: 'data',
				}),
				false,
			);
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is not an object', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: 'data',
				}),
				false,
			);
		});

		it('should return true when teamName and data.name are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
					},
				}),
				true,
			);
		});

		it('should return true when teamId and data.name are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
					},
				}),
				true,
			);
		});

		it('should return true when teamName and data.type are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						type: 0,
					},
				}),
				true,
			);
		});

		it('should return true when teamId and data.type are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						type: 0,
					},
				}),
				true,
			);
		});

		it('should return true when teamName and data.name and data.type are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
						type: 0,
					},
				}),
				true,
			);
		});

		it('should return true when teamId and data.name and data.type are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
						type: 0,
					},
				}),
				true,
			);
		});

		it('should return false when teamName, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
						type: 0,
						extra: 'extra',
					},
				}),
				false,
			);
		});

		it('should return false when teamId, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
						type: 0,
						extra: 'extra',
					},
				}),
				false,
			);
		});

		it('should return false when teamName, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamName: 'teamName',
					extra: 'extra',
					data: {
						name: 'name',
						type: 0,
					},
				}),
				false,
			);
		});

		it('should return false when teamId, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			assert.equal(
				isTeamsUpdateProps({
					teamId: 'teamId',
					extra: 'extra',
					data: {
						name: 'name',
						type: 0,
					},
				}),
				false,
			);
		});
	});
});
