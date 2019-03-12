import * as Mailer from 'meteor/rocketchat:mailer';
import { settings } from 'meteor/rocketchat:settings';

Mailer.setSettings(settings);
