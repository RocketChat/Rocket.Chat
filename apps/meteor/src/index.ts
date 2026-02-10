import './meteor/core-runtime.ts';
import './meteor/modules-runtime.ts';
import './meteor/modules.ts';
import { Accounts } from './meteor/accounts-base.ts';
import { loginWithPassword, _hashPassword } from './meteor/accounts-password.ts';
import { Meteor } from './meteor/meteor.ts';

import './meteor/accounts-oauth.ts';

import './meteor/service-configuration.ts';

import '../app/theme/client/main.css';

Object.assign(Accounts, { _hashPassword });
Object.assign(Meteor, { loginWithPassword });

await import('../client/main.ts');
