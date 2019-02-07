import { Subscriptions } from 'meteor/rocketchat:models';
import _ from 'underscore';

RocketChat.models.Subscriptions = _.extend({}, RocketChat.models.Subscriptions, Subscriptions);
