/* eslint-disable import/no-duplicates */
import 'meteor/core-runtime';
import 'meteor/socket-stream-client';
import 'meteor/ddp-client';
import 'meteor/localstorage';
import 'meteor/accounts-oauth';
import 'meteor/accounts-password';
import 'meteor/service-configuration';
import 'meteor/rocketchat:streamer';

import '../.meteor/local/build/programs/web.browser/merged-stylesheets.css';

import '../client/main.ts';
