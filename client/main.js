import 'url-polyfill';

import './importsCss';
import './importPackages';
import '../imports/startup/client';

import '../lib/RegExp';

import './lib/toastr';
import './helpers/escapeCssUrl';
import './helpers/log';
import './helpers/not';
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
import './routes/adminRouter';
import './routes/pageNotFound';
import './routes/roomRoute';
import './routes/router';
import './startup/emailVerification';
import './startup/i18n';
import './startup/loginViaQuery';
import './startup/roomObserve';
import './startup/startup';
import './startup/unread';
import './startup/userSetUtcOffset';
import './startup/usersObserve';
