import client from 'prom-client';
import connect from 'connect';
import http from 'http';

RocketChat.promclient = client;
client.collectDefaultMetrics();

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter({'name': 'message_sent', 'help': 'cumulated number of messages sent'});
RocketChat.metrics.ddpSessions = new client.Gauge({'name': 'ddp_sessions_count', 'help': 'number of open ddp sessions'});

Meteor.setInterval(() => {
	RocketChat.metrics.ddpSessions.set(Object.keys(Meteor.server.sessions).length);
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
