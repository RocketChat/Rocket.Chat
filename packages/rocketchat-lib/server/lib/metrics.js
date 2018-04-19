import client from 'prom-client';

RocketChat.promclient = client;

RocketChat.metrics = {};

// one sample metrics only - a counter

RocketChat.metrics.messagesSent = new client.Counter({'name': 'message_sent', 'help': 'cumulated number of messages sent'});
