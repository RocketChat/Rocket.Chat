import LivechatVisitors from '../../../models/server/models/LivechatVisitors';
import { transformMappedData } from '../../lib/misc/transformMappedData';

export class AppVisitorsConverter {
	constructor(orch) {
		this.orch = orch;
	}

	convertById(id) {
		const visitor = LivechatVisitors.findOneById(id);

		return this.convertVisitor(visitor);
	}

	convertByToken(token) {
		const visitor = LivechatVisitors.getVisitorByToken(token);

		return this.convertVisitor(visitor);
	}

	convertVisitor(visitor) {
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
			...(visitor.visitorEmails && { visitorEmails: visitor.visitorEmails }),
			...(visitor.department && { department: visitor.department }),
		};

		return Object.assign(newVisitor, visitor._unmappedProperties_);
	}
}
