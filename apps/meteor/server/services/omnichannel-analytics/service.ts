/* eslint-disable new-cap */
import { ServiceClassInternal } from '@rocket.chat/core-services';
import type {
	AgentOverviewDataOptions,
	AnalyticsOverviewDataOptions,
	ChartDataOptions,
	IOmnichannelAnalyticsService,
} from '@rocket.chat/core-services';
import { LivechatRooms } from '@rocket.chat/models';
import moment from 'moment-timezone';

import { getTimezone } from '../../../app/utils/server/lib/getTimezone';
import { callbacks } from '../../../lib/callbacks';
import { i18n } from '../../lib/i18n';
import { AgentOverviewData } from './AgentData';
import { ChartData } from './ChartData';
import { OverviewData } from './OverviewData';
import { serviceLogger } from './logger';
import { dayIterator } from './utils';

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
		const { departmentId, utcOffset, daterange: { from: fDate, to: tDate } = {}, chartOptions: { name } = {} } = options;
		const timezone = getTimezone({ utcOffset });
		const from = moment
			.tz(fDate || '', 'YYYY-MM-DD', timezone)
			.startOf('day')
			.utc();
		const to = moment
			.tz(tDate || '', 'YYYY-MM-DD', timezone)
			.endOf('day')
			.utc();

		if (!moment(from).isValid() || !moment(to).isValid()) {
			serviceLogger.error('AgentOverview -> Invalid dates');
			return;
		}

		if (!this.agentOverview.isActionAllowed(name)) {
			serviceLogger.error(`AgentOverview.${name} is not a valid action`);
			return;
		}

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		return this.agentOverview.callAction(name, from, to, departmentId, extraQuery);
	}

	async getAnalyticsChartData(options: ChartDataOptions) {
		const {
			utcOffset,
			departmentId,
			daterange: { from: fDate, to: tDate } = {},
			chartOptions: { name: chartLabel },
		} = options;

		// Check if function exists, prevent server error in case property altered
		if (!this.chart.isActionAllowed(chartLabel)) {
			serviceLogger.error(`ChartData.${chartLabel} is not a valid action`);
			return;
		}

		const timezone = getTimezone({ utcOffset });
		const from = moment
			.tz(fDate || '', 'YYYY-MM-DD', timezone)
			.startOf('day')
			.utc();
		const to = moment
			.tz(tDate || '', 'YYYY-MM-DD', timezone)
			.endOf('day')
			.utc();
		const isSameDay = from.diff(to, 'days') === 0;

		if (!moment(from).isValid() || !moment(to).isValid()) {
			serviceLogger.error('ChartData -> Invalid dates');
			return;
		}

		const data: {
			chartLabel: string;
			dataLabels: string[];
			dataPoints: number[];
		} = {
			chartLabel,
			dataLabels: [],
			dataPoints: [],
		};

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		if (isSameDay) {
			// data for single day
			const m = moment(from);
			for await (const currentHour of Array.from({ length: HOURS_IN_DAY }, (_, i) => i)) {
				const hour = parseInt(m.add(currentHour ? 1 : 0, 'hour').format('H'));
				const label = {
					from: moment.utc().set({ hour }).tz(timezone).format('hA'),
					to: moment.utc().set({ hour }).endOf('hour').tz(timezone).format('hA'),
				};
				data.dataLabels.push(`${label.from}-${label.to}`);

				const date = {
					gte: m.toDate(),
					lte: moment(m).endOf('hour').toDate(),
				};

				data.dataPoints.push(await this.chart.callAction(chartLabel, date, departmentId, extraQuery));
			}
		} else {
			for await (const m of dayIterator(from, to)) {
				data.dataLabels.push(m.format('M/D'));

				const date = {
					gte: m.toDate(),
					lte: moment(m).endOf('day').toDate(),
				};

				data.dataPoints.push(await this.chart.callAction(chartLabel, date, departmentId, extraQuery));
			}
		}

		return data;
	}

	async getAnalyticsOverviewData(options: AnalyticsOverviewDataOptions) {
		const { departmentId, utcOffset = 0, language, daterange: { from: fDate, to: tDate } = {}, analyticsOptions: { name } = {} } = options;
		const timezone = getTimezone({ utcOffset });
		const from = moment
			.tz(fDate || '', 'YYYY-MM-DD', timezone)
			.startOf('day')
			.utc();
		const to = moment
			.tz(tDate || '', 'YYYY-MM-DD', timezone)
			.endOf('day')
			.utc();

		if (!moment(from).isValid() || !moment(to).isValid()) {
			serviceLogger.error('OverviewData -> Invalid dates');
			return;
		}

		if (!this.overview.isActionAllowed(name)) {
			serviceLogger.error(`OverviewData.${name} is not a valid action`);
			return;
		}

		const t = (s: string) => i18n.t(s, { lng: language });

		const extraQuery = await callbacks.run('livechat.applyRoomRestrictions', {});
		return this.overview.callAction(name, from, to, departmentId, timezone, t, extraQuery);
	}
}
