/*
 * Copyright Olli Etuaho 2014.
 */

'use strict';

/**
 * A change to the picture state. Can either add or undo a PictureEvent.
 * @constructor
 * @param {string} updateType Type of the update.
 */
var PictureUpdate = function (updateType) {
	this.updateType = updateType;
};

/**
 * Set data for adding a picture event.
 * @param {number} targetLayerId Id of the layer where to add the event.
 * @param {PictureEvent} pictureEvent The event.
 */
PictureUpdate.prototype.setPictureEvent = function (targetLayerId, pictureEvent) {
	if (this.updateType !== 'add_picture_event') {
		console.log('Set picture event properties for "' + this.updateType + '" update');
		return;
	}
	this.targetLayerId = targetLayerId;
	this.pictureEvent = pictureEvent;
};

/**
 * @param {number} sid The session id.
 * @param {number} sessionEventId The session-specific event id.
 * @return {boolean} True if this update adds the picture event with the given
 * id.
 */
PictureUpdate.prototype.doesAddPictureEventWithSessionId = function (sid, sessionEventId) {
	if (this.updateType !== 'add_picture_event' || this.pictureEvent === undefined) {
		return false;
	}
	return this.pictureEvent.sid === sid && this.pictureEvent.sessionEventId === sessionEventId;
};

/**
 * Set data for undoing an event.
 * @param {number} undoneSid Session id of the undone event.
 * @param {number} undoneSessionEventId Session-specific even id of the undone
 * event.
 */
PictureUpdate.prototype.setUndoEvent = function (undoneSid, undoneSessionEventId) {
	if (this.updateType !== 'undo') {
		console.log('Set undo event properties for "' + this.updateType + '" update');
		return;
	}
	this.undoneSid = undoneSid;
	this.undoneSessionEventId = undoneSessionEventId;
};

/**
 * @param {Object} json JS object to serialize the update data to, that can then be stringified.
 */
PictureUpdate.prototype.serialize = function (json) {
	json['updateType'] = this.updateType;
	if (this.updateType === 'add_picture_event') {
		var eventJson = {};
		eventJson['targetLayerId'] = this.targetLayerId;
		this.pictureEvent.serialize(eventJson);
		json['event'] = eventJson;
	} else if (this.updateType === 'undo') {
		var undoJson = {};
		undoJson['sid'] = this.undoneSid;
		undoJson['sessionEventId'] = this.undoneSessionEventId;
		json['undo'] = undoJson;
	}
};

/**
 * @param {Object} json JS object to parse values from.
 * @return {?PictureUpdate} Parsed update or null if parsing failed.
 */
PictureUpdate.fromJS = function (json) {
	var update = new PictureUpdate(json['updateType']);
	if (update.updateType === 'add_picture_event') {
		var pictureEvent = PictureEvent.fromJS(json['event']);
		if (!pictureEvent) {
			return null;
		}
		update.setPictureEvent(json['event']['targetLayerId'], pictureEvent);
	} else if (update.updateType === 'undo') {
		var undoneSid = json['undo']['sid'];
		var undoneSessionEventId = json['undo']['sessionEventId'];
		update.setUndoEvent(undoneSid, undoneSessionEventId);
	} else {
		console.log('Unrecognized PictureUpdate type ' + update.updateType);
		return null;
	}
	return update;
};

/**
 * Create JSON object corresponding to an update from its legacy serialization.
 * @param {string} string String to parse.
 * @param {number} version Format version of the string to parse.
 * @return {?Object} The parsed update as a JS object or null if could not parse.
 */
PictureUpdate.parseLegacy = function (string, version) {
	var arr = string.split(' ');
	if (arr.length < 1) {
		console.log('Malformed PictureUpdate read');
		return null;
	}
	var json = {};
	var i = 0;
	var updateType = arr[i++];
	json['updateType'] = updateType;
	if (updateType === 'add_picture_event') {
		var eventJson = {};
		eventJson['targetLayerId'] = parseInt(arr[i++]);
		if (!PictureEvent.parseLegacy(eventJson, arr, i, version)) {
			return null;
		}
		json['event'] = eventJson;
	} else if (updateType === 'undo') {
		var undoJson = {};
		undoJson['sid'] = parseInt(arr[i++]);
		undoJson['sessionEventId'] = parseInt(arr[i++]);
		json['undo'] = undoJson;
	} else {
		console.log('Unrecognized PictureUpdate type ' + updateType);
		return null;
	}
	return json;
};
