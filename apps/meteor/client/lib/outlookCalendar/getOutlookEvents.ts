/* eslint-disable new-cap */
import type { Appointment } from 'ews-js-api-browser';
import {
	ExchangeService,
	ExchangeVersion,
	WebCredentials,
	Uri,
	FolderId,
	CalendarView,
	DateTime,
	WellKnownFolderName,
	PropertySet,
	BasePropertySet,
} from 'ews-js-api-browser';

// #ToDo: Remove this line
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

export const getOutlookEvents = async (date: Date, server: string, user: string, password: string): Promise<Appointment[]> => {
	const exchange = new ExchangeService(ExchangeVersion.Exchange2013);

	exchange.Credentials = new WebCredentials(user, password);
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
