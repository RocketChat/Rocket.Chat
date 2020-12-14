import './polyfills';

import './lib/meteorCallWrapper';
import './importPackages';
import '../imports/startup/client';

import '../ee/client';
import './templateHelpers';
import './methods/deleteMessage';
import './methods/hideRoom';
import './methods/openRoom';
import './methods/setUserActiveStatus';
import './methods/toggleFavorite';
import './methods/updateMessage';
import './notifications/notification';
import './notifications/updateAvatar';
import './notifications/updateUserState';
import './notifications/UsersNameChanged';
import './routes';
import './startup';
import './views/admin';
import './views/login';
import './views/room/adapters';
