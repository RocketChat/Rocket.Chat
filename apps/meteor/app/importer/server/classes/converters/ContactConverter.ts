import type { IImportContact, IImportContactRecord } from '@rocket.chat/core-typings';
import { LivechatVisitors } from '@rocket.chat/models';

import { RecordConverter } from './RecordConverter';
import { createContact } from '../../../../livechat/server/lib/contacts/createContact';
import { getAllowedCustomFields } from '../../../../livechat/server/lib/contacts/getAllowedCustomFields';
import { validateCustomFields } from '../../../../livechat/server/lib/contacts/validateCustomFields';

export class ContactConverter extends RecordConverter<IImportContactRecord> {
	protected async convertCustomFields(customFields: IImportContact['customFields']): Promise<IImportContact['customFields']> {
		if (!customFields) {
			return;
		}

		const allowedCustomFields = await getAllowedCustomFields();
		return validateCustomFields(allowedCustomFields, customFields, { ignoreAdditionalFields: true });
	}

	protected async convertRecord(record: IImportContactRecord): Promise<boolean> {
		const { data } = record;

		await createContact({
			name: data.name || (await this.generateNewContactName()),
			emails: data.emails,
			phones: data.phones,
			customFields: await this.convertCustomFields(data.customFields),
			contactManager: await this._cache.getIdOfUsername(data.contactManager),
			unknown: false,
			importIds: data.importIds,
		});

		return true;
	}

	protected async generateNewContactName(): Promise<string> {
		return LivechatVisitors.getNextVisitorUsername();
	}

	protected getDataType(): 'contact' {
		return 'contact';
	}
}
