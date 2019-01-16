import { Messages } from 'meteor/rocketchat:models';
import _ from 'underscore';

RocketChat.models.Messages = _.extend({}, RocketChat.models.Messages, Messages);
