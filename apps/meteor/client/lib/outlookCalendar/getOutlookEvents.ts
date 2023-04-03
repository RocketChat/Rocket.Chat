/* eslint-disable new-cap */
import type { Appointment, IXHROptions } from 'ews-js-api-browser';
import {
	ExchangeCredentials,
	ExchangeService,
	ExchangeVersion,
	Uri,
	FolderId,
	CalendarView,
	DateTime,
	WellKnownFolderName,
	PropertySet,
	BasePropertySet,
} from 'ews-js-api-browser';

class TokenCredentials extends ExchangeCredentials {
	constructor(private token: string) {
		super('', '');
	}

	PrepareWebRequest(request: IXHROptions): void {
		request.headers.Authorization = `Basic ${this.token}`;
	}
}

export const getOutlookEvents = async (date: Date, server: string, token: string): Promise<Appointment[]> => {
	const exchange = new ExchangeService(ExchangeVersion.Exchange2013);

	exchange.Credentials = new TokenCredentials(token);
	exchange.Url = new Uri(server);

	const folderId = new FolderId(WellKnownFolderName.Calendar);
	const view = new CalendarView(
		new DateTime(date.getFullYear(), date.getMonth() + 1, date.getDate()),
		new DateTime(date.getFullYear(), date.getMonth() + 1, date.getDate(), 23, 59, 59),
	);

	const appointments = (await exchange.FindAppointments(folderId, view)).Items as Appointment[];

	const propertySet = new PropertySet(BasePropertySet.FirstClassProperties);

	await exchange.LoadPropertiesForItems(appointments, propertySet);

	return appointments;
};
