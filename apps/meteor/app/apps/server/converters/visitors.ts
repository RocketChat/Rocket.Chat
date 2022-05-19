import type { IVisitor } from '@rocket.chat/core-typings';

import LivechatVisitors from '../../../models/server/models/LivechatVisitors';
import { transformMappedData } from '../../lib/misc/transformMappedData';
import { AppServerOrchestrator } from '../orchestrator';

export class AppVisitorsConverter {
	orch: AppServerOrchestrator;

	constructor(orch: AppServerOrchestrator) {
		this.orch = orch;
	}

	convertById(id: string):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
		const visitor = LivechatVisitors.findOneById(id);

		return this.convertVisitor(visitor);
	}

	convertByToken(token: string):
		| {
				_unmappedProperties_: unknown;
		  }
		| undefined {
		const visitor = LivechatVisitors.getVisitorByToken(token, {});

		return this.convertVisitor(visitor);
	}

	convertVisitor(visitor: IVisitor):
		| {
				_unmappedProperties_: unknown;
		  }
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

		return transformMappedData(visitor, map);
	}

	convertAppVisitor(visitor: IVisitor): unknown {
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
		};

		return Object.assign(newVisitor, visitor._unmappedProperties_);
	}
}
