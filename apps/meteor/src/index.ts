/* eslint-disable import/no-duplicates */
import './meteor/core-runtime.ts';
import './meteor/localstorage.ts';
import 'meteor/accounts-oauth';
import 'meteor/accounts-password';
import './meteor/service-configuration.ts';

import '../app/theme/client/main.css';

await import('../client/main.ts');
