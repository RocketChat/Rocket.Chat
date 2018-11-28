export default () => ({

	// events: {
	// 	'message'({ action, message }) {
	// 		this.update('rocketchat_hub_streams', 'message', action);
	// 	},
	// 	'users.*'() {
	// 		// return Streamer.streams[stream] && Streamer.streams[stream].emit(eventName, ...args);
	// 	},
	// 	// 'setting'() { },
	// 	'subscription'({ action, subscription }) {
	// 		this.update('subscription', action);
	// 	},
	// 	'room'({ room, action }) {
	// 		this.update('room', action);
	// 	},
	// },
	// metrics: {
	// 	// Common metrics
	// 	rocketchat_hub_streams: { type: 'Gauge', help: 'hub streams', labelNames: ['name', 'action'] },
	// 	// moleculer_services_total: { type: 'Gauge', help: 'Moleculer services count' },
	// 	// moleculer_actions_total: { type: 'Gauge', help: 'Moleculer actions count' },
	// 	// moleculer_events_total: { type: 'Gauge', help: 'Moleculer event subscriptions' },

	// 	// // Nodes
	// 	// moleculer_nodes: { type: 'Gauge', labelNames: ['nodeID', 'type', 'version', 'langVersion'], help: 'Moleculer node list' },

	// 	// // Actions
	// 	// moleculer_action_endpoints_total: { type: 'Gauge', labelNames: ['action'], help: 'Moleculer action endpoints' },

	// 	// // Services
	// 	// moleculer_service_endpoints_total: { type: 'Gauge', labelNames: ['service', 'version'], help: 'Moleculer service endpoints' },

	// 	// // Events
	// 	// moleculer_event_endpoints_total: { type: 'Gauge', labelNames: ['event', 'group'], help: 'Moleculer event endpoints' },

	// 	// // Service requests
	// 	// moleculer_req_total: { type: 'Counter', labelNames: ['action', 'service', 'nodeID'], help: 'Moleculer action request count' },
	// 	// moleculer_req_errors_total: { type: 'Counter', labelNames: ['action', 'service', 'nodeID', 'errorCode', 'errorName', 'errorType'], help: 'Moleculer request error count' },
	// 	// moleculer_req_duration_ms: { type: 'Histogram', labelNames: ['action', 'service', 'nodeID'], help: 'Moleculer request durations' },
	// },
	// settings : {
	// 	port: process.env.PROMETHEUS_PORT || 9100,
	// },
	// methods: {
	// 	/**
	// 	 * Get service name from metric event
	// 	 *
	// 	 * @param {Object} metric
	// 	 * @returns {String}
	// 	 */
	// 	getServiceName(metric) {
	// 		if (metric.service) { return metric.service.name ? metric.service.name : metric.service; }

	// 		const parts = metric.action.name.split('.');
	// 		parts.pop();
	// 		return parts.join('.');
	// 	},

	// 	/**
	// 	 * Get span name from metric event. By default it returns the action name
	// 	 *
	// 	 * @param {Object} metric
	// 	 * @returns  {String}
	// 	 */
	// 	getSpanName(metric) {
	// 		if (metric.name) { return metric.name; }

	// 		if (metric.action) { return metric.action.name; }
	// 	},

	// 	/**
	// 	 * Create Prometheus metrics.
	// 	 *
	// 	 * @param {Object} metricsDefs
	// 	 */
	// 	createMetrics(metricsDefs) {
	// 		this.metrics = {};
	// 		if (!metricsDefs) { return; }

	// 		Object.keys(metricsDefs).forEach((name) => {
	// 			const def = metricsDefs[name];

	// 			if (def) { this.metrics[name] = new this.client[def.type](Object.assign({ name }, def)); }
	// 		});
	// 	},

	// 	/**
	// 	 * Update common Moleculer metric values.
	// 	 */
	// 	// updateCommonValues() {
	// 	// 	if (!this.metrics) { return; }

	// 	// 	return this.broker.mcall({
	// 	// 		nodes: { action: '$node.list' },
	// 	// 		services: { action: '$node.services', params: { withActions: false, skipInternal: true } },
	// 	// 		actions: { action: '$node.actions', params: { withEndpoints: true, skipInternal: true } },
	// 	// 		events: { action: '$node.events', params: { withEndpoints: true, skipInternal: true } },
	// 	// 	}).then(({ nodes, services, actions, events }) => {

	// 	// 		this.update('moleculer_nodes_total', 'set', null, nodes.filter((node) => node.available).length);
	// 	// 		nodes.forEach((node) => this.update('moleculer_nodes', 'set', { nodeID: node.id, type: node.client.type, version: node.client.version, langVersion: node.client.langVersion }, node.available ? 1 : 0));

	// 	// 		this.update('moleculer_services_total', 'set', null, services.length);
	// 	// 		services.forEach((svc) => this.update('moleculer_service_endpoints_total', 'set', { service: svc.name, version: svc.version }, svc.nodes.length));

	// 	// 		this.update('moleculer_actions_total', 'set', null, actions.length);
	// 	// 		actions.forEach((action) => this.update('moleculer_action_endpoints_total', 'set', { action: action.name }, action.endpoints ? action.endpoints.length : 0));

	// 	// 		this.update('moleculer_events_total', 'set', null, events.length);
	// 	// 		events.forEach((event) => this.update('moleculer_event_endpoints_total', 'set', { event: event.name, group: event.group }, event.endpoints ? event.endpoints.length : 0));
	// 	// 	});
	// 	// },

	// 	/**
	// 	 * Update a metric value.
	// 	 *
	// 	 * @methods
	// 	 * @param {String} name
	// 	 * @param {String} method
	// 	 * @param {Object?} labels
	// 	 * @param {any} value
	// 	 * @param {any} timestamp
	// 	 */
	// 	update(name, method, labels, value, timestamp) {
	// 		if (this.metrics[name]) {
	// 			if (labels) { this.metrics[name][method](labels, value, timestamp); } else { this.metrics[name][method](value, timestamp); }
	// 		}
	// 	},
	// },
	// /**
	// 	 * Service started lifecycle event handler
	// 	 */

	// created() {
	// 	const polka = require('polka');
	// 	this.server = polka();
	// },

	// started() {
	// 	this.client = require('prom-client');

	// 	this.timer = this.client.collectDefaultMetrics({ timeout: this.settings.timeout });

	// 	this.createMetrics(this.settings.metrics);

	// 	this.server.get('/metrics', (req, res) => {
	// 		res.setHeader('Content-Type', this.client.contentType);
	// 		res.end(this.client.register.metrics());
	// 	});

	// 	return this.server.listen(this.settings.port, (err) => {
	// 		if (err) { throw err; }
	// 		this.logger.info(`Prometheus collector is listening on port ${ this.settings.port }, metrics exposed on /metrics endpoint`);

	// 		// this.updateCommonValues();
	// 	});
	// },

	// /**
	// 	 * Service stopped lifecycle event handler
	// 	 */
	// stopped() {
	// 	if (this.timer) {
	// 		clearInterval(this.timer);
	// 		this.timer = null;
	// 	}

	// 	if (this.server) { this.server.server.close(); }
	// },
});
