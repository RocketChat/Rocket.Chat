import client from 'prom-client';
import { metrics } from 'meteor/rocketchat:metrics';

RocketChat.promclient = client;

RocketChat.metrics = metrics;
