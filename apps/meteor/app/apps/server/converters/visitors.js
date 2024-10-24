import { OmnichannelSourceType } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { transformMappedData } from './transformMappedData';

// TODO: check if functions from this converter can be async
export class AppVisitorsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	async convertById(id) {
		const visitor = await LivechatVisitors.findOneEnabledById(id);

		return this.convertVisitor(visitor);
	}

	async convertByIdAndSource(id, appId) {
		const visitor = await LivechatVisitors.findOneEnabledByIdAndSource({
			_id: id,
			sourceFilter: { 'source.type': OmnichannelSourceType.APP, 'source.id': appId },
		});

		return this.convertVisitor(visitor);
	}

	async convertByToken(token) {
		const visitor = await LivechatVisitors.getVisitorByToken(token);

		return this.convertVisitor(visitor);
	}

	async convertByTokenAndSource(token, appId) {
		const visitor = await LivechatVisitors.getVisitorByTokenAndSource({
			token,
			sourceFilter: { 'source.type': OmnichannelSourceType.APP, 'source.id': appId },
		});

		return this.convertVisitor(visitor);
	}

	async convertVisitor(visitor) {
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
			contactId: 'contactId',
			source: 'source',
		};

		return transformMappedData(visitor, map);
	}

	convertAppVisitor(visitor) {
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
			contactId: visitor.contactId,
			source: visitor.source,
			...(visitor.visitorEmails && { visitorEmails: visitor.visitorEmails }),
			...(visitor.department && { department: visitor.department }),
		};

		return Object.assign(newVisitor, visitor._unmappedProperties_);
	}
}
