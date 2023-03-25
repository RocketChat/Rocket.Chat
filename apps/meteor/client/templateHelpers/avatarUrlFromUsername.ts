import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../app/utils/lib/getUserAvatarURL';

Template.registerHelper('avatarUrlFromUsername', getUserAvatarURL);
