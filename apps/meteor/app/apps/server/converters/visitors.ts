import type { IAppServerOrchestrator, IAppsVisitor, IAppVisitorsConverter } from '@rocket.chat/apps';
import { UserStatus, type ILivechatVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

// TODO: check if functions from this converter can be async
export class AppVisitorsConverter implements IAppVisitorsConverter {
	constructor(public orch: IAppServerOrchestrator) {}

	async convertById(visitorId: ILivechatVisitor['_id']): Promise<IAppsVisitor | undefined> {
		const visitor = await LivechatVisitors.findOneEnabledById(visitorId);

		return this.convertVisitor(visitor);
	}

	async convertByToken(token: string): Promise<IAppsVisitor | undefined> {
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		return this.convertVisitor(visitor);
	}

	convertVisitor(visitor: undefined | null): Promise<undefined>;

	convertVisitor(visitor: ILivechatVisitor): Promise<IAppsVisitor>;

	convertVisitor(visitor: ILivechatVisitor | undefined | null): Promise<IAppsVisitor | undefined>;

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
		};

		return transformMappedData(visitor, map);
	}

	convertAppVisitor(visitor: undefined | null): undefined;

	convertAppVisitor(visitor: IAppsVisitor): ILivechatVisitor;

	convertAppVisitor(visitor: IAppsVisitor | undefined | null): ILivechatVisitor | undefined;

	convertAppVisitor(visitor: IAppsVisitor | undefined | null): ILivechatVisitor | undefined {
		if (!visitor) {
			return undefined;
		}

		const newVisitor: Partial<ILivechatVisitor> = {
			_id: visitor.id!,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
			phone: visitor.phone,
			livechatData: visitor.livechatData,
			status: (visitor.status as UserStatus | undefined) || UserStatus.ONLINE,
			...(visitor.visitorEmails && { visitorEmails: visitor.visitorEmails }),
			...(visitor.department && { department: visitor.department }),
		};

		return Object.assign(newVisitor, (visitor as { _unmappedProperties?: any })._unmappedProperties);
	}
}
