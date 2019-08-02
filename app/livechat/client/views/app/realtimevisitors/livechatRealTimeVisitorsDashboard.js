import { Template } from 'meteor/templating';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import moment from 'moment';

import { drawDoughnutChart, updateChart } from '../../../lib/chartHandler';
import { LivechatRoom } from '../../../collections/LivechatRoom';
import { getSessionOverviewData } from '../../../lib/dataHandler';
import { updateDateRange } from '../../../lib/dateHandler';
import { setTimeRange } from '../../../lib/timeHandler';
import { visitorNavigationHistory } from '../../../collections/LivechatVisitorNavigation';
import { LivechatLocation } from '../../../collections/LivechatLocation';
import { RocketChatTabBar, popover } from '../../../../../ui-utils';
import { t } from '../../../../../utils';

import './livechatRealTimeVisitorsDashboard.html';

let chartContexts = {};
let templateInstance;

const timeFilter = ['last-thirty-minutes', 'last-hour', 'last-six-hour', 'last-twelve-hour'];

const initChart = {
	'lc-status-chart'() {
		return drawDoughnutChart(
			document.getElementById('lc-status-chart'),
			'Status',
			chartContexts['lc-status-chart'],
			['Chatting', 'Closed', 'Not Started'], [0, 0, 0]);
	},
};

const initAllCharts = () => {
	chartContexts['lc-status-chart'] = initChart['lc-status-chart']();
};

const updateChartData = (chartId, label, data) => {
	// update chart
	if (!chartContexts[chartId]) {
		chartContexts[chartId] = initChart[chartId]();
	}

	updateChart(chartContexts[chartId], label, data);
};

const updateChatsChart = () => {
	const createdAt = {
		$gte: moment().startOf('day').toDate(),
		$lte: moment().endOf('day').toDate(),
	};
	const chats = {
		chatting: LivechatLocation.find({ chatStatus: 'Chatting', createdAt }).count(),
		closed: LivechatLocation.find({ chatStatus: 'Closed', createdAt }).count(),
		notStarted: LivechatLocation.find({ chatStatus: 'Not Started', createdAt }).count(),
	};

	updateChartData('lc-status-chart', 'Chatting', [chats.chatting]);
	updateChartData('lc-status-chart', 'Closed', [chats.closed]);
	updateChartData('lc-status-chart', 'Not Started', [chats.notStarted]);
};

const updateSessionOverviews = () => {
	const createdAt = {
		$gte: moment().startOf('day').toDate(),
		$lte: moment().endOf('day').toDate(),
	};
	const data = getSessionOverviewData(LivechatLocation.find({ createdAt }));

	templateInstance.sessionOverview.set(data);
};

const chunkArray = (arr, chunkCount) => {	// split array into n almost equal arrays
	const chunks = [];
	while (arr.length) {
		const chunkSize = Math.ceil(arr.length / chunkCount--);
		const chunk = arr.slice(0, chunkSize);
		chunks.push(chunk);
		arr = arr.slice(chunkSize);
	}
	return chunks;
};

Template.livechatDashboard.helpers({
	visitors() {
		return Template.instance().users.get();
	},
	totalVisitors() {
		return Template.instance().users.get().length;
	},
	flexData() {
		return {
			tabBar: Template.instance().tabBar,
			data: Template.instance().tabBarData.get(),
		};
	},
	timerange() {
		return Template.instance().timerange.get();
	},
	showLeftNavButton() {
		const { value } = Template.instance().timerange.get();
		if (value === 'custom' || timeFilter.includes(value)) {
			return false;
		}
		return true;
	},
	showRightNavButton() {
		const { value } = Template.instance().timerange.get();
		if (value === 'custom' || value === 'today' || value === 'this-week' || value === 'this-month' || timeFilter.includes(value)) {
			return false;
		}
		return true;
	},
	sessionOverview() {
		const data = Template.instance().sessionOverview.get();
		if (!data) {
			const send = [{
				title: 'Online Visitors',
				value: '-',
			}, {
				title: 'Average Time on Site',
				value: '-',
			},
			{
				title: 'Busiest Chat Time',
				value: '-',
			}];
			return chunkArray(send, 2);
		}
		return chunkArray(data, 2);
	},
});

Template.livechatDashboard.events({
	'click .row-link'(e, instance) {
		instance.tabBarData.set(this);
		instance.tabBar.setTemplate('visitorSession');
		instance.tabBar.setData({ label: t('Session_Info'), icon: 'info-circled' });
		instance.tabBar.open();
	},
	'click .lc-time-picker-btn'(e) {
		e.preventDefault();
		const options = [];
		const config = {
			template: 'livechatRealTimeVisitorsTimeRange',
			currentTarget: e.currentTarget,
			data: {
				options,
				timerange: Template.instance().timerange,
			},
			offsetVertical: e.currentTarget.clientHeight + 10,
		};
		popover.open(config);
	},
	'click .lc-timerange-prev'(e) {
		e.preventDefault();

		Template.instance().timerange.set(updateDateRange(Template.instance().timerange.get(), -1));
	},
	'click .lc-timerange-next'(e) {
		e.preventDefault();

		Template.instance().timerange.set(updateDateRange(Template.instance().timerange.get(), 1));
	},
	'submit form'(event, instance) {
		event.preventDefault();

		const filter = {};
		$(':input', event.currentTarget).each(function() {
			if (this.name) {
				filter[this.name] = $(this).val();
			}
		});

		instance.filter.set(filter);
		instance.limit.set(20);
	},
});

Template.livechatDashboard.onRendered(function() {
	chartContexts = {};
	templateInstance = Template.instance();
	initAllCharts();

	this.autorun(() => {
		const { from, to, value } = Template.instance().timerange.get();
		if (timeFilter.includes(value)) {
			this.filter.set({
				fromTime: moment(from, 'Do, hh:mm a').toISOString(),
				toTime: moment(to, 'Do, hh:mm a').toISOString(),
				valueTime: value,
			});
		} else {
			this.filter.set({
				fromTime: moment(from, 'MMM D YYYY').toISOString(),
				toTime: moment(to, 'MMM D YYYY').toISOString(),
				valueTime: value,
			});
		}
	});
});

Template.livechatDashboard.onCreated(function() {
	this.ready = new ReactiveVar(false);
	this.limit = new ReactiveVar(20);
	this.filter = new ReactiveVar({});
	this.users = new ReactiveVar([]);
	this.tabBar = new RocketChatTabBar();
	this.tabBarData = new ReactiveVar();
	this.tabBar.showGroup(FlowRouter.current().route.name);
	this.sessionOverview = new ReactiveVar();

	this.timerange = new ReactiveVar({});
	this.autorun(() => {
		Template.instance().timerange.set(setTimeRange());
	});

	this.autorun(() => {
		this.ready.set(this.subscribe('livechat:rooms', {}, 0, this.limit.get()).ready());
	});

	this.autorun(() => {
		const sub = this.subscribe('livechat:location', this.filter.get());
		if (sub.ready()) {
			const users = LivechatLocation.find({}, { sort: { createdAt: -1 } }).map((data) => data);
			if (users && users.length > 0) {
				users.map((val) => {
					const currentTime = moment();
					val.sessionStarted = moment(val.createdAt).format('MMM Do hh:mm a');
					if (val.offlineTime) {
						const duration = moment.duration(currentTime.diff(val.offlineTime));
						const hours = duration.get('hours');
						const days = duration.get('d');
						if (days >= 1) {
							val.timeSince = `${ days }d`;
						} else {
							val.timeSince = `${ hours }h:${ duration.get('minutes') }m:${ duration.get('seconds') }s`;
						}
					} else {
						const duration = moment.duration(currentTime.diff(val.chatStartTime));
						const hours = duration.get('hours');
						const days = duration.get('d');
						if (days >= 1) {
							val.timeSince = `${ days }d`;
						} else {
							val.timeSince = `${ hours }h:${ duration.get('minutes') }m:${ duration.get('seconds') }s`;
						}
					}

					this.subscribe('livechat:visitorPageVisited', { rid: '', token: val.token });
					const pageInfo = visitorNavigationHistory.find({ token: val.token }, { sort: { ts: -1 } }).map((data) => data);
					if (pageInfo) {
						val.pageInfo = pageInfo;
					}

					const room = LivechatRoom.find({ t: 'l', 'v.token': val.token }, { sort: { ts: -1 } }).map((data) => data)[0];
					if (room && room.servedBy) {
						val.servedBy = room.servedBy;
					}

					if (room && room.open) {
						val.chatStatus = 'Chatting';
					} else if (room && room.closedAt) {
						val.chatStatus = 'Closed';
					} else {
						val.chatStatus = 'Not Started';
					}
					if (['Macintosh', 'iPhone', 'iPad'].indexOf(val.deviceInfo.os) !== -1) {
						val.osIcon = 'icon-apple';
					} else {
						val.osIcon = `icon-${ val.deviceInfo.os.toLowerCase() }`;
					}
					val.browserIcon = `icon-${ val.deviceInfo.browserName.toLowerCase() }`;

					return val;
				});
			}
			this.users.set(users);
		}
	});

	const updateSessionDashboard = (fields) => {
		if (fields.chatStatus) {
			updateChatsChart();
		}
		updateSessionOverviews();
	};

	LivechatLocation.find().observeChanges({
		changed(id, fields) {
			updateSessionDashboard(fields);
		},
		added(id, fields) {
			updateSessionDashboard(fields);
		},
	});
});
