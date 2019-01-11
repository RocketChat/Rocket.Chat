import { Users } from 'meteor/rocketchat:models';
import _ from 'underscore';

RocketChat.models.Users = _.extend({}, RocketChat.models.Users, Users);
