import { Template } from 'meteor/templating';
import moment from 'moment';
import { ReactiveVar } from 'meteor/reactive-var';

import { drawLineChart, drawDoughnutChart, updateChart } from '../../../lib/chartHandler';
import { APIClient } from '../../../../../utils/client';
import './livechatRealTimeMonitoring.html';

const chartContexts = {}; // stores context of current chart, used to clean when redrawing
let templateInstance;

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

const initAllCharts = async () => {
	chartContexts['lc-chats-chart'] = await initChart['lc-chats-chart']();
	chartContexts['lc-agents-chart'] = await initChart['lc-agents-chart']();
	chartContexts['lc-chats-per-agent-chart'] = await initChart['lc-chats-per-agent-chart']();
	chartContexts['lc-chats-per-dept-chart'] = await initChart['lc-chats-per-dept-chart']();
	chartContexts['lc-reaction-response-times-chart'] = await initChart['lc-reaction-response-times-chart']();
	chartContexts['lc-chat-duration-chart'] = await initChart['lc-chat-duration-chart']();
};

const updateChartData = async (chartId, label, data) => {
	if (!chartContexts[chartId]) {
		chartContexts[chartId] = await initChart[chartId]();
	}

	await updateChart(chartContexts[chartId], label, data);
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

const loadAgentsOverview = async ({ start, end }) => {
	const { totalizers } = await APIClient.v1.get(`livechat/analytics/dashboards/agents-productivity-totalizers?start=${ start }&end=${ end }`);
	return totalizers;
};

const updateAgentsOverview = async (totalizers) => {
	if (totalizers && Array.isArray(totalizers)) {
		templateInstance.agentsOverview.set(totalizers);
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

const loadChatsChartData = ({ start, end }) => APIClient.v1.get(`livechat/analytics/dashboards/charts/chats?start=${ start }&end=${ end }`);

const updateChatsChart = async ({ open, closed, queued }) => {
	await updateChartData('lc-chats-chart', 'Open', [open]);
	await updateChartData('lc-chats-chart', 'Closed', [closed]);
	await updateChartData('lc-chats-chart', 'Queue', [queued]);
};

const loadChatsPerAgentChartData = async ({ start, end }) => {
	const result = await APIClient.v1.get(`livechat/analytics/dashboards/charts/chats-per-agent?start=${ start }&end=${ end }`);
	delete result.success;
	return result;
};

const updateChatsPerAgentChart = (agents) => {
	Object
		.keys(agents)
		.forEach((agent) => updateChartData('lc-chats-per-agent-chart', agent, [agents[agent].open, agents[agent].closed]));
};

const loadAgentsStatusChartData = () => APIClient.v1.get('livechat/analytics/dashboards/charts/agents-status');

const updateAgentStatusChart = async (statusData) => {
	if (!statusData) {
		return;
	}

	await updateChartData('lc-agents-chart', 'Offline', [statusData.offline]);
	await updateChartData('lc-agents-chart', 'Available', [statusData.available]);
	await updateChartData('lc-agents-chart', 'Away', [statusData.away]);
	await updateChartData('lc-agents-chart', 'Busy', [statusData.busy]);
};

const loadChatsPerDepartmentChartData = async ({ start, end }) => {
	const result = await APIClient.v1.get(`livechat/analytics/dashboards/charts/chats-per-department?start=${ start }&end=${ end }`);
	delete result.success;
	return result;
};

const updateDepartmentsChart = (departments) => {
	Object
		.keys(departments)
		.forEach((department) => updateChartData('lc-chats-per-dept-chart', department, [departments[department].open, departments[department].closed]));
};

const loadTimingsChartData = ({ start, end }) => APIClient.v1.get(`livechat/analytics/dashboards/charts/timings?start=${ start }&end=${ end }`);

const updateTimingsChart = async (timingsData) => {
	const hour = moment(new Date()).format('H');
	const label = `${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour) + 1) % 24, ['H']).format('hA') }`;

	await updateChartData('lc-reaction-response-times-chart', label, [timingsData.reaction.avg, timingsData.reaction.longest, timingsData.response.avg, timingsData.response.longest]);
	await updateChartData('lc-chat-duration-chart', label, [timingsData.chatDuration.avg, timingsData.chatDuration.longest]);
};

const getIntervalInMS = () => templateInstance.interval.get() * 1000;

Template.livechatRealTimeMonitoring.helpers({
	selected(value) {
		return value === templateInstance.analyticsOptions.get().value || value === templateInstance.chartOptions.get().value ? 'selected' : false;
	},
	conversationsOverview() {
		return templateInstance.conversationsOverview.get();
	},
	timingOverview() {
		return templateInstance.timingOverview.get();
	},
	agentsOverview() {
		return templateInstance.agentsOverview.get();
	},
	isLoading() {
		return Template.instance().isLoading.get();
	},
});

Template.livechatRealTimeMonitoring.onCreated(function() {
	templateInstance = Template.instance();
	this.isLoading = new ReactiveVar(false);
	this.conversationsOverview = new ReactiveVar();
	this.timingOverview = new ReactiveVar();
	this.agentsOverview = new ReactiveVar();
	this.conversationTotalizers = new ReactiveVar([]);
	this.interval = new ReactiveVar(5);
});

Template.livechatRealTimeMonitoring.onRendered(async function() {
	await initAllCharts();

	this.updateDashboard = async () => {
		const daterange = getDaterange();
		updateConversationOverview(await loadConversationOverview(daterange));
		updateProductivityOverview(await loadProductivityOverview(daterange));
		updateChatsChart(await loadChatsChartData(daterange));
		updateChatsPerAgentChart(await loadChatsPerAgentChartData(daterange));
		updateAgentStatusChart(await loadAgentsStatusChartData());
		updateDepartmentsChart(await loadChatsPerDepartmentChartData(daterange));
		updateTimingsChart(await loadTimingsChartData(daterange));
		updateAgentsOverview(await loadAgentsOverview(daterange));
	};
	this.autorun(() => {
		if (timer) {
			clearInterval(timer);
		}
		timer = setInterval(() => this.updateDashboard(), getIntervalInMS());
	});
	this.isLoading.set(true);
	await this.updateDashboard();
	this.isLoading.set(false);
});

Template.livechatRealTimeMonitoring.events({
	'change .js-interval': (event, instance) => {
		instance.interval.set(event.target.value);
	},
});

Template.livechatRealTimeMonitoring.onDestroyed(function() {
	clearInterval(timer);
});
