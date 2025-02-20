import type { StringMap } from 'esl';

export const makeFreeSwitchResponse = (lines: string[][]): StringMap => ({
	_body: lines.map((columns) => columns.join('|')).join('\n'),
});
