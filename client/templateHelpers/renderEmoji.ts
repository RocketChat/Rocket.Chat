import { Template } from 'meteor/templating';

import { renderEmoji } from '../lib/renderEmoji';

Template.registerHelper('renderEmoji', renderEmoji);
