import { Rooms } from 'meteor/rocketchat:models';
import _ from 'underscore';

RocketChat.models.Rooms = _.extend({}, RocketChat.models.Rooms, Rooms);
