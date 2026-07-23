import type { IAppServerOrchestrator, IAppVisitorsConverter, IAppsVisitor } from '@rocket.chat/apps';
import type { ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

// TODO: check if functions from this converter can be async
export class AppVisitorsConverter implements IAppVisitorsConverter {
	constructor(protected readonly orch: IAppServerOrchestrator) {
		this.orch = orch;
	}

	async convertById(id: ILivechatVisitor['_id']): Promise<IAppsVisitor | undefined> {
		const visitor = await LivechatVisitors.findOneEnabledById(id);

		return this.convertVisitor(visitor);
	}

	async convertByToken(token: string): Promise<IAppsVisitor | undefined> {
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		return this.convertVisitor(visitor);
	}

	async convertVisitor(visitor: undefined | null): Promise<undefined>;

	async convertVisitor(visitor: ILivechatVisitor): Promise<IAppsVisitor>;

	async convertVisitor(visitor: ILivechatVisitor | undefined | null): Promise<IAppsVisitor | undefined>;

	async convertVisitor(visitor: ILivechatVisitor | undefined | null): Promise<IAppsVisitor | undefined> {
		if (!visitor) {
			return undefined;
		}

		const map = {
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
		} as const;

		return transformMappedData(visitor, map) as unknown as Promise<IAppsVisitor>;
	}

	convertAppVisitor(visitor: undefined | null): undefined;

	convertAppVisitor(visitor: IAppsVisitor): ILivechatVisitor;

	convertAppVisitor(visitor: IAppsVisitor | undefined | null): ILivechatVisitor | undefined;

	convertAppVisitor(visitor: IAppsVisitor | undefined | null): ILivechatVisitor | undefined {
		if (!visitor) {
			return undefined;
		}

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
	}
}
