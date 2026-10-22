// client/meteor/overrides patches Meteor's runtime, which the Vite build does not have.
import { installDesktopRequire } from './desktopRequire';
import { Info } from '../../rocketchat.info';

installDesktopRequire(window, Info);
