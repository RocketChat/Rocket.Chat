const client = require('prom-client');

RocketChat.promclient = client;

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter('messages_sent', 'cumulated number of messages sent');
