import { removeFromRecent } from './emoji';

describe('removeFromRecent', () => {
	it('should remove a specific emoji from recent emojis', () => {
		const recent = ['emoji1', 'emoji2', 'emoji3'];
		removeFromRecent('emoji2', recent);
		expect(recent).not.toContain('emoji2');
		expect(recent).toEqual(['emoji1', 'emoji3']);
	});

	it('should do nothing if the emoji is not in the recent list', () => {
		const recent = ['emoji1', 'emoji2'];
		removeFromRecent('emoji3', recent);
		expect(recent).toEqual(['emoji1', 'emoji2']);
	});
});
