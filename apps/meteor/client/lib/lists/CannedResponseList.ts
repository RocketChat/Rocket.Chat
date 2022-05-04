import type { ILivechatDepartment, IOmnichannelCannedResponse } from '@rocket.chat/core-typings';

import { RecordList } from './RecordList';

export type CannedResponseOptions = {
	filter: string;
	type: string;
};

export class CannedResponseList extends RecordList<IOmnichannelCannedResponse & { departmentName: ILivechatDepartment['name'] }> {
	public constructor(private _options: CannedResponseOptions) {
		super();
	}

	public get options(): CannedResponseOptions {
		return this._options;
	}

	public updateFilters(options: CannedResponseOptions): void {
		this._options = options;
		this.clear();
	}
}
