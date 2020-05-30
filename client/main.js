import './polyfills';

import './lib/meteorCallWrapper';
import './importPackages';
import '../imports/startup/client';

import '../lib/RegExp';

import '../ee/client';
import './lib/toastr';
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
import './startup/emailVerification';
import './startup/i18n';
import './startup/loginViaQuery';
import './startup/roomObserve';
import './startup/startup';
import './startup/theme';
import './startup/unread';
import './startup/userSetUtcOffset';
import './startup/usersObserve';
import './admin';
