import type { IRoom } from '@rocket.chat/core-typings';
import { expect } from 'chai';

import { chatAccessLeadsWithDiscussion, resolveChatAccessMode } from '../../../../lib/videoConference/chatAccess';

describe('videoConference chat access', () => {
	describe('chatAccessLeadsWithDiscussion', () => {
		it('leads with the invite for a public channel, whose history is already open', () => {
			expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'c' })).to.be.false;
		});

		it('leads with the discussion where the invite would expose a history that was not open', () => {
			expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'p' })).to.be.true;
			expect(chatAccessLeadsWithDiscussion({ canInvite: true, type: 'd' })).to.be.true;
		});

		it('leads with the discussion whenever the room cannot take new members, whatever its type', () => {
			for (const type of ['c', 'p', 'd', 'l'] as IRoom['t'][]) {
				expect(chatAccessLeadsWithDiscussion({ canInvite: false, type })).to.be.true;
			}
		});
	});

	describe('resolveChatAccessMode', () => {
		it('honours an explicit choice the room can carry out', () => {
			expect(resolveChatAccessMode({ mode: 'invite', canInvite: true, type: 'c' })).to.equal('invite');
			expect(resolveChatAccessMode({ mode: 'discussion', canInvite: true, type: 'c' })).to.equal('discussion');
		});

		it('honours a discussion even for a room that could have taken the members instead', () => {
			expect(resolveChatAccessMode({ mode: 'discussion', canInvite: true, type: 'p' })).to.equal('discussion');
		});

		// Falling back to the discussion would move the whole conversation on the strength of a request the
		// room can't honour. Refusing leaves the decision with whoever asked.
		it('refuses an invite the room cannot take, rather than quietly doing the other thing', () => {
			expect(resolveChatAccessMode({ mode: 'invite', canInvite: false, type: 'd' })).to.be.null;
		});

		it('falls back to whichever action leads when no choice is made', () => {
			expect(resolveChatAccessMode({ mode: undefined, canInvite: true, type: 'c' })).to.equal('invite');
			expect(resolveChatAccessMode({ mode: undefined, canInvite: true, type: 'p' })).to.equal('discussion');
			expect(resolveChatAccessMode({ mode: undefined, canInvite: false, type: 'd' })).to.equal('discussion');
		});
	});
});
