import { Roles } from 'meteor/rocketchat:models';
import _ from 'underscore';

RocketChat.models.Roles = _.extend({}, RocketChat.models.Roles, Roles);
