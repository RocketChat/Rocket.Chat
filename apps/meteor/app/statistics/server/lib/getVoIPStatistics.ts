import { log } from 'console';

import type { IStats, IVoIPPeriodStats } from '@rocket.chat/core-typings';
import { FreeSwitchCall } from '@rocket.chat/models';
import { MongoInternals } from 'meteor/mongo';

import { readSecondaryPreferred } from '../../../../server/database/readSecondaryPreferred';

const { db } = MongoInternals.defaultRemoteCollectionDriver().mongo;

const getMinDate = (days?: number): Date | undefined => {
	if (!days) {
		return;
	}

	const date = new Date();
	date.setDate(date.getDate() - days);

	return date;
};

async function getVoIPStatisticsForPeriod(days?: number): Promise<IVoIPPeriodStats> {
	const promises: Array<Promise<number | void>> = [];
	const options = {
		readPreference: readSecondaryPreferred(db),
	};

	const minDate = getMinDate(days);

	const statistics: IVoIPPeriodStats = {};

	promises.push(
		FreeSwitchCall.countCallsByDirection('internal', minDate, options).then((count) => {
			statistics.internalCalls = count;
		}),
	);
	promises.push(
		FreeSwitchCall.countCallsByDirection('external_inbound', minDate, options).then((count) => {
			statistics.externalInboundCalls = count;
		}),
	);
	promises.push(
		FreeSwitchCall.countCallsByDirection('external_outbound', minDate, options).then((count) => {
			statistics.externalOutboundCalls = count;
		}),
	);

	promises.push(
		FreeSwitchCall.sumCallsDuration(minDate, options).then((callsDuration) => {
			statistics.callsDuration = callsDuration;
		}),
	);

	promises.push(
		FreeSwitchCall.countCallsBySuccessState(true, minDate, options).then((count) => {
			statistics.successfulCalls = count;
		}),
	);

	promises.push(
		FreeSwitchCall.countCallsBySuccessState(false, minDate, options).then((count) => {
			statistics.failedCalls = count;
		}),
	);

	await Promise.allSettled(promises).catch(log);

	statistics.externalCalls = (statistics.externalInboundCalls || 0) + (statistics.externalOutboundCalls || 0);
	statistics.calls = (statistics.successfulCalls || 0) + (statistics.failedCalls || 0);

	return statistics;
}

export async function getVoIPStatistics(): Promise<IStats['enterprise']['voip']> {
	const statistics: IStats['enterprise']['voip'] = {};

	const promises = [
		getVoIPStatisticsForPeriod().then((total) => {
			statistics.total = total;
		}),
		getVoIPStatisticsForPeriod(30).then((month) => {
			statistics.lastMonth = month;
		}),
		getVoIPStatisticsForPeriod(7).then((week) => {
			statistics.lastWeek = week;
		}),
		getVoIPStatisticsForPeriod(1).then((day) => {
			statistics.lastDay = day;
		}),
	];

	await Promise.allSettled(promises).catch(log);

	return statistics;
}
