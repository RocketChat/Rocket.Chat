import { Template } from 'meteor/templating';

import { settings } from '../../app/settings/client';

Template.registerHelper('setting', (name: string) => settings.get(name));
