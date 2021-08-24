import { Base } from './_Base';

class OutOfOfficeUsers extends Base {
	constructor() {
		super('outofoffice_users');

		this.tryEnsureIndex({ userId: 1 });
		this.tryEnsureIndex({ userId: 1, isEnabled: 1 }, { unique: true });
	}

	// insert
	createWithFullOutOfOfficeData(
		data: Omit<IOutOfOfficeUser, '_id'>,
	): Record<string, unknown> {
		return this.upsert({ userId: data.userId }, { $set: data });
	}

	// find
	findOneByUserId(userId: IOutOfOfficeUser['userId'], options = {}): IOutOfOfficeUser {
		return this.findOne({ userId }, options);
	}

	findEnabledByUserIds(userIds: string[]): Pick<IOutOfOfficeUser, '_id'|'customMessage'|'userId'>[] {
		return this.find({ userId: { $in: userIds }, isEnabled: true }, { fields: { customMessage: 1, userId: 1 } }).fetch();
	}

	// update
	setDisabled(userId: string): number {
		return this.update({ userId }, { $set: { isEnabled: false } });
	}
}

export interface IOutOfOfficeUser {
	_id: string;
	isEnabled: boolean;
	userId: string;
	roomIds: string[];
	customMessage: string;
	startDate: string;
	endDate: string;
}

export default new OutOfOfficeUsers();
