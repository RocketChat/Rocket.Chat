import type { IAppsVisitor } from '@rocket.chat/apps';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import * as z from 'zod';

import { mappedDecode } from './mappedData';

/**
 * Rocket.Chat `ILivechatVisitor` <-> Apps-Engine `IAppsVisitor`.
 *
 * `decode` is a plain field-rename with an `_unmappedProperties_` bucket (mirrors the legacy
 * `convertVisitor`). `encode` is bespoke: it mirrors `convertAppVisitor`, which defaults `status`,
 * includes `visitorEmails`/`department`/`externalIds` only when truthy, deliberately does **not**
 * write `_updatedAt`/`activity` back, and merges `_unmappedProperties_`.
 */
export const VisitorCodec = z.codec(z.custom<ILivechatVisitor>(), z.custom<IAppsVisitor>(), {
	decode: mappedDecode<ILivechatVisitor>({
		id: '_id',
		username: 'username',
		name: 'name',
		department: 'department',
		updatedAt: '_updatedAt',
		token: 'token',
		phone: 'phone',
		visitorEmails: 'visitorEmails',
		livechatData: 'livechatData',
		status: 'status',
		activity: 'activity',
		externalIds: 'externalIds',
	}) as unknown as (visitor: ILivechatVisitor) => IAppsVisitor,
	encode: (visitor): ILivechatVisitor => {
		const newVisitor = {
			_id: visitor.id,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
			phone: visitor.phone,
			livechatData: visitor.livechatData,
			status: visitor.status || 'online',
			...(visitor.visitorEmails && { visitorEmails: visitor.visitorEmails }),
			...(visitor.department && { department: visitor.department }),
			...(visitor.externalIds && { externalIds: visitor.externalIds }),
		};

		return Object.assign(
			newVisitor,
			(visitor as { _unmappedProperties_?: Record<string, unknown> })._unmappedProperties_,
		) as unknown as ILivechatVisitor;
	},
});
