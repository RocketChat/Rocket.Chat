import { IVisitor as IVisitorFromAppsEngine } from '@rocket.chat/apps-engine/definition/livechat';
import type { IVisitor } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

// TODO: check if functions from this converter can be async
export class AppVisitorsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(id: string):
		| (IVisitorFromAppsEngine & {
				_unmappedProperties_: unknown;
		  })
		| undefined {
		const visitor = Promise.await(LivechatVisitors.findOneById(id));

		if (!visitor) {
			throw new Error(`Visitor with id ${id} not found`);
		}

		return this.convertVisitor(visitor);
	}

	convertByToken(token: string):
		| (IVisitorFromAppsEngine & {
				_unmappedProperties_: unknown;
		  })
		| undefined {
		const visitor = Promise.await(LivechatVisitors.getVisitorByToken(token));

		if (!visitor) {
			throw new Error(`Visitor with token ${token} not found`);
		}

		return this.convertVisitor(visitor);
	}

	convertVisitor(visitor: IVisitor):
		| (IVisitorFromAppsEngine & {
				_unmappedProperties_: unknown;
		  })
		| undefined {
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
		};

		return transformMappedData(visitor, map) as
			| IVisitorFromAppsEngine & {
					_unmappedProperties_: unknown;
			  };
	}

	convertAppVisitor(visitor: IVisitorFromAppsEngine): IVisitor | undefined {
		if (!visitor) {
			return undefined;
		}

		return {
			_id: visitor.id,
			username: visitor.username,
			name: visitor.name,
			token: visitor.token,
			phone: visitor.phone,
			livechatData: visitor.livechatData,
			status: visitor.status || 'online',
			...(visitor.visitorEmails && { visitorEmails: visitor.visitorEmails }),
			...(visitor.department && { department: visitor.department }),
			...(visitor as any)._unmappedProperties_,
		};
	}
}
