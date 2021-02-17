import { Meteor } from 'meteor/meteor';

import { getGlobalWindow as getClientGlobalWindow } from '../client/getGlobalWindow';
import { getGlobalWindow as getServerGlobalWindow } from '../server/getGlobalWindow';

export const getGlobalWindow = Meteor.isServer ? getServerGlobalWindow : getClientGlobalWindow;
