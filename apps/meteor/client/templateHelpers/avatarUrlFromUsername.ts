import { Template } from 'meteor/templating';

import { getUserAvatarURL } from '../../app/utils/client/lib/getUserAvatarURL';

Template.registerHelper('avatarUrlFromUsername', getUserAvatarURL);
