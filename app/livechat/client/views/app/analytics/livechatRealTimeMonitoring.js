import { Mongo } from 'meteor/mongo';
import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';

import { drawLineChart, drawDoughnutChart, updateChart } from '../../../lib/chartHandler';
import { getTimingsChartData, getAgentStatusData } from '../../../lib/dataHandler';
import { LivechatMonitoring } from '../../../collections/LivechatMonitoring';
import { AgentUsers } from '../../../collections/AgentUsers';
import { LivechatDepartment } from '../../../collections/LivechatDepartment';
import { APIClient } from '../../../../../utils/client';
import './livechatRealTimeMonitoring.html';

let chartContexts = {};			// stores context of current chart, used to clean when redrawing
let templateInstance;

const LivechatVisitors = new Mongo.Collection('livechatVisitors');

const initChart = {
	'lc-chats-chart'() {
		return drawDoughnutChart(
			document.getElementById('lc-chats-chart'),
			'Chats',
			chartContexts['lc-chats-chart'],
			['Open', 'Queue', 'Closed'], [0, 0, 0]);
	},

	'lc-agents-chart'() {
		return drawDoughnutChart(
			document.getElementById('lc-agents-chart'),
			'Agents',
			chartContexts['lc-agents-chart'],
			['Available', 'Away', 'Busy', 'Offline'], [0, 0, 0, 0]);
	},

	'lc-chats-per-agent-chart'() {
		return drawLineChart(
			document.getElementById('lc-chats-per-agent-chart'),
			chartContexts['lc-chats-per-agent-chart'],
			['Open', 'Closed'],
			[], [[], []], { legends: true, anim: true, smallTicks: true });
	},

	'lc-chats-per-dept-chart'() {
		if (!document.getElementById('lc-chats-per-dept-chart')) {
			return null;
		}

		return drawLineChart(
			document.getElementById('lc-chats-per-dept-chart'),
			chartContexts['lc-chats-per-dept-chart'],
			['Open', 'Closed'],
			[], [[], []], { legends: true, anim: true, smallTicks: true });
	},

	'lc-reaction-response-times-chart'() {
		const timingLabels = [];
		const initData = [];
		const today = moment().startOf('day');
		for (let m = today; m.diff(moment(), 'hours') < 0; m.add(1, 'hours')) {
			const hour = m.format('H');
			timingLabels.push(`${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour) + 1) % 24, ['H']).format('hA') }`);
			initData.push(0);
		}

		return drawLineChart(
			document.getElementById('lc-reaction-response-times-chart'),
			chartContexts['lc-reaction-response-times-chart'],
			['Avg_reaction_time', 'Longest_reaction_time', 'Avg_response_time', 'Longest_response_time'],
			timingLabels.slice(),
			[initData.slice(), initData.slice(), initData.slice(), initData.slice()], { legends: true, anim: true, smallTicks: true });
	},

	'lc-chat-duration-chart'() {
		const timingLabels = [];
		const initData = [];
		const today = moment().startOf('day');
		for (let m = today; m.diff(moment(), 'hours') < 0; m.add(1, 'hours')) {
			const hour = m.format('H');
			timingLabels.push(`${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour) + 1) % 24, ['H']).format('hA') }`);
			initData.push(0);
		}

		return drawLineChart(
			document.getElementById('lc-chat-duration-chart'),
			chartContexts['lc-chat-duration-chart'],
			['Avg_chat_duration', 'Longest_chat_duration'],
			timingLabels.slice(),
			[initData.slice(), initData.slice()], { legends: true, anim: true, smallTicks: true });
	},
};

const initAllCharts = () => {
	chartContexts['lc-chats-chart'] = initChart['lc-chats-chart']();
	chartContexts['lc-agents-chart'] = initChart['lc-agents-chart']();
	chartContexts['lc-chats-per-agent-chart'] = initChart['lc-chats-per-agent-chart']();
	chartContexts['lc-chats-per-dept-chart'] = initChart['lc-chats-per-dept-chart']();
	chartContexts['lc-reaction-response-times-chart'] = initChart['lc-reaction-response-times-chart']();
	chartContexts['lc-chat-duration-chart'] = initChart['lc-chat-duration-chart']();
};

const updateChartData = (chartId, label, data) => {
	// update chart
	if (!chartContexts[chartId]) {
		chartContexts[chartId] = initChart[chartId]();
	}

	updateChart(chartContexts[chartId], label, data);
};

const metricsUpdated = (ts) => {
	const hour = moment(ts).format('H');
	const label = `${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour) + 1) % 24, ['H']).format('hA') }`;

	const query = {
		ts: {
			$gte: new Date(moment(ts).startOf('hour')),
			$lt: new Date(moment(ts).add(1, 'hours').startOf('hour')),
		},
	};

	const data = getTimingsChartData(LivechatMonitoring.find(query));

	updateChartData('lc-reaction-response-times-chart', label, [data.reaction.avg, data.reaction.longest, data.response.avg, data.response.longest]);
	updateChartData('lc-chat-duration-chart', label, [data.chatDuration.avg, data.chatDuration.longest]);
};

const updateDepartmentsChart = (departmentId) => {
	if (departmentId) {
		// update for dept
		const label = LivechatDepartment.findOne({ _id: departmentId }).name;

		const data = {
			open: LivechatMonitoring.find({ departmentId, open: true }).count(),
			closed: LivechatMonitoring.find({ departmentId, open: { $exists: false } }).count(),
		};

		updateChartData('lc-chats-per-dept-chart', label, [data.open, data.closed]);
	} else {
		// update for all
		LivechatDepartment.find({ enabled: true }).forEach(function(dept) {
			updateDepartmentsChart(dept._id);
		});
	}
};

const updateAgentsChart = (agent) => {
	if (agent) {
		// update for the agent
		const data = {
			open: LivechatMonitoring.find({ 'servedBy.username': agent, open: true }).count(),
			closed: LivechatMonitoring.find({ 'servedBy.username': agent, open: { $exists: false } }).count(),
		};

		updateChartData('lc-chats-per-agent-chart', agent, [data.open, data.closed]);
	} else {
		// update for all agents
		AgentUsers.find().forEach(function(agent) {
			if (agent.username) {
				updateAgentsChart(agent.username);
			}
		});
	}
};

const updateAgentStatusChart = () => {
	const statusData = getAgentStatusData(AgentUsers.find());

	updateChartData('lc-agents-chart', 'Offline', [statusData.offline]);
	updateChartData('lc-agents-chart', 'Available', [statusData.available]);
	updateChartData('lc-agents-chart', 'Away', [statusData.away]);
	updateChartData('lc-agents-chart', 'Busy', [statusData.busy]);
};

const updateChatsChart = () => {
	const chats = {
		open: LivechatMonitoring.find({ 'metrics.chatDuration': { $exists: false }, servedBy: { $exists: true } }).count(),
		closed: LivechatMonitoring.find({ 'metrics.chatDuration': { $exists: true }, servedBy: { $exists: true } }).count(),
		queue: LivechatMonitoring.find({ servedBy: { $exists: false } }).count(),
	};

	updateChartData('lc-chats-chart', 'Open', [chats.open]);
	updateChartData('lc-chats-chart', 'Closed', [chats.closed]);
	updateChartData('lc-chats-chart', 'Queue', [chats.queue]);
};

const displayDepartmentChart = (val) => {
	const elem = document.getElementsByClassName('lc-chats-per-dept-chart-section')[0];
	elem.style.display = val ? 'block' : 'none';
};

const updateVisitorsCount = () => {
	templateInstance.totalVisitors.set({
		title: templateInstance.totalVisitors.get().title,
		value: LivechatVisitors.find().count(),
	});
};

let timer;

const getDaterange = () => {
	const today = moment(new Date());
	return {
		start: `${ moment(new Date(today.year(), today.month(), today.date(), 0, 0, 0)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`,
		end: `${ moment(new Date(today.year(), today.month(), today.date(), 23, 59, 59)).utc().format('YYYY-MM-DDTHH:mm:ss') }Z`,
	};
};

const loadConversationOverview = async ({ start, end }) => {
	const { totalizers } = await APIClient.v1.get(`livechat/analytics/dashboards/conversation-totalizers?start=${ start }&end=${ end }`);
	return totalizers;
};

const updateConversationOverview = async (totalizers) => {
	if (totalizers && Array.isArray(totalizers)) {
		templateInstance.conversationsOverview.set(totalizers);
	}
};

const loadProductivityOverview = async ({ start, end }) => {
	const { totalizers } = await APIClient.v1.get(`livechat/analytics/dashboards/productivity-totalizers?start=${ start }&end=${ end }`);
	return totalizers;
};

const updateProductivityOverview = async (totalizers) => {
	if (totalizers && Array.isArray(totalizers)) {
		templateInstance.timingOverview.set(totalizers);
	}
};

const getIntervalInMS = () => templateInstance.interval.get() * 1000;

Template.livechatRealTimeMonitoring.helpers({
	selected(value) {
		if (value === templateInstance.analyticsOptions.get().value || value === templateInstance.chartOptions.get().value) { return 'selected'; }
		return false;
	},
	showDepartmentChart() {
		return templateInstance.showDepartmentChart.get();
	},
	conversationsOverview() {
		return templateInstance.conversationsOverview.get();
	},
	timingOverview() {
		return templateInstance.timingOverview.get();
	},
	totalVisitors() {
		return templateInstance.totalVisitors.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
});

Template.livechatRealTimeMonitoring.onCreated(function() {
	templateInstance = Template.instance();
	this.isLoading = new ReactiveVar(true);
	this.conversationsOverview = new ReactiveVar();
	this.timingOverview = new ReactiveVar();
	this.conversationTotalizers = new ReactiveVar([]);
	this.totalVisitors = new ReactiveVar({
		title: 'Total_visitors',
		value: 0,
	});
	this.interval = new ReactiveVar(5);
	this.updateDashboard = async () => {
		const daterange = getDaterange();
		updateConversationOverview(await loadConversationOverview(daterange));
		updateProductivityOverview(await loadProductivityOverview(daterange));
		this.isLoading.set(false);
	};

	this.autorun(() => {
		if (timer) {
			clearInterval(timer);
		}
		timer = setInterval(() => this.updateDashboard(), getIntervalInMS());
	});
	this.updateDashboard();

	AgentUsers.find().observeChanges({
		changed() {
			updateAgentStatusChart();
		},
		added() {
			updateAgentStatusChart();
		},
	});

	LivechatVisitors.find().observeChanges({
		added() {
			updateVisitorsCount();
		},
		removed() {
			updateVisitorsCount();
		},
	});

	LivechatDepartment.find({ enabled: true }).observeChanges({
		changed(id) {
			displayDepartmentChart(true);
			updateDepartmentsChart(id);
		},
		added(id) {
			displayDepartmentChart(true);
			updateDepartmentsChart(id);
		},
	});

	const updateMonitoringDashboard = (id, fields) => {
		const { ts } = LivechatMonitoring.findOne({ _id: id });

		if (fields.metrics) {
			// metrics changed
			metricsUpdated(ts);
			updateChatsChart();
			updateAgentsChart();
			updateDepartmentsChart();
		}

		if (fields.servedBy) {
			// agent data changed
			updateAgentsChart(fields.servedBy.username);
			updateChatsChart();
		}

		if (fields.open) {
			updateAgentsChart();
			updateChatsChart();
		}

		if (fields.departmentId) {
			updateDepartmentsChart(fields.departmentId);
		}
	};

	LivechatMonitoring.find().observeChanges({
		changed(id, fields) {
			updateMonitoringDashboard(id, fields);
		},
		added(id, fields) {
			updateMonitoringDashboard(id, fields);
		},
	});
});

Template.livechatRealTimeMonitoring.onRendered(function() {
	chartContexts = {};			// Clear chart contexts from previous loads, fixing bug when menu is reopened after changing to another.

	initAllCharts();

	displayDepartmentChart(false);

	this.subscribe('livechat:departments');
	this.subscribe('livechat:agents');
	this.subscribe('livechat:monitoring', {
		gte: moment().startOf('day').toISOString(),
		lt: moment().startOf('day').add(1, 'days').toISOString(),
	});
	this.subscribe('livechat:visitors', {
		gte: moment().startOf('day').toISOString(),
		lt: moment().startOf('day').add(1, 'days').toISOString(),
	});
});

Template.livechatRealTimeMonitoring.events({
	'change .js-interval': (event, instance) => {
		instance.interval.set(event.target.value);
	},
});

Template.livechatRealTimeMonitoring.onDestroyed(function() {
	clearInterval(timer);
});
