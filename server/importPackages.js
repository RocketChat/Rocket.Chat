import './api/v1';
import '../app/models';

// a separate task should be done for moving these packages to new structure
// since many of them are heavily used or are too critical to do a quick move
import '../app/authorization';
import '../app/lib';
import '../app/ui-master/server';
import '../app/utils';
import '../app/ui-utils';
import '../app/livechat/server';
import '../app/authentication/server';

// this file contains the settings for the registered services
import './settings/settingfiles';
import './api/methods';
import './services/2fa';
import './services/messages/slashcommands';
import './services/messages/mentions';
import './services/messages/threads';
import './services/messages/retention-policy';
import './services/messages/reactions';
import './services/messages/discussion';
import './services/importer';
import './services/importer/strategies';
import './services/apps';
import './services/autotranslate';
import './services/cloud';
import './services/user/data-download';
import './services/search';
import './services/notifications';
import './services/e2e';
import './services/federation';
import './services/livestream';
import './services/file-handling/file';
import './services/file-handling/file-upload';

import './overrides/google-oauth';
import './utils';

import './integrations';
import './integrations/oauth';

import './startup/migrations';
