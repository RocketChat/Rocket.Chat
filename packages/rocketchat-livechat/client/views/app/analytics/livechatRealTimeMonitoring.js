import moment from 'moment';

const chartContexts = {};			// stores context of current chart, used to clean when redrawing
const LivechatMonitoring = new Mongo.Collection('livechatMonitoring');

const metricsUpdated = (ts) => {
	const hour = moment(ts).format('H');
	const label = `${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour)+1)%24, ['H']).format('hA') }`;

	const query = {
		'ts': {
			$gte: new Date(moment(ts).startOf('hour')),
			$lt: new Date(moment(ts).add(1, 'hours').startOf('hour'))
		}
	};

	const data = RocketChat.Livechat.Monitoring.getChartData(LivechatMonitoring.find(query));

	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-reaction-response-times-chart'], label, [data.reaction.avg, data.reaction.longest, data.response.avg, data.response.longest]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-chat-duration-chart'], label, [data.chatDuration.avg, data.chatDuration.longest]);
};

// const updateDepartmentsChartByAgent = (dept) => {
// 	if (dept) {
// 		// update for dept
// 		LivechatDepartment.find({})
// 	} else {
// 		// update for all
// 	}
// };

const updateAgentsChart = (agent) => {
	if (agent) {
		// update for the agent
		const data = {
			open: LivechatMonitoring.find({'servedBy.username': agent, open: true}).count(),
			closed: LivechatMonitoring.find({'servedBy.username': agent, open: {$exists: false}}).count()
		};

		RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-chats-per-agent-chart'], agent, [data.open, data.closed]);
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
	const statusData = RocketChat.Livechat.Monitoring.getAgentStatusData(AgentUsers.find());

	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-agents-chart'], 'Offline', [statusData.offline]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-agents-chart'], 'Online', [statusData.online]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-agents-chart'], 'Away', [statusData.away]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-agents-chart'], 'Busy', [statusData.busy]);
};

const updateChatsChart = () => {
	const chats = {
		open: LivechatMonitoring.find({'metrics.chatDuration': {$exists: false}, 'servedBy': {$exists: true}}).count(),
		closed: LivechatMonitoring.find({'metrics.chatDuration': {$exists: true}, 'servedBy': {$exists: true}}).count(),
		queue: LivechatMonitoring.find({'servedBy': {$exists: false}}).count()
	};

	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-chats-chart'], 'Open', [chats.open]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-chats-chart'], 'Closed', [chats.closed]);
	RocketChat.Livechat.Monitoring.updateChart(chartContexts['lc-chats-chart'], 'Queue', [chats.queue]);
};

Template.livechatRealTimeMonitoring.helpers({});

Template.livechatRealTimeMonitoring.onCreated(function() {
	AgentUsers.find().observeChanges({
		changed(/* id, fields */) {
			updateAgentStatusChart();
		},
		added(/* id, fields */) {
			updateAgentStatusChart();
		},
		removed(/* id */) {
			updateAgentStatusChart();
		}
	});

	// LivechatDepartment.find().observeChanges({
	// 	changed(id, fields) {
	// 		console.log('Dept Changed');
	// 		console.log(id);
	// 		console.log(fields);
	// 	},
	// 	added(id, fields) {
	// 		console.log('Dept added');
	// 		console.log(id);
	// 		console.log(fields);
	// 	},
	// 	removed(id) {
	// 		console.log('Dept removed');
	// 		console.log(id);
	// 	}
	// });
	//
	// LivechatDepartmentAgents.find().observeChanges({
	// 	changed(id, fields) {
	// 		console.log('Dept agent Changed');
	// 		console.log(id);
	// 		console.log(fields);
	// 	},
	// 	added(id, fields) {
	// 		console.log('Dept agent added');
	// 		console.log(id);
	// 		console.log(fields);
	// 	},
	// 	removed(id) {
	// 		console.log('Dept agent removed');
	// 		console.log(id);
	// 	}
	// });

	LivechatMonitoring.find().observeChanges({
		changed(id, fields) {
			const ts = LivechatMonitoring.findOne({_id: id}).ts;

			if (fields.metrics) {
				// metrics changed
				metricsUpdated(ts);
				updateChatsChart();
			}

			if (fields.servedBy) {
				// agent data changed
				updateAgentsChart(fields.servedBy.username);
				updateChatsChart();
			}

			if (fields.open) {
				updateChatsChart();
			}
		},
		added(id, fields) {
			const ts = LivechatMonitoring.findOne({_id: id}).ts;

			if (fields.metrics) {
				// metrics changed
				metricsUpdated(ts);
				updateChatsChart();
			}

			if (fields.servedBy) {
				// agent data changed
				updateAgentsChart(fields.servedBy.username);
			}

			if (fields.open) {
				updateChatsChart();
			}
		},
		removed(id) {
			const ts = LivechatMonitoring.findOne({_id: id}).ts;

			metricsUpdated(ts);
			updateAgentsChart();
			updateChatsChart();
		}
	});
});

Template.livechatRealTimeMonitoring.onRendered(function() {
	chartContexts['lc-chats-chart'] = RocketChat.Livechat.Monitoring.drawDoughnutChart(
		document.getElementById('lc-chats-chart'),
		'Chats',
		chartContexts['lc-chats-chart'],
		['Open', 'Queue', 'Closed'], []);

	chartContexts['lc-agents-chart'] = RocketChat.Livechat.Monitoring.drawDoughnutChart(
		document.getElementById('lc-agents-chart'),
		'Agents',
		chartContexts['lc-agents-chart'],
		['Online', 'Away', 'Busy', 'Offline'], []);

	chartContexts['lc-chats-per-agent-chart'] = RocketChat.Livechat.Monitoring.drawLineChart(
		document.getElementById('lc-chats-per-agent-chart'),
		chartContexts['lc-chats-per-agent-chart'],
		['Open', 'Closed'],
		[], [[], []]);

	// chartContexts['lc-chats-per-dept-chart'] = RocketChat.Livechat.Monitoring.drawLineChart(
	// 	document.getElementById('lc-chats-per-dept-chart'),
	// 	chartContexts['lc-chats-per-dept-chart'],
	// 	['Open', 'Closed'],
	// 	[], [[]]);

	const timingLabels = [];
	const initData = [];
	const today = moment().startOf('day');
	for (let m = today; m.diff(moment(), 'hours') < 0; m.add(1, 'hours')) {
		const hour = m.format('H');
		timingLabels.push(`${ moment(hour, ['H']).format('hA') }-${ moment((parseInt(hour)+1)%24, ['H']).format('hA') }`);
		initData.push(0);
	}

	chartContexts['lc-reaction-response-times-chart'] = RocketChat.Livechat.Monitoring.drawLineChart(
		document.getElementById('lc-reaction-response-times-chart'),
		chartContexts['lc-reaction-response-times-chart'],
		['Avg_reaction_time', 'Longest_reaction_time', 'Avg_response_time', 'Longest_response_time'],
		timingLabels.slice(),
		[initData.slice(), initData.slice(), initData.slice(), initData.slice()]);

	chartContexts['lc-chat-duration-chart'] = RocketChat.Livechat.Monitoring.drawLineChart(
		document.getElementById('lc-chat-duration-chart'),
		chartContexts['lc-chat-duration-chart'],
		['Avg_chat_duration', 'Longest_chat_duration'],
		timingLabels.slice(),
		[initData.slice(), initData.slice()]);

	this.subscribe('livechat:agents');
	this.subscribe('livechat:departments');
	this.subscribe('livechat:departmentAgents');
	this.subscribe('livechat:monitoring');
});
