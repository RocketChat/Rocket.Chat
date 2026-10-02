import type { ComposerStateInput } from './composerState';
import { resolveComposerState } from './composerState';

const input = (overrides: Partial<ComposerStateInput> = {}): ComposerStateInput => ({
	isAirGappedRestricted: false,
	isOmnichannel: false,
	isFederation: false,
	isFederationBlocked: false,
	isAnonymous: false,
	isReadOnly: false,
	isArchived: false,
	mustJoinWithCode: false,
	isBlockedOrBlocker: false,
	isSelectingMessages: false,
	...overrides,
});

describe('resolveComposerState', () => {
	it('lets someone write when nothing is in the way', () => {
		expect(resolveComposerState(input())).toEqual({ kind: 'message' });
	});

	it.each([
		['airGappedRestricted', { isAirGappedRestricted: true }],
		['omnichannel', { isOmnichannel: true }],
		['anonymous', { isAnonymous: true }],
		['readOnly', { isReadOnly: true }],
		['archived', { isArchived: true }],
		['joinWithCode', { mustJoinWithCode: true }],
		['blocked', { isBlockedOrBlocker: true }],
		['selectingMessages', { isSelectingMessages: true }],
	] as const)('answers %s on its own', (kind, overrides) => {
		expect(resolveComposerState(input(overrides)).kind).toBe(kind);
	});

	it('carries whether a federated room is blocked', () => {
		expect(resolveComposerState(input({ isFederation: true, isFederationBlocked: true }))).toEqual({
			kind: 'federation',
			blocked: true,
		});
	});

	describe('the order, when more than one holds', () => {
		it('puts an air gap above everything', () => {
			expect(resolveComposerState(input({ isAirGappedRestricted: true, isOmnichannel: true, isArchived: true })).kind).toBe(
				'airGappedRestricted',
			);
		});

		it('puts omnichannel above federation', () => {
			expect(resolveComposerState(input({ isOmnichannel: true, isFederation: true })).kind).toBe('omnichannel');
		});

		it('puts read only above archived', () => {
			expect(resolveComposerState(input({ isReadOnly: true, isArchived: true })).kind).toBe('readOnly');
		});

		it('puts the join code above being blocked', () => {
			expect(resolveComposerState(input({ mustJoinWithCode: true, isBlockedOrBlocker: true })).kind).toBe('joinWithCode');
		});

		it('keeps selecting messages last, so every reason to refuse wins over it', () => {
			expect(resolveComposerState(input({ isSelectingMessages: true, isBlockedOrBlocker: true })).kind).toBe('blocked');
		});
	});
});
