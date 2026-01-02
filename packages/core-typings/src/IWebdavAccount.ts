import * as z from 'zod';

import { IRocketChatRecordSchema } from './IRocketChatRecord';

export const IWebdavAccountSchema = IRocketChatRecordSchema.extend({
	userId: z.string(),
	serverURL: z.string(),
	username: z.string(),
	password: z.string().optional(),
	name: z.string(),
});

export const IWebdavAccountIntegrationSchema = IWebdavAccountSchema.pick({
	_id: true,
	serverURL: true,
	username: true,
	name: true,
});

export const IWebdavAccountPayloadSchema = IWebdavAccountSchema.pick({
	serverURL: true,
	password: true,
	name: true,
}).and(
	IWebdavAccountSchema.partial().pick({
		username: true,
	}),
);

export const IWebdavNodeSchema = z.object({
	basename: z.string(),
	etag: z.string().nullable(),
	filename: z.string(),
	lastmod: z.string(),
	mime: z.string().optional(),
	size: z.number(),
	type: z.enum(['file', 'directory']),
});

export interface IWebdavAccount extends z.infer<typeof IWebdavAccountSchema> {}
export interface IWebdavAccountIntegration extends z.infer<typeof IWebdavAccountIntegrationSchema> {}
export interface IWebdavAccountPayload extends z.infer<typeof IWebdavAccountPayloadSchema> {}
export interface IWebdavNode extends z.infer<typeof IWebdavNodeSchema> {}
