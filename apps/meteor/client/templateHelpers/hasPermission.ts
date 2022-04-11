import { Template } from 'meteor/templating';

import { hasAtLeastOnePermission } from '../../app/authorization/client';

Template.registerHelper('hasPermission', hasAtLeastOnePermission);
