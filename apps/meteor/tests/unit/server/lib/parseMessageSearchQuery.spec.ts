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
			text: 'file-title:title',
			query: { 'attachments.title': { $regex: 'title', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:description',
			query: {
				'attachments.description': { $regex: 'description', $options: 'i' },
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:"description"',
			query: {
				'attachments.description': { $regex: 'description', $options: 'i' },
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-title:"monthly report"',
			query: {
				'attachments.title': { $regex: 'monthly report', $options: 'i' },
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:отчет follow-up needed',
			query: {
				'attachments.description': { $regex: 'отчет', $options: 'i' },
				'$text': { $search: 'follow-up needed' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-title:"🚀 launch plan" notes later',
			query: {
				'attachments.title': { $regex: '🚀 launch plan', $options: 'i' },
				'$text': { $search: 'notes later' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'notes later file-title:"🚀 launch plan"',
			query: {
				'attachments.title': { $regex: '🚀 launch plan', $options: 'i' },
				'$text': { $search: 'notes later' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:report2024 file-title:Q1-review pending',
			query: {
				'attachments.description': { $regex: 'report2024', $options: 'i' },
				'attachments.title': { $regex: 'Q1\\-review', $options: 'i' },
				'$text': { $search: 'pending' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:"中 文 测 试" file-title:"报 表" 其他内容',
			query: {
				'attachments.description': { $regex: '中 文 测 试', $options: 'i' },
				'attachments.title': { $regex: '报 表', $options: 'i' },
				'$text': { $search: '其他内容' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:отчет file-title:"финансовый план" завершено',
			query: {
				'attachments.description': { $regex: 'отчет', $options: 'i' },
				'attachments.title': { $regex: 'финансовый план', $options: 'i' },
				'$text': { $search: 'завершено' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-title:"🔥 final version" confirm now',
			query: {
				'attachments.title': { $regex: '🔥 final version', $options: 'i' },
				'$text': { $search: 'confirm now' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'file-desc:"launch" from:username new plans',
			query: {
				'attachments.description': { $regex: 'launch', $options: 'i' },
				'u.username': { $regex: 'username', $options: 'i' },
				'$text': { $search: 'new plans' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'mention:someone file-desc:"budget 💰" file update',
			query: {
				'attachments.description': { $regex: 'budget 💰', $options: 'i' },
				'mentions.username': { $regex: 'someone', $options: 'i' },
				'$text': { $search: 'file update' },
			},
			options: { projection: { score: { $meta: 'textScore' } }, sort: { ts: -1 }, skip: 0, limit: 20 },
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
		{
			text: 'field-title:status',
			query: { 'attachments.fields.title': { $regex: 'status', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'field-value:completed',
			query: { 'attachments.fields.value': { $regex: 'completed', $options: 'i' } },
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'field:"urgent"',
			query: {
				$or: [
					{ 'attachments.fields.title': { $regex: 'urgent', $options: 'i' } },
					{ 'attachments.fields.value': { $regex: 'urgent', $options: 'i' } },
				],
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'field-title:"Alert Type" field-value:"Critical"',
			query: {
				'attachments.fields.title': { $regex: 'Alert Type', $options: 'i' },
				'attachments.fields.value': { $regex: 'Critical', $options: 'i' },
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
		{
			text: 'field:production from:gitlab',
			query: {
				$or: [
					{ 'attachments.fields.title': { $regex: 'production', $options: 'i' } },
					{ 'attachments.fields.value': { $regex: 'production', $options: 'i' } },
				],
				'u.username': { $regex: 'gitlab', $options: 'i' },
			},
			options: { projection: {}, sort: { ts: -1 }, skip: 0, limit: 20 },
		},
	].forEach(({ text, query: expectedQuery, options: expectedOptions }) => {
		it(`should parse ${JSON.stringify(text)}`, () => {
			const { query, options } = parseMessageSearchQuery(text, params);
			expect(query).to.deep.equal(expectedQuery);
			expect(options).to.deep.equal(expectedOptions);
		});
	});
});
