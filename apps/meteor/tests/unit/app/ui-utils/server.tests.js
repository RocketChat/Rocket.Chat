import proxyquire from 'proxyquire';
import { expect } from 'chai';

const { messageProperties } = proxyquire.noCallThru().load('../../../../app/ui-utils/lib/MessageProperties', {
	'../../emoji': {
		emoji: {
			list: {},
		},
	},
});

const messages = {
	'Sample Message': 14,
	'Sample 1 ⛳': 10,
	'Sample 2 ❤': 10,
	'Sample 3 ⛳❤⛳❤': 13,
};

describe('Message Properties', () => {
	describe('Check Message Length', () => {
		Object.keys(messages).forEach((objectKey) => {
			it('should treat emojis as single characters', () => {
				expect(messageProperties.length(objectKey)).to.be.equal(messages[objectKey]);
			});
		});
	});
});
