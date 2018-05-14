import client from 'prom-client';
import connect from 'connect';
import http from 'http';
import _ from 'underscore';

RocketChat.promclient = client;
client.collectDefaultMetrics();

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter({'name': 'message_sent', 'help': 'cumulated number of messages sent'});
RocketChat.metrics.ddpSessions = new client.Gauge({'name': 'ddp_sessions_count', 'help': 'number of open ddp sessions'});
RocketChat.metrics.ddpConnectedUsers = new client.Gauge({'name': 'ddp_connected_users', 'help': 'number of connected users'});


Meteor.setInterval(() => {
	RocketChat.metrics.ddpSessions.set(Object.keys(Meteor.server.sessions).length);
	RocketChat.metrics.ddpConnectedUsers.set(_.compact(_.unique(Object.values(Meteor.server.sessions).map(s => s.userId))).length);
}, 5000);

const app = connect();

// const compression = require('compression');
// app.use(compression());

app.use('/metrics', (req, res) => {
	res.setHeader('Content-Type', 'text/plain');
	res.end(RocketChat.promclient.register.metrics());
});

const server = http.createServer(app);

RocketChat.settings.get('Prometheus_Enabled', (key, value) => {
	if (value === true) {
		server.listen({
			port: 9100,
			host: process.env.BIND_IP || '0.0.0.0'
		});
	} else {
		server.close();
	}
});
