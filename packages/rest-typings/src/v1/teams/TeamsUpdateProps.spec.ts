import { isTeamsUpdateProps } from './TeamsUpdateProps';

describe('TeamsUpdateMemberProps (definition/rest/v1)', () => {
	describe('isTeamsUpdateProps', () => {
		it('should return false when provided anything that is not an TeamsUpdateProps', () => {
			expect(isTeamsUpdateProps(undefined)).toBeFalsy();
			expect(isTeamsUpdateProps(null)).toBeFalsy();
			expect(isTeamsUpdateProps('')).toBeFalsy();
			expect(isTeamsUpdateProps(123)).toBeFalsy();
			expect(isTeamsUpdateProps({})).toBeFalsy();
			expect(isTeamsUpdateProps([])).toBeFalsy();
			expect(isTeamsUpdateProps(new Date())).toBeFalsy();
			expect(isTeamsUpdateProps(new Error())).toBeFalsy();
		});
		it('should return false when only teamName is provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
				}),
			).toBeFalsy();
		});

		it('should return false when only teamId is provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
				}),
			).toBeFalsy();
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is an empty object', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {},
				}),
			).toBeFalsy();
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is an empty object', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {},
				}),
			).toBeFalsy();
		});

		it('should return false when teamName and data are provided to TeamsUpdateProps but data is not an object', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: 'data',
				}),
			).toBeFalsy();
		});

		it('should return false when teamId and data are provided to TeamsUpdateProps but data is not an object', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: 'data',
				}),
			).toBeFalsy();
		});

		it('should return true when teamName and data.name are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
					},
				}),
			).toBeTruthy();
		});

		it('should return true when teamId and data.name are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
					},
				}),
			).toBeTruthy();
		});

		it('should return true when teamName and data.type are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						type: 0,
					},
				}),
			).toBeTruthy();
		});

		it('should return true when teamId and data.type are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						type: 0,
					},
				}),
			).toBeTruthy();
		});

		it('should return true when teamName and data.name and data.type are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
						type: 0,
					},
				}),
			).toBeTruthy();
		});

		it('should return true when teamId and data.name and data.type are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
						type: 0,
					},
				}),
			).toBeTruthy();
		});

		it('should return false when teamName, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					data: {
						name: 'name',
						type: 0,
						extra: 'extra',
					},
				}),
			).toBeFalsy();
		});

		it('should return false when teamId, data.name, data.type are some more extra data  are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					data: {
						name: 'name',
						type: 0,
						extra: 'extra',
					},
				}),
			).toBeFalsy();
		});

		it('should return false when teamName, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamName: 'teamName',
					extra: 'extra',
					data: {
						name: 'name',
						type: 0,
					},
				}),
			).toBeFalsy();
		});

		it('should return false when teamId, data.name, data.type are some more extra parameter are provided to TeamsUpdateProps', () => {
			expect(
				isTeamsUpdateProps({
					teamId: 'teamId',
					extra: 'extra',
					data: {
						name: 'name',
						type: 0,
					},
				}),
			).toBeFalsy();
		});
	});
});
