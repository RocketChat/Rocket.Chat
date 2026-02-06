/* eslint-disable import/no-duplicates */
import './meteor/core-runtime.ts';
import './meteor/localstorage.ts';
import './meteor/retry.ts';
import './meteor/tracker.ts';

import 'meteor/socket-stream-client';
import 'meteor/ddp-client';
import 'meteor/accounts-base';
import 'meteor/accounts-oauth';
import 'meteor/accounts-password';
import 'meteor/service-configuration';

import '../app/theme/client/main.css';

await import('../client/main.ts');
