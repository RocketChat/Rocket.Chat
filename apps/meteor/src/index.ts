/* eslint-disable import/no-duplicates */
import 'meteor/core-runtime';
import 'meteor/socket-stream-client';
import 'meteor/ddp-client';
import 'meteor/localstorage';
import 'meteor/accounts-oauth';
import 'meteor/accounts-password';
import 'meteor/service-configuration';

import '../app/theme/client/main.css';

await import('../client/main.ts');
