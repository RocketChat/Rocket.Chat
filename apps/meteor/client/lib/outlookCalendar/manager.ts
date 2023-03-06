/* eslint-disable new-cap */
import {
	ExchangeService,
	ExchangeVersion,
	WebCredentials,
	Uri,
	FolderId,
	CalendarView,
	DateTime,
	WellKnownFolderName,
} from 'ews-js-api-browser';
import type { Item, FindItemsResults } from 'ews-js-api-browser';

import { APIClient } from '../../../app/utils/client';

export class OutlookCalendarManager {
	private static _exchange: ExchangeService | null;

	protected static get exchange(): ExchangeService {
		if (!this._exchange) {
			this._exchange = new ExchangeService(ExchangeVersion.Exchange2013);

			this._exchange.Credentials = new WebCredentials(user, pass);
			this._exchange.Url = new Uri(server);
		}

		return this._exchange;
	}

	private static async findItems(startDate: Date, endDate: Date): Promise<FindItemsResults<Item>> {
		const folderId = new FolderId(WellKnownFolderName.Calendar);
		const view = new CalendarView(
			new DateTime(startDate.getFullYear(), startDate.getMonth() + 1, startDate.getDate()),
			new DateTime(endDate.getFullYear(), endDate.getMonth() + 1, endDate.getDate()),
		);

		return this.exchange.FindItems(folderId, view);
	}

	// private static async getItem(): Promise<void> {
	// 	this.exchange.GetItem()
	// }

	public static async sync(): Promise<void> {
		const date = (new Date()).getDateString();
		APIClient.get('/v1/calendar-events.list', { date:  })
	}
}
