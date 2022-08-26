import { Template } from 'meteor/templating';

import { messageContext } from '../../../../ui-utils/client/lib/messageContext';
import { getCommonRoomEvents } from './lib/getCommonRoomEvents';
import { retentionPolicyHelpers } from './lib/retentionPolicy';
import { roomEvents } from './lib/roomEvents';
import { roomHelpers } from './lib/roomHelpers';
import { onRoomCreated, onRoomDestroyed, onRoomRendered } from './lib/roomLifeCycleMethods';
import './room.html';

Template.roomOld.helpers({
	...roomHelpers,
	...retentionPolicyHelpers,
	messageContext,
});

Template.roomOld.events({
	...getCommonRoomEvents(),
	...roomEvents,
});

Template.roomOld.onCreated(onRoomCreated);
Template.roomOld.onDestroyed(onRoomDestroyed);
Template.roomOld.onRendered(onRoomRendered);
