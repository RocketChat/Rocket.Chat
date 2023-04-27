import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../app/utils/client/getUserAvatarURL';

Template.registerHelper('avatarUrlFromUsername', getUserAvatarURL);
