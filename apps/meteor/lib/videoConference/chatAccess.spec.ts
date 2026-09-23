import { expect } from 'chai';

import { resolveChatAccessMode } from './chatAccess';

describe('videoConference chat access', () => {
	describe('resolveChatAccessMode', () => {
		it('honours an explicit choice the room can carry out', () => {
			expect(resolveChatAccessMode({ mode: 'invite', canInvite: true })).to.equal('invite');
			expect(resolveChatAccessMode({ mode: 'discussion', canInvite: true })).to.equal('discussion');
		});

		// Which of the two leads is the modal's business, not this one's: a discussion asked for by someone
		// looking at a room that could have taken the members instead is still a discussion.
		it('honours a discussion even for a room that could have taken the members instead', () => {
			expect(resolveChatAccessMode({ mode: 'discussion', canInvite: true })).to.equal('discussion');
		});

		// Falling back to the discussion would move the whole conversation on the strength of a request the
		// room can't honour. Refusing leaves the decision with whoever asked.
		it('refuses an invite the room cannot take, rather than quietly doing the other thing', () => {
			expect(resolveChatAccessMode({ mode: 'invite', canInvite: false })).to.be.null;
		});
	});
});
