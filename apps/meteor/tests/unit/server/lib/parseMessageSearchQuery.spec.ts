import { expect } from 'chai';

import { parseMessageSearchQuery } from '../../../../server/lib/parseMessageSearchQuery';
import { createFakeUser } from '../../../mocks/data';

describe('parseMessageSearchQuery', () => {
	const params = {
		user: createFakeUser(),
	};

	const utcOffset = new Date().getTimezoneOffset() / 60;

	[
		{
			text: 'from:rodrigo mention:gabriel chat',
			query: {
				'u.username': { $regex: 'rodrigo', $options: 'i' },
				'mentions.username': { $regex: 'gabriel', $options: 'i' },
				'$text': { $search: 'chat' },
			},
			options: {
				projection: { score: { $meta: 'textScore' } },
				sort: { ts: -1 },
				skip: 0,
				limit: 20,
			},
		},
		{
			text: 'has:star',
			query: { 'starred._id': params.user._id },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'has:url',
			query: { 'urls.0': { $exists: true } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'has:link',
			query: { 'urls.0': { $exists: true } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'is:pinned',
			query: { pinned: true },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'has:pin',
			query: { pinned: true },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'has:location',
			query: { location: { $exists: true } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'has:map',
			query: { location: { $exists: true } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'label:label',
			query: { 'attachments.0.labels': { $regex: 'label', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'label:label1 label:label2',
			query: { 'attachments.0.labels': { $regex: 'label2', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:description',
			query: { 'attachments.description': { $regex: 'description', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-title:title',
			query: { 'attachments.title': { $regex: 'title', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'before:01-01-2023',
			query: { ts: { $lte: new Date(2023, 0, 1, utcOffset) } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'after:01-01-2023',
			query: { ts: { $gte: new Date(2023, 0, 2, utcOffset) } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'on:01-01-2023',
			query: { ts: { $gte: new Date(2023, 0, 1, utcOffset), $lt: new Date(2023, 0, 2, utcOffset) } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'order:asc',
			query: {},
			options: { projection: {}, sort: { ts: 1 }, skip: 0, limit: 20 },
		},
		{
			text: 'hello world',
			query: { $text: { $search: 'hello world' } },
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
	].forEach(({ text, query: expectedQuery, options: expectedOptions }) => {
		it(`should parse ${JSON.stringify(text)}`, () => {
			const { query, options } = parseMessageSearchQuery(text, params);
			expect(query).to.deep.equal(expectedQuery);
			expect(options).to.deep.equal(expectedOptions);
		});
	});
});
