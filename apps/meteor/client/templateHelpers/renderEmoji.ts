import { Template } from 'meteor/templating';

import { renderEmoji } from '../lib/utils/renderEmoji';

Template.registerHelper('renderEmoji', renderEmoji);
