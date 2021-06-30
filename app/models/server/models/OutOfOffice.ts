import { Base } from './_Base';

class OutOfOffice extends Base {
	constructor() {
		super('OutOfOffice');
	}

	// insert
	createWithFullOutOfOfficeData(
		data: Omit<IOutOfOffice, '_id'>,
	): Record<string, unknown> {
		return this.upsert({ userId: data.userId }, { ...data });
	}

	// find
	findOneByUserId(userId: IOutOfOffice['userId'], options = {}): IOutOfOffice {
		return this.findOne({ userId }, options);
	}

	// update
	setDataWhenEnabled(
		docId: string,
		{
			roomIds,
			customMessage,
			startDate,
			endDate,
		}: Pick<IOutOfOffice, 'roomIds' | 'customMessage' | 'startDate' | 'endDate'>,
	): string {
		return this.update(
			{
				_id: docId,
			},
			{
				$set: {
					roomIds,
					customMessage,
					startDate,
					endDate,
					isEnabled: true,
				},
			},
		);
	}

	setDisabled(userId: string): number {
		return this.update({ userId }, { $set: { isEnabled: false } });
	}
}

export interface IOutOfOffice {
	_id: string;
	isEnabled: boolean;
	userId: string;
	roomIds: string[];
	customMessage: string;
	sentRoomIds: string[];
	startDate: Date;
	endDate: Date;
}

export default new OutOfOffice();
