import { Template } from 'meteor/templating';

import { messageContext } from '../../../../ui-utils/client/lib/messageContext';
import { getCommonRoomEvents } from './lib/getCommonRoomEvents';
import { dropzoneHelpers, dropzoneEvents } from './lib/dropzone';
import { retentionPolicyHelpers } from './lib/retentionPolicy';
import { roomEvents } from './lib/roomEvents';
import { roomHelpers } from './lib/roomHelpers';
import { onRoomCreated, onRoomDestroyed, onRoomRendered } from './lib/roomLifeCycleMethods';
import './room.html';

Template.roomOld.helpers({
	...dropzoneHelpers,
	...roomHelpers,
	...retentionPolicyHelpers,
	messageContext,
});

Template.roomOld.events({
	...getCommonRoomEvents(),
	...dropzoneEvents,
	...roomEvents,
});

Template.roomOld.onCreated(onRoomCreated);
Template.roomOld.onDestroyed(onRoomDestroyed);
Template.roomOld.onRendered(onRoomRendered);
