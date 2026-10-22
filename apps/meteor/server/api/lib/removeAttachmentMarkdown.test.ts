import { describe, it } from 'node:test';

import { expect } from 'chai';
import proxyquire from 'proxyquire';

const { removeAttachmentMarkdown } = proxyquire.noCallThru().load('./removeAttachmentMarkdown', {
	'@rocket.chat/tools': { isRecord: (value: unknown) => typeof value === 'object' && value !== null && !Array.isArray(value) },
});

describe('removeAttachmentMarkdown', () => {
	it('should drop md and descriptionMd and keep every other field', () => {
		const result = removeAttachmentMarkdown([
			{ text: 'quote', md: [], title: 'title', image_url: '/file/a.png', description: 'text', descriptionMd: [] },
		]);

		expect(result).to.deep.equal([{ text: 'quote', title: 'title', image_url: '/file/a.png', description: 'text' }]);
	});

	it('should drop the trees of every attachment, not only the first', () => {
		const result = removeAttachmentMarkdown([{ descriptionMd: [] }, { descriptionMd: [] }, { text: 'plain' }]);

		expect(result).to.deep.equal([{}, {}, { text: 'plain' }]);
	});

	it('should drop the trees of nested attachments', () => {
		const result = removeAttachmentMarkdown([{ text: 'outer', attachments: [{ md: [], attachments: [{ descriptionMd: [] }] }] }]);

		expect(result).to.deep.equal([{ text: 'outer', attachments: [{ attachments: [{}] }] }]);
	});

	it('should clean attachments at any depth and keep the data around the trees', () => {
		const depth = 5000;
		let deepest: Record<string, unknown> = { text: 'deepest', descriptionMd: [] };
		for (let level = 1; level <= depth; level++) {
			deepest = { text: `level ${level}`, md: [], attachments: [deepest] };
		}

		const texts: string[] = [];
		let treeFields = 0;
		for (let node = (removeAttachmentMarkdown([deepest]) as Record<string, any>[])[0]; node; node = node.attachments?.[0]) {
			texts.push(node.text);
			treeFields += Number('md' in node) + Number('descriptionMd' in node);
		}

		expect(treeFields).to.equal(0);
		expect(texts).to.have.lengthOf(depth + 1);
		expect(texts[0]).to.equal(`level ${depth}`);
		expect(texts[depth]).to.equal('deepest');
	});

	it('should keep the order of the attachments', () => {
		const result = removeAttachmentMarkdown([{ text: 'a', attachments: [{ text: 'a1' }, { text: 'a2' }] }, { text: 'b' }]);

		expect(result).to.deep.equal([{ text: 'a', attachments: [{ text: 'a1' }, { text: 'a2' }] }, { text: 'b' }]);
	});

	it('should not change the attachments it receives', () => {
		const attachments = [{ md: [], text: 'quote' }];

		removeAttachmentMarkdown(attachments);

		expect(attachments).to.deep.equal([{ md: [], text: 'quote' }]);
	});

	it('should return anything that is not a list of attachments as it is', () => {
		expect(removeAttachmentMarkdown(undefined)).to.equal(undefined);
		expect(removeAttachmentMarkdown(null)).to.equal(null);
		expect(removeAttachmentMarkdown([null, 'text'])).to.deep.equal([null, 'text']);
	});
});
