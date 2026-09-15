import { faker } from '@faker-js/faker';
import { isQuoteAttachment } from '@rocket.chat/core-typings';
import type { AtLeast, IMessage, MessageAttachment, MessageQuoteAttachment } from '@rocket.chat/core-typings';

import { limitQuoteChain } from './limitQuoteChain';

class TestAttachment {}

const makeQuote = (): MessageQuoteAttachment => {
	return {
		text: `[ ](http://localhost:3000/group/encrypted?msg=${faker.string.uuid()})`,
		message_link: `http://localhost:3000/group/encrypted?msg=${faker.string.uuid()}`,
		author_name: faker.internet.userName(),
		author_icon: `/avatar/${faker.internet.userName()}`,
		author_link: `http://localhost:3000/group/encrypted?msg=${faker.string.uuid()}`,
	};
};

const makeChainedQuote = (chainSize: number): MessageQuoteAttachment => {
	if (chainSize === 0) {
		throw new Error('Chain size cannot be 0');
	}

	if (chainSize === 1) {
		return makeQuote();
	}

	return {
		...makeQuote(),
		attachments: [
			makeChainedQuote(chainSize - 1),
			// add a few extra attachments to ensure they are not messed with
			new TestAttachment() as MessageAttachment,
			new TestAttachment() as MessageAttachment,
		],
	};
};

const makeMessage = (chainSize: number): any => {
	if (chainSize === 0) {
		return {};
	}

	return {
		attachments: [makeChainedQuote(chainSize)],
	};
};

const chainSizes = [0, 1, 2, 3, 4, 5, 10, 20, 50, 100];

const limits = [0, 1, 2, 3, 4, 5, 10, 20, 50, 100];

const countQuoteDeepnes = (attachments?: MessageAttachment[], quoteLength = 0): number => {
	if (!attachments || attachments.length < 1) {
		return quoteLength + 1;
	}

	// Ensure sibling attachments didn't change
	attachments.forEach((attachment) => {
		if (!isQuoteAttachment(attachment) && !(attachment instanceof TestAttachment)) {
			throw new Error('PANIC! Non quote attachment changed. This should never happen.');
		}
	});

	const quote = attachments.find((attachment) => isQuoteAttachment(attachment));
	if (!quote?.attachments) {
		return quoteLength + 1;
	}

	return countQuoteDeepnes(quote.attachments, quoteLength + 1);
};

const countMessageQuoteChain = (message: AtLeast<IMessage, 'attachments'>) => {
	return countQuoteDeepnes(message.attachments);
};

describe('ChatMessages Composer API - limitQuoteChain', () => {
	describe.each(chainSizes)('quote chain %i levels deep', (size) => {
		it.each(limits)('should limit chain to be at max %i level(s) deep', (limit) => {
			// If the size is less than the limit, it shouldn't filter anything
			// The main message also counts as a quote, so this will never be less than 1. See implementation for more details.
			const quoteLimitOrSize = Math.max(1, Math.min(limit, size));
			const message = makeMessage(size);
			const limitedMessage = limitQuoteChain(message, limit);

			expect(countMessageQuoteChain(limitedMessage)).toBe(quoteLimitOrSize);
		});
	});
});
