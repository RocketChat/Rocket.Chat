import { ServiceClassInternal } from '@rocket.chat/core-services';
import type {
	AgentOverviewDataOptions,
	AnalyticsOverviewDataOptions,
	ChartDataOptions,
	IOmnichannelAnalyticsService,
} from '@rocket.chat/core-services';
import { LivechatRooms } from '@rocket.chat/models';
import { isValid, differenceInDays, addHours, endOfHour, endOfDay } from 'date-fns';

import { AgentOverviewData } from './AgentData';
import { ChartData } from './ChartData';
import { OverviewData } from './OverviewData';
import { serviceLogger } from './logger';
import { dayIterator, parseRangeInTimezone, formatHourInTimezone } from './utils';
import { getTimezone } from '../../../app/utils/server/lib/getTimezone';
import { callbacks } from '../../lib/callbacks';
import { i18n } from '../../lib/i18n';

const HOURS_IN_DAY = 24;

// TODO: move EE analytics to this service & remove callback usage
export class OmnichannelAnalyticsService extends ServiceClassInternal implements IOmnichannelAnalyticsService {
	protected name = 'omnichannel-analytics';

	readonly overview: OverviewData;

	readonly chart: ChartData;

	readonly agentOverview: AgentOverviewData;

	constructor() {
		super();
		this.overview = new OverviewData(LivechatRooms);
		this.chart = new ChartData(LivechatRooms);
		this.agentOverview = new AgentOverviewData(LivechatRooms);
	}

	async getAgentOverviewData(options: AgentOverviewDataOptions) {
		const { departmentId, utcOffset, daterange: { from: fDate, to: tDate } = {}, chartOptions: { name } = {}, executedBy } = options;
		const timezone = getTimezone({ utcOffset });
		const fromDate = parseRangeInTimezone(fDate || '', timezone).start;
		const toDate = parseRangeInTimezone(tDate || '', timezone).end;

		if (!isValid(fromDate) || !isValid(toDate)) {
			serviceLogger.error('AgentOverview -> Invalid dates');
			return;
		}

		if (!this.agentOverview.isActionAllowed(name)) {
			serviceLogger.error({ msg: 'AgentOverview action is not valid', name });
			return;
		}

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: executedBy });
		return this.agentOverview.callAction(name, fromDate, toDate, departmentId, extraQuery);
	}

	async getAnalyticsChartData(options: ChartDataOptions) {
		const {
			utcOffset,
			departmentId,
			daterange: { from: fDate, to: tDate } = {},
			chartOptions: { name: chartLabel },
			executedBy,
		} = options;

		// Check if function exists, prevent server error in case property altered
		if (!this.chart.isActionAllowed(chartLabel)) {
			serviceLogger.error({ msg: 'ChartData action is not valid', chartLabel });
			return;
		}

		const timezone = getTimezone({ utcOffset });
		const from = parseRangeInTimezone(fDate || '', timezone).start;
		const to = parseRangeInTimezone(tDate || '', timezone).end;

		if (!isValid(from) || !isValid(to)) {
			serviceLogger.error('ChartData -> Invalid dates');
			return;
		}

		const isSameDay = differenceInDays(to, from) === 0;

		const data: {
			chartLabel: string;
			dataLabels: string[];
			dataPoints: number[];
		} = {
			chartLabel,
			dataLabels: [],
			dataPoints: [],
		};

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: executedBy });
		if (isSameDay) {
			for (let hour = 0; hour < HOURS_IN_DAY; hour++) {
				const hourStart = addHours(from, hour);
				const hourEnd = endOfHour(hourStart);
				data.dataLabels.push(`${formatHourInTimezone(hour, timezone)}-${formatHourInTimezone(hour + 1, timezone)}`);

				const date = { gte: hourStart, lte: hourEnd };
				// eslint-disable-next-line no-await-in-loop
				data.dataPoints.push(await this.chart.callAction(chartLabel, date, departmentId, extraQuery));
			}
		} else {
			for await (const m of dayIterator(from, to)) {
				data.dataLabels.push(`${m.getUTCMonth() + 1}/${m.getUTCDate()}`);

				const date = { gte: m, lte: endOfDay(m) };
				data.dataPoints.push(await this.chart.callAction(chartLabel, date, departmentId, extraQuery));
			}
		}

		return data;
	}

	async getAnalyticsOverviewData(options: AnalyticsOverviewDataOptions) {
		const {
			departmentId,
			utcOffset = 0,
			language,
			daterange: { from: fDate, to: tDate } = {},
			analyticsOptions: { name } = {},
			executedBy,
		} = options;
		const timezone = getTimezone({ utcOffset });
		const from = parseRangeInTimezone(fDate || '', timezone).start;
		const to = parseRangeInTimezone(tDate || '', timezone).end;

		if (!isValid(from) || !isValid(to)) {
			serviceLogger.error('OverviewData -> Invalid dates');
			return;
		}

		if (!this.overview.isActionAllowed(name)) {
			serviceLogger.error({ msg: 'OverviewData action is not valid', name });
			return;
		}

		const t = i18n.getFixedT(language);

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {}, { userId: executedBy });
		return this.overview.callAction(name, from, to, departmentId, timezone, t, extraQuery);
	}
}
