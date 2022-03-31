import { isTeamsConvertToChannelProps } from './TeamsConvertToChannelProps';

describe('TeamsConvertToChannelProps (definition/rest/v1)', () => {
	describe('isTeamsConvertToChannelProps', () => {
		it('should return false if neither teamName or teamId is provided', () => {
			expect(isTeamsConvertToChannelProps({})).toBeFalsy();
		});

		it('should return true if teamName is provided', () => {
			expect(isTeamsConvertToChannelProps({ teamName: 'teamName' })).toBeTruthy();
		});

		it('should return true if teamId is provided', () => {
			expect(isTeamsConvertToChannelProps({ teamId: 'teamId' })).toBeTruthy();
		});

		it('should return false if both teamName and teamId are provided', () => {
			expect(isTeamsConvertToChannelProps({ teamName: 'teamName', teamId: 'teamId' })).toBeFalsy();
		});

		it('should return false if teamName is not a string', () => {
			expect(isTeamsConvertToChannelProps({ teamName: 1 })).toBeFalsy();
		});

		it('should return false if teamId is not a string', () => {
			expect(isTeamsConvertToChannelProps({ teamId: 1 })).toBeFalsy();
		});

		it('should return false if an additionalProperties is provided', () => {
			expect(
				isTeamsConvertToChannelProps({
					teamName: 'teamName',
					additionalProperties: 'additionalProperties',
				}),
			).toBeFalsy();
		});
	});
});
