import type { IRoom } from '@rocket.chat/core-typings';

import { chatAccessLeadsWithDiscussion, hasConferenceChatAccess } from './chatAccess';

describe('hasConferenceChatAccess', () => {
	it('says yes where the server named nobody as shut out', () => {
		expect(hasConferenceChatAccess(undefined, 'ada')).toBe(true);
		expect(hasConferenceChatAccess({ membersWithoutAccess: [] }, 'ada')).toBe(true);
	});

	it('says no for a member the server named', () => {
		expect(hasConferenceChatAccess({ membersWithoutAccess: ['ada'] }, 'ada')).toBe(false);
	});

	// A viewer with no id is nobody the server could have named, and answering no would hide the chat from
	// every anonymous render rather than from the people it is actually shut to.
	it('says yes where there is no viewer to ask about', () => {
		expect(hasConferenceChatAccess({ membersWithoutAccess: ['ada'] }, undefined)).toBe(true);
		expect(hasConferenceChatAccess({ membersWithoutAccess: ['ada'] }, null)).toBe(true);
	});
});

describe('chatAccessLeadsWithDiscussion', () => {
	it('leads with the invite for a public channel, whose history is already open', () => {
		expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'c' })).toBe(false);
	});

	it('leads with the discussion where the invite would expose a history that was not open', () => {
		expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'p' })).toBe(true);
		expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'd' })).toBe(true);
	});

	it('leads with the discussion whenever the room cannot take new members, whatever its type', () => {
		for (const type of ['c', 'p', 'd', 'l'] as IRoom['t'][]) {
			expect(chatAccessLeadsWithDiscussion({ canInvite: false, type })).toBe(true);
		}
	});
});
