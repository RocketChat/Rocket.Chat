import { findPopupOptionIndex, getPopupFilter, getPopupReplaceRange } from './composerPopupTrigger';

const user = { trigger: '@', triggerAnywhere: true };
const room = { trigger: '#', triggerAnywhere: true };
const command = { trigger: '/', triggerAnywhere: false };
const emoji = { trigger: ':', triggerAnywhere: true, triggerLength: 2 };
const custom = { trigger: '!', matchSelectorRegex: /(?:^|\s)(!)([a-z]*$)/ };
const options = [user, room, command, emoji, custom];

describe('findPopupOptionIndex', () => {
	it.each([
		['@jo', 0],
		['hello @jo', 0],
		['hi #gen', 1],
		['/inv', 2],
		['/', 2],
		[':sm', 3],
		['say :smi', 3],
		['!bang', 4],
		['plain text', -1],
		['', -1],
	])('should match %j to option %i', (text, index) => {
		expect(findPopupOptionIndex(options, text)).toBe(index);
	});

	it('should not match a trigger that is not at the start when triggerAnywhere is off', () => {
		expect(findPopupOptionIndex([command], 'run /inv')).toBe(-1);
	});

	it('should not match a trigger glued to the previous word', () => {
		expect(findPopupOptionIndex([user], 'mail@jo')).toBe(-1);
	});

	it('should keep the popup closed until the text after the trigger passes triggerLength', () => {
		expect(findPopupOptionIndex([emoji], ':')).toBe(-1);
		expect(findPopupOptionIndex([emoji], ':s')).toBe(-1);
		expect(findPopupOptionIndex([emoji], ':sm')).toBe(0);
	});

	it('should close the popup once a space ends the trigger word', () => {
		expect(findPopupOptionIndex([user], '@john ')).toBe(-1);
	});

	it('should return the first option that matches', () => {
		expect(findPopupOptionIndex([{ trigger: '@' }, user], '@jo')).toBe(0);
		expect(findPopupOptionIndex([{ trigger: '@' }, user], 'hi @jo')).toBe(1);
	});
});

describe('getPopupFilter', () => {
	it('should return what follows the trigger', () => {
		expect(getPopupFilter(user, 'hello @jo')).toBe('jo');
		expect(getPopupFilter(command, '/inv')).toBe('inv');
		expect(getPopupFilter(emoji, 'say :smi')).toBe('smi');
	});

	it('should use the group of matchSelectorRegex', () => {
		expect(getPopupFilter(custom, 'x !bang')).toBe('bang');
	});

	it('should return an empty filter when nothing matches', () => {
		expect(getPopupFilter(user, 'plain text')).toBe('');
	});
});

describe('getPopupReplaceRange', () => {
	it('should span the trigger and the typed text up to the caret', () => {
		expect(getPopupReplaceRange(user, 'hello @jo', 9)).toEqual({ start: 6, end: 9 });
		expect(getPopupReplaceRange(room, '#gen', 4)).toEqual({ start: 0, end: 4 });
		expect(getPopupReplaceRange(command, '/inv', 4)).toEqual({ start: 0, end: 4 });
	});

	it('should span only the trigger when nothing was typed after it', () => {
		expect(getPopupReplaceRange(user, 'hi @', 4)).toEqual({ start: 3, end: 4 });
	});

	it('should end at the caret even when it is past the length of the text before it', () => {
		expect(getPopupReplaceRange(room, '#gen', 5)).toEqual({ start: 0, end: 5 });
	});

	it('should return nothing when the text does not match', () => {
		expect(getPopupReplaceRange(user, 'plain text', 10)).toBeUndefined();
	});
});

describe('the selectors the popup hook built inline before the extraction', () => {
	type Option = { trigger?: string; triggerAnywhere?: boolean; triggerLength?: number; matchSelectorRegex?: RegExp };

	const legacyIndex = (list: Option[], value: string) =>
		list.findIndex(({ trigger, matchSelectorRegex, triggerAnywhere, triggerLength }) => {
			const selector =
				matchSelectorRegex ?? (triggerAnywhere ? new RegExp(`(?:^|\\s)(${trigger})[^\\s]*$`) : new RegExp(`(?:^)(${trigger})[^\\s]*$`));
			const result = selector.test(value);
			if (!triggerLength || !result) {
				return result;
			}
			const filter = value.match(selector);
			return filter && triggerLength < filter[0].length;
		});

	const legacySelect = (option: Option, value: string) => {
		const selector =
			option.matchSelectorRegex ??
			(option.triggerAnywhere ? new RegExp(`(?:^|\\s)(${option.trigger})([^\\s]*$)`) : new RegExp(`(?:^)(${option.trigger})([^\\s]*$)`));
		const result = value.match(selector);
		return result ? { filter: result[2], start: value.lastIndexOf(result[1] + result[2]) } : undefined;
	};

	const texts = [
		'',
		'@',
		'@a',
		'a @',
		'a @b',
		'a@b',
		'#c',
		'/',
		'/x',
		'a /x',
		':',
		':a',
		':ab',
		'a :abc',
		'!z',
		'a !z',
		'@a b',
		' @a',
		'\n@a',
		'ab',
		'@@',
		'::a',
	];

	it.each(texts)('should agree with the inline selectors for %j', (text) => {
		expect(findPopupOptionIndex(options, text)).toBe(legacyIndex(options, text));

		for (const option of options) {
			const legacy = legacySelect(option, text);
			expect(getPopupFilter(option, text)).toBe(legacy?.filter ?? '');
			expect(getPopupReplaceRange(option, text, text.length)).toEqual(legacy && { start: legacy.start, end: text.length });
		}
	});
});
