/*
 * Copyright Olli Etuaho 2012-2013.
 */

'use strict';

/**
 * @constructor
 * @param {number} id Picture's unique id number.
 * @param {string} name Name of the picture. May be null.
 * @param {Rect} boundsRect Picture bounds in picture coordinates. Left and top bounds may be negative.
 * @param {number} bitmapScale Scale for rasterizing the picture. Events that
 * are pushed to this picture get this scale applied to them.
 * @param {PictureRenderer} renderer Renderer to use to draw the picture.
 */

var Picture = function (id, name, boundsRect, bitmapScale, renderer) {
	this.id = id;
	this.name = name;
	this.renderer = renderer;
	this.parsedVersion = null;

	this.freed = false; // Freed picture has no bitmaps. They can be regenerated.

	this.animating = false;

	this.activeSid = 0;
	this.activeSessionEventId = 0;
	this.lastSavedSessionEventId = 0;

	this.buffers = []; // PictureBuffers
	this.updates = []; // PictureUpdates (state changes used as the basis of serialization and animation).
	this.currentEventAttachment = -1;
	this.currentEvent = null;
	this.currentEventUntilCoord = undefined;
	this.currentEventMode = PictureEvent.Mode.normal;
	this.currentEventColor = [255, 255, 255];

	this.pictureTransform = new AffineTransform();
	this.pictureTransform.scale = bitmapScale;
	this.setBounds(boundsRect);

	// Shouldn't use more GPU memory than this for buffers and rasterizers
	// combined. Just guessing for a good generic limit, since WebGL won't give
	// out an exact one. Assuming that 2D canvas elements count towards this.
	this.memoryBudget = 256 * 1024 * 1024;
	// Allocate space for the compositing buffer
	this.memoryUse = this.bitmapWidth() * this.bitmapHeight() * 4;

	this.container = null;
	this.canvas = document.createElement('canvas');
	this.canvas.id = "drawingBoard";
	this.canvas.setAttribute("touch-action", "none");
	this.ctx = this.canvas.getContext('2d');

	if (this.renderer.usesWebGl()) {
		this.gl = this.renderer.gl;
		this.glManager = this.renderer.glManager;
		this.renderer.setPicture(this);
	}

	this.initRasterizers();
};

/**
 * Add a PictureUpdate to this picture. This is the preferred way to interface with the Picture for applications which
 * don't require inserting events to the middle of buffers. It enables serializing the picture and playing back an
 * animation of its progress.
 * @param {PictureUpdate} update The update to add.
 * @param {boolean=} changeState Whether to change the state of the picture according to this update. Defaults to true,
 * use false to keep the update stack consistent with the event data if you are using other functions to add/change
 * events.
 */
Picture.prototype.pushUpdate = function (update, changeState) {
	if (changeState === undefined) {
		changeState = true;
	}
	if (changeState) {
		if (update.updateType === 'undo') {
			var undone = this.undoEventSessionId(update.undoneSid, update.undoneSessionEventId);
			if (undone === null) {
				console.log('pushUpdate: did not find the event to undo with session event id ' +
					update.undoneSessionEventId);
				return;
			}
		} else if (update.updateType === 'add_picture_event') {
			this.pushEvent(update.targetLayerId, update.pictureEvent);
		}
	}
	this.updates.push(update);
};

/**
 * Set the bounds of the picture. Will resize the bitmaps, translating the existing bitmap contents to the right
 * position and fill in any empty areas that might appear.
 * @param {Rect} boundsRect Picture bounds in picture coordinates. Left and top bounds may be negative.
 * @param {number=} bitmapScale Scale for the picture's bitmap. Will be clamped so that maximum framebuffer size limit
 * is respected. Defaults to not changing the scale.
 */
Picture.prototype.crop = function (boundsRect, bitmapScale) {
	if (bitmapScale === undefined) {
		bitmapScale = this.pictureTransform.scale;
	}

	this.pictureTransform.scale = bitmapScale;
	this.setBounds(boundsRect);

	this.renderer.setPicture(this);

	this.initRasterizers();
	for (var i = 0; i < this.buffers.length; ++i) {
		this.buffers[i].crop(this.bitmapRect.width(), this.bitmapRect.height(), this.renderer.sharedRasterizer);
	}
};

/**
 * Set the bounds of the picture. Sets pictureTransform to translate events to the bitmap coordinates. Will respect
 * maximum framebuffer size.
 * @param {Rect} boundsRect Picture bounds in picture coordinates. Left and top bounds may be negative.
 * @protected
 */
Picture.prototype.setBounds = function (boundsRect) {
	this.boundsRect = boundsRect;
	if (this.pictureTransform.scale < this.minBitmapScale()) {
		this.pictureTransform.scale = this.minBitmapScale();
	}
	if (this.pictureTransform.scale > this.maxBitmapScale()) {
		this.pictureTransform.scale = this.maxBitmapScale();
	}
	this.pictureTransform.translate.x = -boundsRect.left * this.pictureTransform.scale;
	this.pictureTransform.translate.y = -boundsRect.top * this.pictureTransform.scale;
	++this.pictureTransform.generation;
	var bitmapWidth = Math.floor(this.boundsRect.width() * this.pictureTransform.scale);
	var bitmapHeight = Math.floor(this.boundsRect.height() * this.pictureTransform.scale);
	this.bitmapRect = new Rect(0, bitmapWidth, 0, bitmapHeight);
};

/**
 * @return {boolean} True if this picture hasn't changed since it last was
 * marked as saved.
 */
Picture.prototype.hasBeenSaved = function () {
	// TODO: Doesn't take undo into account. Maybe fix this.
	return this.lastSavedSessionEventId === this.activeSessionEventId;
};

/**
 * Mark this picture as saved.
 */
Picture.prototype.markAsSaved = function () {
	this.lastSavedSessionEventId = this.activeSessionEventId;
};

/**
 * Kill WebGL context if one exists to free as many resources as possible.
 * Meant mainly for testing.
 */
Picture.prototype.destroy = function () {
	if (this.gl) {
		this.gl.finish();
		if (this.renderer.loseContext) {
			this.renderer.loseContext.loseContext();
		}
	}
};

/**
 * Add a buffer to the top of the buffer stack. Does the operation through pushUpdate.
 * @param {number} id Identifier for this buffer. Unique at the Picture level.
 * Should be an integer >= 0.
 * @param {Array.<number>} clearColor 4-component array with RGBA color that's
 * used to clear this buffer.
 * @param {boolean} hasAlpha Does the buffer have an alpha channel?
 */
Picture.prototype.addBuffer = function (id, clearColor, hasAlpha) {
	var addEvent = this.createBufferAddEvent(id, hasAlpha, clearColor);
	var update = new PictureUpdate('add_picture_event');
	update.setPictureEvent(id, addEvent);
	this.pushUpdate(update);
};

/**
 * Mark a buffer as removed from the stack. It won't be composited, but it can
 * still be changed. Does the operation through pushUpdate.
 * @param {number} id Identifier for the removed buffer.
 */
Picture.prototype.removeBuffer = function (id) {
	var removeEvent = this.createBufferRemoveEvent(id);
	var update = new PictureUpdate('add_picture_event');
	update.setPictureEvent(id, removeEvent);
	this.pushUpdate(update);
};

/**
 * Move a buffer to the given index in the buffer stack. Current event stays
 * attached to the moved buffer, if it exists. Does the operation through pushUpdate.
 * @param {number} movedId The id of the buffer to move.
 * @param {number} toIndex The index to move this buffer to. Must be an integer
 * between 0 and Picture.buffers.length - 1.
 */
Picture.prototype.moveBuffer = function (movedId, toIndex) {
	var moveEvent = this.createBufferMoveEvent(movedId, toIndex);
	var update = new PictureUpdate('add_picture_event');
	update.setPictureEvent(movedId, moveEvent);
	this.pushUpdate(update);
};

/**
 * Find a buffer with the given id from this picture.
 * @param {Array.<PictureBuffer>} buffers Array to search for the buffer.
 * @param {number} id Identifier of the buffer to find.
 * @return {number} Index of the buffer or -1 if not found.
 * @protected
 */
Picture.prototype.findBufferIndex = function (buffers, id) {
	for (var i = 0; i < buffers.length; ++i) {
		if (buffers[i].id === id) {
			return i;
		}
	}
	return -1;
};

/**
 * Find a buffer with the given id from this picture.
 * @param {number} id Identifier of the buffer to find.
 * @return {PictureBuffer} Buffer or null if not found.
 * @protected
 */
Picture.prototype.findBuffer = function (id) {
	var ind = this.findBufferIndex(this.buffers, id);
	if (ind !== -1) {
		return this.buffers[ind];
	}
	return null;
};

/**
 * Find the buffer that contains the given event.
 * @param {PictureEvent} event The event to look for.
 * @return {number} The buffer's id or -1 if not found.
 */
Picture.prototype.findBufferContainingEvent = function (event) {
	for (var i = 0; i < this.buffers.length; ++i) {
		if (this.buffers[i].eventIndexBySessionId(event.sid,
				event.sessionEventId) >= 0) {
			return this.buffers[i].id;
		}
	}
	return -1;
};

/**
 * @return {number} Id of the topmost composited buffer.
 */
Picture.prototype.topCompositedBufferId = function () {
	var i = this.buffers.length;
	while (i > 0) {
		--i;
		if (this.buffers[i].isComposited()) {
			return this.buffers[i].id;
		}
	}
	return -1;
};

/**
 * Update the current event compositing mode and color.
 * @protected
 */
Picture.prototype.updateCurrentEventMode = function () {
	if (this.currentEvent !== null && this.currentEventAttachment >= 0) {
		this.currentEventMode = this.currentEvent.mode;
		this.currentEventColor = this.currentEvent.color;
		var buffer = this.findBuffer(this.currentEventAttachment);
		// TODO: assert(buffer !== null)
		if (this.currentEventMode === PictureEvent.Mode.erase && !buffer.hasAlpha) {
			this.currentEventMode = PictureEvent.Mode.normal;
			this.currentEventColor = buffer.events[0].clearColor;
		}
	}
};

/**
 * Attach the current event to the given buffer in the stack.
 * @param {number} attachment Which buffer id to attach the picture's current
 * event to. Can be set to -1 if no current event is needed.
 */
Picture.prototype.setCurrentEventAttachment = function (attachment) {
	this.currentEventAttachment = attachment;
	this.updateCurrentEventMode();
};

/**
 * Set one of this picture's buffers visible or invisible.
 * @param {number} bufferId The id of the buffer to adjust.
 * @param {boolean} visible Is the buffer visible?
 */
Picture.prototype.setBufferVisible = function (bufferId, visible) {
	this.findBuffer(bufferId).visible = visible;
};

/**
 * Set the opacity of one of this picture's buffers.
 * @param {number} bufferId The id of the buffer to adjust.
 * @param {number} opacity Opacity value to set, range from 0 to 1.
 */
Picture.prototype.setBufferOpacity = function (bufferId, opacity) {
	this.findBuffer(bufferId).events[0].opacity = opacity;
};

/**
 * Create a picture object by parsing a serialization of it. Note that the
 * picture might not be immediately ready after parsing, but might instead be
 * freed when this function returns and take a while to load imported bitmaps,
 * after which the picture will be regenerated for display.
 * TODO: Make returning the picture asynchronous?
 * @param {number} id Unique identifier for the picture.
 * @param {string} serialization Serialization of the picture as generated by
 * Picture.prototype.serialize(). May optionally have metadata not handled by
 * the Picture object at the end, separated by line "metadata".
 * @param {number} bitmapScale Scale for rasterizing the picture. Events that
 * are pushed to this picture get this scale applied to them.
 * @param {PictureRenderer} renderer Renderer to use to draw the picture.
 * @param {function(Object)} finishedCallback Function to be called asynchronously when loading has finished.
 * The function will be called with one parameter, an object containing key 'picture' for the created picture,
 * and key 'metadata' for the metadata lines.
 */
Picture.parse = function (id, serialization, bitmapScale, renderer, finishedCallback) {
	var eventStrings = serialization.split(/\r?\n/);
	var pictureParams = eventStrings[0].split(' ');
	var version = 0;
	var left = 0;
	var top = 0;
	var width = 0;
	var height = 0;
	var name = null;
	if (pictureParams[1] !== 'version') {
		width = parseInt(pictureParams[1]);
		height = parseInt(pictureParams[2]);
	} else {
		version = parseInt(pictureParams[2]);
		if (version < 6) {
			width = parseInt(pictureParams[3]);
			height = parseInt(pictureParams[4]);
		} else {
			left = parseFloat(pictureParams[3]);
			top = parseFloat(pictureParams[4]);
			width = parseFloat(pictureParams[5]);
			height = parseFloat(pictureParams[6]);
		}
	}
	if (version > 2) {
		var nameIndex = 5;
		if (version > 5) {
			nameIndex = 7;
		}
		var hasName = pictureParams[nameIndex];
		if (hasName === 'named') {
			name = window.atob(pictureParams[nameIndex + 1]);
		}
	}
	var pic = new Picture(id, name, new Rect(left, left + width, top, top + height), bitmapScale, renderer);
	pic.parsedVersion = version;

	// First parse all buffers without rasterizing, then rasterize after rasterImport events are loaded.
	pic.freed = true;

	var i = 1;
	var rasterImportEvents = [];

	var generateUpdates = function () {
		// Reconstruct a chain of PictureUpdates that will result in the parsed picture.

		var buffersPushed = [];
		var pushedBufferUpdates = function (buf) {
			for (var k = 0; k < buffersPushed.length; ++k) {
				if (buffersPushed[k] === buf.id) {
					return true;
				}
			}
			return false;
		};
		var pushBufferUpdates = function (buf) {
			buffersPushed.push(buf.id);
			for (var k = 0; k < buf.events.length; ++k) {
				var event = buf.events[k];
				if (event.eventType === 'bufferMerge' && !pushedBufferUpdates(event.mergedBuffer)) {
					pushBufferUpdates(event.mergedBuffer);
				}
				var update = new PictureUpdate('add_picture_event');
				update.setPictureEvent(buf.id, event);
				pic.pushUpdate(update, false);
				if (event.undone) {
					var undoUpdate = new PictureUpdate('undo');
					undoUpdate.setUndoEvent(event.sid, event.sessionEventId);
					pic.pushUpdate(undoUpdate, false);
				}
			}
		};

		for (var j = 0; j < pic.buffers.length; ++j) {
			if (!pic.buffers[j].isMerged()) {
				pushBufferUpdates(pic.buffers[j]);
			}
		}
	};

	var regenerateIfReady = function () {
		var ready = true;
		for (i = 0; i < rasterImportEvents.length; ++i) {
			if (!rasterImportEvents[i].loaded) {
				ready = false;
			}
		}
		if (ready) {
			pic.regenerate();
			if (version < 5) {
				generateUpdates();
			}
			finishedCallback({picture: pic, metadata: metadata});
		} else {
			setTimeout(regenerateIfReady, 10);
		}
	};

	if (version < 5) {
		// Parse events, old style.

		pic.moveBufferInternal = function () {
		}; // Move events can be processed out
		// of order here, so we don't apply them. Instead rely on buffers being
		// already in the correct order.

		var currentId = -1;
		var mergeEvents = [];
		while (i < eventStrings.length) {
			if (eventStrings[i] === 'metadata') {
				break;
			} else {
				var arr = eventStrings[i].split(' ');
				var json = {};
				PictureEvent.parseLegacy(json, arr, 0, version);
				var pictureEvent = PictureEvent.fromJS(json);
				if (pictureEvent.eventType === 'bufferMerge') {
					mergeEvents.push(pictureEvent);
				}
				if (pictureEvent.eventType === 'rasterImport') {
					rasterImportEvents.push(pictureEvent);
				}
				pic.pushEvent(currentId, pictureEvent);
				currentId = pic.buffers[pic.buffers.length - 1].id;
				++i;
			}
		}

		// Merged buffer might not have been present when the merge target buffer was parsed.
		// This will only set mergedBuffer on the events.
		// mergedTo will be set on buffers when the picture is regenerated.
		for (var j = 0; j < mergeEvents.length; ++j) {
			pic.undummify(mergeEvents[j]);
		}

		delete pic.moveBufferInternal; // switch back to prototype's move function
	} else {
		// Parse PictureUpdates and process them in the original order.
		var json;
		while (i < eventStrings.length) {
			if (eventStrings[i] === 'metadata') {
				break;
			} else {
				if (version < 7) {
					json = PictureUpdate.parseLegacy(eventStrings[i], version);
				} else {
					json = JSON.parse(eventStrings[i]);
				}
				var update = PictureUpdate.fromJS(json);
				if (update.updateType === 'add_picture_event' &&
					update.pictureEvent.eventType === 'rasterImport') {
					rasterImportEvents.push(update.pictureEvent);
				}
				pic.pushUpdate(update);
				++i;
			}
		}
	}

	var metadata = [];
	if (i < eventStrings.length && eventStrings[i] === 'metadata') {
		metadata = eventStrings.slice(i);
	}

	for (i = 0; i < pic.buffers.length; ++i) {
		pic.buffers[i].insertionPoint = pic.buffers[i].events[0].insertionPoint;
	}

	setTimeout(regenerateIfReady, 0);
};

/**
 * Create a copy of the given picture. You may optionally scale the picture at
 * the same time.
 * @param {Picture} pic The picture to copy.
 * @param {function(Picture)} finishedCallback Function that will be called
 * asynchronously with the copy once copying is done.
 * @param {number=} bitmapScale The scale to set to the new picture. The new
 * picture's bitmap width will be the old picture's width() * bitmapScale.
 * Defaults to keeping the current scale.
 */
Picture.copy = function (pic, finishedCallback, bitmapScale) {
	if (bitmapScale === undefined) {
		bitmapScale = pic.pictureTransform.scale;
	}
	var serialization = pic.serialize();
	Picture.parse(pic.id, serialization, bitmapScale,
		pic.renderer, function (parsed) {
			parsed.picture.setCurrentEventAttachment(pic.currentEventAttachment);
			finishedCallback(parsed.picture);
		});
};

/**
 * @return {number} The maximum scale to which this picture can be reliably
 * resized on the current configuration.
 */
Picture.prototype.maxBitmapScale = function () {
	// Note: if WebGL is unsupported, falls back to default (unconfirmed)
	// glUtils.maxFramebufferSize. This is a reasonable value for 2D canvas.
	return glUtils.maxFramebufferSize / Math.max(this.width(), this.height());
};

/**
 * @return {number} The minimum scale to which this picture can be reliably
 * resized on the current configuration.
 */
Picture.prototype.minBitmapScale = function () {
	return BaseRasterizer.minSize / Math.min(this.width(), this.height()) * 1.0001;
};

/** @const */
Picture.formatVersion = 7;

/**
 * @return {string} A serialization of this Picture. Can be parsed into a new
 * Picture by calling Picture.parse. Compatibility is guaranteed between at
 * least two subsequent versions.
 */
Picture.prototype.serialize = function () {
	var formatVersion = Picture.formatVersion;
	var nameSerialization = this.name === null ? 'unnamed' : 'named ' + window.btoa(this.name);
	var serialization = ['picture version ' + formatVersion + ' ' +
	this.boundsRect.left + ' ' + this.boundsRect.top + ' ' +
	this.width() + ' ' + this.height() + ' ' +
	nameSerialization];
	for (var i = 0; i < this.buffers.length; ++i) {
		var buffer = this.buffers[i];
		buffer.events[0].insertionPoint = buffer.insertionPoint;
	}
	for (var i = 0; i < this.updates.length; ++i) {
		serialization.push(serializeToString(this.updates[i]));
	}
	return serialization.join('\n');
};

/**
 * @return {number} The total event count in all buffers, undone or not.
 */
Picture.prototype.getEventCount = function () {
	var count = 0;
	for (var i = 0; i < this.buffers.length; ++i) {
		count += this.buffers[i].events.length;
	}
	return count;
};

/**
 * Set the session with the given sid active for purposes of createBrushEvent,
 * createScatterEvent, createGradientEvent, createRasterImportEvent, createMergeEvent,
 * createBufferAddEvent, addBuffer, createBufferRemoveEvent,
 * createBufferMoveEvent, removeBuffer and undoLatest.
 * @param {number} sid The session id to activate. Must be a positive integer.
 */
Picture.prototype.setActiveSession = function (sid) {
	this.activeSid = sid;
	this.activeSessionEventId = 0;
	var latest = this.findLatest(sid, true);
	if (latest !== null) {
		this.activeSessionEventId = latest.sessionEventId + 1;
	}
};

/**
 * Create a brush event using the current active session. The event is marked as
 * not undone.
 * @param {Uint8Array|Array.<number>} color The RGB color of the stroke. Channel
 * values are between 0-255.
 * @param {number} flow Alpha value controlling blending individual brush
 * samples (circles) to each other in the rasterizer. Range 0 to 1. Normalized
 * to represent the resulting maximum alpha value in the rasterizer's bitmap in
 * case of a straight stroke and the maximum pressure.
 * @param {number} opacity Alpha value controlling blending the rasterizer
 * stroke to the target buffer. Range 0 to 1.
 * @param {number} radius The stroke radius in pixels.
 * @param {number} textureId Id of the brush tip shape texture. 0 is a circle, others are bitmap textures.
 * @param {number} softness Value controlling the softness. Range 0 to 1. Only applies to circles.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 * @return {BrushEvent} The created brush event.
 */
Picture.prototype.createBrushEvent = function (color, flow, opacity, radius,
																							 textureId, softness, mode) {
	var event = new BrushEvent(this.activeSid, this.activeSessionEventId, false,
		color, flow, opacity, radius, textureId, softness, mode);
	this.activeSessionEventId++;
	return event;
};

/**
 * Create a scatter event using the current active session. The event is marked
 * as not undone.
 * @param {Uint8Array|Array.<number>} color The RGB color of the event. Channel
 * values are between 0-255.
 * @param {number} flow Alpha value controlling blending individual brush
 * samples (circles) to each other in the rasterizer. Range 0 to 1.
 * @param {number} opacity Alpha value controlling blending the rasterizer data
 * to the target buffer. Range 0 to 1.
 * @param {number} radius The circle radius in pixels.
 * @param {number} textureId Id of the brush tip shape texture. 0 is a circle, others are bitmap textures.
 * @param {number} softness Value controlling the softness. Range 0 to 1. Only applies to circles.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 * @return {ScatterEvent} The created scatter event.
 */
Picture.prototype.createScatterEvent = function (color, flow, opacity, radius,
																								 textureId, softness, mode) {
	var event = new ScatterEvent(this.activeSid, this.activeSessionEventId,
		false, color, flow, opacity, radius, textureId, softness,
		mode);
	this.activeSessionEventId++;
	return event;
};

/**
 * Create a gradient event using the current active session. The event is marked
 * as not undone.
 * @param {Uint8Array|Array.<number>} color The RGB color of the gradient.
 * Channel values are between 0-255.
 * @param {number} opacity Alpha value controlling blending the rasterized
 * gradient to the target buffer. Range 0 to 1.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 * @return {GradientEvent} The created gradient event.
 */
Picture.prototype.createGradientEvent = function (color, opacity, mode) {
	var event = new GradientEvent(this.activeSid, this.activeSessionEventId,
		false, color, opacity, mode);
	this.activeSessionEventId++;
	return event;
};

/**
 * Create a raster import event using the current active session. The event is
 * marked as not undone.
 * @param {HTMLImageElement} importedImage The imported image.
 * @param {Rect} rect Rectangle defining the position and scale of the imported image in the buffer.
 * @return {RasterImportEvent} The created raster import event.
 */
Picture.prototype.createRasterImportEvent = function (importedImage, rect) {
	var event = new RasterImportEvent(this.activeSid, this.activeSessionEventId, false, importedImage, rect);
	this.activeSessionEventId++;
	return event;
};

/**
 * Create a buffer add event using the current active session. The event is
 * marked as not undone.
 * @param {number} id Id of the added buffer. Unique at the Picture level.
 * @param {boolean} hasAlpha Whether the buffer has an alpha channel.
 * @param {Uint8Array|Array.<number>} clearColor The RGB(A) color used to clear
 * the buffer. Channel values are integers between 0-255.
 * @return {BufferAddEvent} The created buffer adding event.
 */
Picture.prototype.createBufferAddEvent = function (id, hasAlpha, clearColor) {
	var createEvent = new BufferAddEvent(this.activeSid,
		this.activeSessionEventId, false, id,
		hasAlpha, clearColor, 1.0, 0);
	this.activeSessionEventId++;
	return createEvent;
};

/**
 * Create a buffer removal event using the current active session. The event is
 * marked as not undone.
 * @param {number} id Id of the removed buffer.
 * @return {BufferRemoveEvent} The created buffer adding event.
 */
Picture.prototype.createBufferRemoveEvent = function (id) {
	// TODO: assert(this.findBufferIndex(this.buffers, id) >= 0);
	var removeEvent = new BufferRemoveEvent(this.activeSid,
		this.activeSessionEventId, false,
		id);
	this.activeSessionEventId++;
	return removeEvent;
};

/**
 * Create a buffer move event using the current active session. The event is
 * marked as not undone.
 * @param {number} movedId Id of the moved buffer.
 * @param {number} toIndex Index to move the buffer to.
 * @return {BufferMoveEvent} The created buffer move event.
 */
Picture.prototype.createBufferMoveEvent = function (movedId, toIndex) {
	var fromIndex = this.findBufferIndex(this.buffers, movedId);
	// TODO: assert(fromIndex >= 0);
	var moveEvent = new BufferMoveEvent(this.activeSid,
		this.activeSessionEventId, false,
		movedId, fromIndex, toIndex);
	this.activeSessionEventId++;
	return moveEvent;
};

/**
 * Create a merge event merging a buffer to the one below.
 * @param {number} mergedBufferIndex The index of the top buffer that will be
 * merged. The buffer must not be already merged.
 * @param {number} opacity Alpha value controlling blending the top buffer.
 * Range 0 to 1.
 * @return {BufferMergeEvent} The created merge event.
 */
Picture.prototype.createMergeEvent = function (mergedBufferIndex, opacity) {
	// TODO: assert(mergedBufferIndex >= 0);
	var event = new BufferMergeEvent(this.activeSid, this.activeSessionEventId,
		false, opacity,
		this.buffers[mergedBufferIndex]);
	this.activeSessionEventId++;
	return event;
};

/**
 * Create an event that hides the specified event.
 * @param {number} hiddenSid The session identifier of the hidden event.
 * @param {number} hiddenSessionEventId Event/session specific identifier of the
 * hidden event.
 * @return {EventHideEvent} The created hide event.
 */
Picture.prototype.createEventHideEvent = function (hiddenSid,
																									 hiddenSessionEventId) {
	var event = new EventHideEvent(this.activeSid, this.activeSessionEventId,
		false, hiddenSid, hiddenSessionEventId);
	this.activeSessionEventId++;
	return event;
};

/**
 * Set a containing widget for this picture. The container is expected to add
 * what's returned from pictureElement() under a displayed HTML element.
 * @param {Object} container The container.
 */
Picture.prototype.setContainer = function (container) {
	this.container = container;
};

/**
 * @return {HTMLCanvasElement} the element that displays the rasterized picture.
 */
Picture.prototype.pictureElement = function () {
	return this.canvas;
};

/**
 * Initialize rasterizers.
 * @protected
 */
Picture.prototype.initRasterizers = function () {
	this.renderer.setSharedRasterizerSize(this.bitmapWidth(), this.bitmapHeight());
};

/**
 * @param {GLBuffer|CanvasBuffer} buffer The buffer to consider.
 * @return {number} The priority for selecting this buffer for reducing memory
 * budget. Higher priority means that the buffer's memory is more likely to be
 * reduced.
 */
Picture.prototype.bufferFreeingPriority = function (buffer) {
	var priority = buffer.undoStateBudget;
	if ((buffer.isRemoved() || buffer.isMerged()) &&
		buffer.undoStateBudget > 1) {
		priority += buffer.undoStateBudget - 1.5;
	}
	priority -= buffer.undoStates.length * 0.1;
	// TODO: Spice this up with a LRU scheme?
	return priority;
};

/**
 * Attempt to stay within the given memory budget.
 * @param {number} requestedFreeBytes how much space to leave free.
 */
Picture.prototype.stayWithinMemoryBudget = function (requestedFreeBytes) {
	var available = this.memoryBudget - requestedFreeBytes;
	var needToFree = this.memoryUse - available;
	var freeingPossible = true;
	while (needToFree > 0 && freeingPossible) {
		freeingPossible = false;
		var selectedBuffer = null;
		var selectedPriority = 0;
		var i;
		for (i = 0; i < this.buffers.length; ++i) {
			if (this.buffers[i].undoStateBudget > 1 && !this.buffers[i].freed) {
				freeingPossible = true;
				var priority = this.bufferFreeingPriority(this.buffers[i]);
				if (priority > selectedPriority) {
					selectedBuffer = this.buffers[i];
					selectedPriority = priority;
				}
			}
		}
		if (selectedBuffer !== null) {
			var newBudget = selectedBuffer.undoStateBudget - 1;
			selectedBuffer.setUndoStateBudget(newBudget);
			this.memoryUse -= selectedBuffer.getStateMemoryBytes();
		}
		needToFree = this.memoryUse - available;
	}
	return;
};

/**
 * @return {number} The average undo state budget of buffers that are not
 * removed or merged.
 */
Picture.prototype.averageUndoStateBudgetOfActiveBuffers = function () {
	var n = 0;
	var sum = 0;
	for (var i = 0; i < this.buffers.length; ++i) {
		if (!this.buffers[i].isRemoved()) {
			sum += this.buffers[i].undoStateBudget;
			++n;
		}
	}
	if (n > 0) {
		return sum / n;
	} else {
		return 5;
	}
};

/**
 * Free a buffer and do the related memory accounting. Can be called on a buffer
 * that is already freed, in which case the function has no effect.
 * @param {CanvasBuffer|GLBuffer} buffer Buffer to regenerate.
 * @protected
 */
Picture.prototype.freeBuffer = function (buffer) {
	if (!buffer.freed) {
		buffer.free();
		this.memoryUse -= buffer.getMemoryNeededForReservingStates();
	}
};

/**
 * Regenerate a buffer and do the related memory accounting. Can be called on a
 * buffer that is not freed, in which case the function has no effect.
 * @param {CanvasBuffer|GLBuffer} buffer Buffer to regenerate.
 * @protected
 */
Picture.prototype.regenerateBuffer = function (buffer) {
	if (buffer.freed) {
		var memIncrease = buffer.getMemoryNeededForReservingStates();
		this.stayWithinMemoryBudget(memIncrease);
		buffer.regenerate(true, this.renderer.sharedRasterizer);
		this.memoryUse += memIncrease;
	}
};

/**
 * Create a single buffer using the mode specified for this picture.
 * @param {BufferAddEvent} createEvent Event that initializes the buffer.
 * @param {boolean} hasUndoStates Does the buffer store undo states?
 * @return {GLBuffer|CanvasBuffer} The buffer.
 * @protected
 */
Picture.prototype.createBuffer = function (createEvent, hasUndoStates) {
	var buffer;
	if (this.renderer.usesWebGl()) {
		buffer = new GLBuffer(this.gl, this.glManager, this.renderer.compositor,
			this.renderer.texBlitProgram, this.renderer.rectBlitProgram, createEvent,
			this.bitmapWidth(), this.bitmapHeight(), this.pictureTransform,
			hasUndoStates, this.freed);
	} else {
		// TODO: assert(this.renderer.mode === 'canvas');
		buffer = new CanvasBuffer(createEvent, this.bitmapWidth(),
			this.bitmapHeight(), this.pictureTransform, hasUndoStates, this.freed);
	}
	if (hasUndoStates) {
		if (buffer.events[0].undone) {
			var avgBudget = this.averageUndoStateBudgetOfActiveBuffers();
			buffer.setUndoStateBudget(avgBudget);
			return buffer;
		}
		// Buffers always store their current state
		this.memoryUse += buffer.getStateMemoryBytes();
		var avgBudget = this.averageUndoStateBudgetOfActiveBuffers();
		avgBudget = Math.floor(avgBudget);
		// Request free space for current average amount of undo states.
		this.stayWithinMemoryBudget(buffer.getStateMemoryBytes() * avgBudget);
		var spaceLeftStates = Math.floor((this.memoryBudget - this.memoryUse) /
			buffer.getStateMemoryBytes());
		if (spaceLeftStates < 0) {
			console.log('Running out of GPU memory, budget set at ' +
				(this.memoryBudget / (1024 * 1024)) + ' MB');
			spaceLeftStates = 0;
		}
		if (spaceLeftStates > 5) {
			spaceLeftStates = 5; // More is a waste for a new buffer
		}
		buffer.setUndoStateBudget(spaceLeftStates);
		this.memoryUse += spaceLeftStates * buffer.getStateMemoryBytes();
		if (false) { // Debug logging
			console.log('Undo state budgets');
			for (var i = 0; i < this.buffers.length; ++i) {
				console.log(this.buffers[i].undoStateBudget);
			}
			console.log(buffer.undoStateBudget);
			console.log('GPU memory use ' +
				(this.memoryUse / (1024 * 1024)) + ' MB');
		}
	}
	return buffer;
};

/**
 * @return {number} The rasterizer bitmap width of the picture in pixels.
 */
Picture.prototype.bitmapWidth = function () {
	return this.bitmapRect.width();
};

/**
 * @return {number} The rasterizer bitmap height of the picture in pixels.
 */
Picture.prototype.bitmapHeight = function () {
	return this.bitmapRect.height();
};

/**
 * @return {number} The width of the picture's current bounds.
 */
Picture.prototype.width = function () {
	return this.boundsRect.width();
};

/**
 * @return {number} The height of the picture's current bounds.
 */
Picture.prototype.height = function () {
	return this.boundsRect.height();
};

/**
 * Do memory management after adding/redoing a remove event to a buffer.
 * @param {PictureBuffer} buffer The buffer that the remove event was applied
 * to. The event is allowed to be undone, which can cause the buffer to be not
 * actually removed.
 * @protected
 */
Picture.prototype.afterRemove = function (buffer) {
	if (buffer.events.length < buffer.undoStateInterval * 2 &&
		buffer.isRemoved()) {
		// The buffer's bitmap isn't very costly to regenerate, so it
		// can be freed.
		this.freeBuffer(buffer);
	}
};

/**
 * Add an event to the top of one of this picture's buffers. Using this
 * directly requires that you also add the same event through pushUpdate,
 * otherwise you can not use serialization or animation functionality.
 * @param {number} targetBufferId The id of the buffer to apply the event to. In
 * case the event is a buffer add event, the id is ignored.
 * @param {PictureEvent} event Event to add.
 */
Picture.prototype.pushEvent = function (targetBufferId, event) {
	if (event.isBufferStackChange()) {
		if (event.eventType === 'bufferAdd') {
			var buffer = this.createBuffer(event, true);
			this.buffers.push(buffer);
			return;
		} else if (event.eventType === 'bufferRemove') {
			var bufferIndex = this.findBufferIndex(this.buffers,
				event.bufferId);
			// TODO: assert(bufferIndex >= 0);
			this.buffers[bufferIndex].pushEvent(event, this.renderer.sharedRasterizer);
			this.afterRemove(this.buffers[bufferIndex]);
			return;
		} else if (event.eventType === 'bufferMove') {
			var fromIndex = this.findBufferIndex(this.buffers, event.movedId);
			this.buffers[fromIndex].pushEvent(event);
			if (!event.undone) {
				this.moveBufferInternal(fromIndex, event.toIndex);
			}
			return;
		}
	}
	var targetBuffer = this.findBuffer(targetBufferId);
	if (this.renderer.currentEventRasterizer.drawEvent === event) {
		targetBuffer.pushEvent(event, this.renderer.currentEventRasterizer);
	} else {
		if (event.eventType === 'bufferMerge') {
			this.undummify(event);
			// TODO: assert(event.mergedBuffer !== targetBuffer);
			targetBuffer.pushEvent(event, this.renderer.sharedRasterizer);
		} else {
			targetBuffer.pushEvent(event, this.renderer.sharedRasterizer);
		}
	}
};

/**
 * Add an event to the insertion point of one of this picture's buffers and
 * increment the insertion point. Note that performance is good only if the
 * insertion point is relatively close to the top of the buffer, and that the
 * event should maintain the rule that events with higher sessionEventIds from
 * the same session are closer to the top of the buffer than events with lower
 * sessionEventIds. Using this directly requires that you also add the same
 * event through pushUpdate, otherwise you can not use serialization or
 * animation functionality.
 * @param {number} targetBufferId The id of the buffer to insert the event to.
 * @param {PictureEvent} event Event to insert. Can not be a BufferAddEvent or
 * a BufferMoveEvent. TODO: Fix this for BufferMoveEvent.
 */
Picture.prototype.insertEvent = function (targetBufferId, event) {
	// TODO: assert(event.eventType !== 'bufferAdd' &&
	//              event.eventType !== 'bufferMove');
	if (event.eventType === 'bufferRemove') {
		var bufferIndex = this.findBufferIndex(this.buffers, event.bufferId);
		// TODO: assert(bufferIndex >= 0);
		this.buffers[bufferIndex].insertEvent(event, this.renderer.sharedRasterizer);
		this.afterRemove(this.buffers[bufferIndex]);
		return;
	}
	var targetBuffer = this.findBuffer(targetBufferId);
	if (event.eventType === 'bufferMerge') {
		this.undummify(event);
		// TODO: assert(event.mergedBuffer !== targetBuffer);
		targetBuffer.insertEvent(event, this.renderer.sharedRasterizer);
	} else {
		targetBuffer.insertEvent(event, this.renderer.sharedRasterizer);
	}
};

/**
 * Turn dummy buffer attached to an event to a reference to a real buffer.
 * @param {BufferMergeEvent} event Event to process.
 * @protected
 */
Picture.prototype.undummify = function (event) {
	if (event.mergedBuffer.isDummy) {
		var mergedBufferIndex = this.findBufferIndex(this.buffers, event.mergedBuffer.id);
		// The merged buffer may not be found when the picture is first parsed.
		if (mergedBufferIndex >= 0) {
			event.mergedBuffer = this.buffers[mergedBufferIndex];
		}
	}
};

/**
 * Find the latest event from the given session.
 * @param {number} sid The session id to search.
 * @param {boolean} canBeUndone Whether to consider undone events.
 * @return {Object} The latest event indices or null if no event found. The
 * object will have keys eventIndex, bufferIndex, and sessionEventId.
 * @protected
 */
Picture.prototype.findLatest = function (sid, canBeUndone) {
	var latestIdx = 0;
	var latestBufferIndex = 0;
	var latestId = -1;
	var i;
	for (i = 0; i < this.buffers.length; ++i) {
		var candidateIndex = this.buffers[i].findLatest(sid, canBeUndone);
		if (candidateIndex >= 0 &&
			this.buffers[i].events[candidateIndex].sessionEventId > latestId) {
			latestBufferIndex = i;
			latestIdx = candidateIndex;
			latestId = this.buffers[i].events[latestIdx].sessionEventId;
		}
	}
	if (latestId >= 0) {
		return {eventIndex: latestIdx, bufferIndex: latestBufferIndex, sessionEventId: latestId};
	}
	return null;
};

/**
 * Move a buffer in the buffer stack.
 * @param {number} fromIndex Index to move the buffer from.
 * @param {number} toIndex Index to move the buffer to.
 * @protected
 */
Picture.prototype.moveBufferInternal = function (fromIndex, toIndex) {
	// TODO: assert(fromIndex < this.buffers.length);
	// TODO: assert(toIndex < this.buffers.length);
	var buffer = this.buffers[fromIndex];
	this.buffers.splice(fromIndex, 1);
	this.buffers.splice(toIndex, 0, buffer);
};

/**
 * Undo the latest non-undone event applied to this picture by the current
 * active session. Won't do anything in case the latest event is a merge event
 * applied to a buffer that is itself removed or merged. Using this directly
 * requires that you also undo the same event through pushUpdate, otherwise
 * you can not use serialization or animation functionality.
 * @param {boolean} keepLastBuffer Don't undo the last remaining buffer.
 * Defaults to true.
 * @return {PictureEvent} The event that was undone or null if no event found.
 */
Picture.prototype.undoLatest = function (keepLastBuffer) {
	var latest = this.findLatest(this.activeSid, false);
	if (latest === null) {
		return null;
	}
	var buffer = this.buffers[latest.bufferIndex];
	if (keepLastBuffer === undefined) {
		keepLastBuffer = true;
	}
	if (keepLastBuffer && latest.eventIndex === 0) {
		var buffersLeft = 0;
		for (var i = 0; i < this.buffers.length; ++i) {
			if (!this.buffers[i].isRemoved() && !this.buffers[i].isMerged()) {
				++buffersLeft;
			}
		}
		if (buffersLeft === 1) {
			return null;
		}
	}
	return this.undoEventIndex(buffer, latest.eventIndex);
};

/**
 * Undo the event specified by the given index from the given buffer. Will
 * handle events that change the buffer stack. All undo operations go through
 * here.
 * @param {PictureBuffer} buffer Buffer to undo from.
 * @param {number} eventIndex Index of the event in the buffer.
 * @return {PictureEvent} Undone event or null if couldn't undo.
 * @protected
 */
Picture.prototype.undoEventIndex = function (buffer, eventIndex) {
	// Disallowing undoing merge events from merged buffers.
	// TODO: Consider lifting undo restrictions from merged buffers.
	var allowUndoMerge = !buffer.isMerged();
	var undone = buffer.undoEventIndex(eventIndex, this.renderer.sharedRasterizer,
		allowUndoMerge);
	if (undone) {
		if (eventIndex === 0) {
			// TODO: assert(undone.eventType === 'bufferAdd');
			this.freeBuffer(buffer);
		} else if (undone.eventType === 'bufferRemove') {
			if (!buffer.isRemoved()) { // Removed buffers can be freed
				this.regenerateBuffer(buffer);
			}
		} else if (undone.eventType === 'bufferMove' && !buffer.isMerged()) {
			// TODO: a better solution for undoing move events. This way works
			// for in-sequence undo but out-of-sequence undo will behave
			// unintuitively. Also, undoing moves for merged buffers is
			// simply ignored.
			var undoneIndex = this.findBufferIndex(this.buffers, buffer.id);
			var toIndex = Math.min(this.buffers.length - 1, undone.fromIndex);
			this.moveBufferInternal(undoneIndex, toIndex);
		}
		// TODO: assert(undone.eventType !== 'bufferMerge' && allowUndoMerge);
	}
	return undone;
};

/**
 * Undo the specified event applied to this picture.  Using this directly
 * requires that you also undo the same event through pushUpdate, otherwise
 * you can not use serialization or animation functionality.
 * @param {number} sid The session id of the event.
 * @param {number} sessionEventId The session-specific event id of the event.
 * @return {PictureEvent} Undone event or null if couldn't undo.
 */
Picture.prototype.undoEventSessionId = function (sid, sessionEventId) {
	var j = this.buffers.length;
	while (j >= 1) {
		--j;
		var i = this.buffers[j].eventIndexBySessionId(sid, sessionEventId);
		if (i >= 0) {
			if (!this.buffers[j].events[i].undone) {
				return this.undoEventIndex(this.buffers[j], i);
			}
			return this.buffers[j].events[i];
		}
	}
	return null;
};

/**
 * Redo the specified event applied to this picture by marking it not undone.
 * TODO: Redos are not supported in animation/serialization. Fix this.
 * @param {number} sid The session id of the event.
 * @param {number} sessionEventId The session-specific event id of the event.
 * @return {boolean} True if the event was found.
 */
Picture.prototype.redoEventSessionId = function (sid, sessionEventId) {
	var j = this.buffers.length;
	while (j >= 1) {
		--j;
		var i = this.buffers[j].eventIndexBySessionId(sid, sessionEventId);
		if (i >= 0) {
			var event = this.buffers[j].events[i];
			if (event.undone) {
				// TODO: Maybe this logic should be refactored so that it can be
				// shared with pushEvent
				if (event.eventType === 'bufferMerge') {
					var mergedBufferIndex =
						this.findBufferIndex(this.buffers,
							event.mergedBuffer.id);
					// TODO: assert(mergedBufferIndex !== j);
					// TODO: assert(!event.mergedBuffer.isDummy);
					this.buffers[j].redoEventIndex(i, this.renderer.sharedRasterizer);
				} else if (event.eventType === 'bufferRemove') {
					this.buffers[j].redoEventIndex(i, this.renderer.sharedRasterizer);
					this.afterRemove(this.buffers[j]);
				} else {
					if (i === 0) {
						// TODO: assert(event.eventType === 'bufferAdd');
						this.regenerateBuffer(this.buffers[j]);
					}
					this.buffers[j].redoEventIndex(i, this.renderer.sharedRasterizer);
				}
			}
			return true;
		}
	}
	return false;
};

/**
 * Remove the specified event from this picture entirely.
 * TODO: Removes are not supported in animation/serialization. Fix this.
 * @param {number} sid The session id of the event.
 * @param {number} sessionEventId The session-specific event id of the event.
 * @return {boolean} True on success.
 */
Picture.prototype.removeEventSessionId = function (sid, sessionEventId) {
	var j = this.buffers.length;
	while (j >= 1) {
		--j;
		var i = this.buffers[j].eventIndexBySessionId(sid, sessionEventId);
		if (i >= 0) {
			var undone = true;
			if (!this.buffers[j].events[i].undone) {
				undone = this.undoEventIndex(this.buffers[j], i);
			}
			if (undone) {
				this.buffers[j].removeEventIndex(i, this.renderer.sharedRasterizer);
				return true;
			} else {
				return false; // The event was not undoable
			}
		}
	}
	return false;
};

/**
 * Update the currentEvent of this picture, meant to contain the event that the
 * user is currently drawing. The event is assumed to be in the picture coordinates,
 * not in the bitmap coordinates in pixels.
 * @param {PictureEvent} cEvent The event the user is currently drawing or null.
 */
Picture.prototype.setCurrentEvent = function (cEvent) {
	this.currentEvent = cEvent;
	this.currentEventUntilCoord = undefined;
	this.updateCurrentEventMode();
};

/**
 * Update the currentEvent of this picture, meant to contain the event that is
 * currently being animated.
 * @param {PictureEvent} cEvent The event the user is currently drawing or null.
 * @param {number} untilCoord Only draw until this index.
 * @protected
 */
Picture.prototype.setCurrentAnimationEvent = function (cEvent, untilCoord) {
	this.currentEvent = cEvent;
	this.currentEventUntilCoord = untilCoord;
	this.updateCurrentEventMode();
};

/**
 * Search for event from sourceBuffer, remove it from there if it is found, and
 * push it to targetBuffer. The move should maintain the rule that events with
 * higher sessionEventIds from the same session are closer to the top of the
 * buffer than events with lower sessionEventIds.
 * TODO: Moves are not supported in animation/serialization. Fix this.
 * @param {number} targetBufferId The id of the buffer to push the event to.
 * @param {number} sourceBufferId The id of the buffer to search the event
 * from.
 * @param {PictureEvent} event The event to transfer.
 */
Picture.prototype.moveEvent = function (targetBufferId, sourceBufferId, event) {
	var src = this.findBuffer(sourceBufferId);
	var eventIndex = src.eventIndexBySessionId(event.sid, event.sessionEventId);
	if (eventIndex >= 0) {
		src.removeEventIndex(eventIndex, this.renderer.sharedRasterizer);
	}
	this.pushEvent(targetBufferId, event);
};

/**
 * Display the latest updated buffers of this picture. Call after doing changes
 * to any of the picture's buffers.
 * @param {CanvasRenderingContext2D?} ctx Context to draw the picture to. If undefined, the picture will be displayed
 * on its own element.
 */
Picture.prototype.display = function (ctx) {
	if (this.animating) {
		return;
	}
	this.renderer.display(this);
	if (ctx === undefined) {
		this.canvas.width = this.bitmapWidth();
		this.canvas.height = this.bitmapHeight();
		ctx = this.ctx;
	}
	// TODO: Would be nice to get rid of this extra copy. That should be easy once browsers have better APIs for
	// offscreen renderíng.
	ctx.drawImage(this.renderer.canvas, 0, 0);
};

/**
 * Regenerate all buffer bitmaps based on the contained events.
 */
Picture.prototype.regenerate = function () {
	this.freed = false;
	for (var i = 0; i < this.buffers.length; ++i) {
		if (this.buffers[i].freed) {
			this.buffers[i].regenerate(true, this.renderer.sharedRasterizer);
		}
	}
};

/**
 * @constructor
 * Container for animation related data.
 * @param {Picture} picture The picture that is used for replaying the animation.
 * @param {number} speed The animation playback speed.
 * @param {number} updateCount The number of updates that are shown in the animation.
 * @param {function()} pushUpdate Push a single update to the picture used for the animation.
 */
Picture.AnimationData = function (picture, speed, updateCount, pushUpdate) {
	this.picture = picture;
	this.speed = speed;
	this.updateCount = updateCount;
	this.updateIndex = 0;
	this.pushUpdate = pushUpdate;
};

/**
 * Play back an animation displaying the progress of this picture from start to
 * finish.
 * @param {number} speed Speed at which to animate the individual events. Must
 * be between 0 and 1.
 * @param {function()=} animationFinishedCallBack Function to call when the
 * animation has finished.
 * @return {boolean} Returns true if the animation was started or is still in
 * progress from an earlier call.
 */
Picture.prototype.animate = function (speed, animationFinishedCallBack) {
	if (this.animating) {
		return true;
	}
	var that = this;
	this.animating = true;

	var finishAnimating = function () {
		that.stopAnimating();
		if (animationFinishedCallBack !== undefined) {
			animationFinishedCallBack();
		}
	};

	if (this.updates.length === 0) {
		setTimeout(finishAnimating, 0);
		return true;
	}
	if (speed === undefined) {
		speed = 0.05;
	}
	var animationSpeed = speed;

	var animationPicture = new Picture(-1, 'animationPic', this.boundsRect, this.pictureTransform.scale, this.renderer);

	var updateT = 0;
	var update = null;
	var picEvent = null;

	var pushAnimationUpdate = function () {
		if (that.animationData.updateIndex < that.animationData.updateCount) {
			if (updateT === 0) {
				var updateStr = serializeToString(that.updates[that.animationData.updateIndex]);
				update = PictureUpdate.fromJS(JSON.parse(updateStr));
			}
			// TODO: assert(update !== null)
			that.animationData.picture.pushUpdate(update);
			that.animationData.picture.setCurrentAnimationEvent(null);
			++that.animationData.updateIndex;
			updateT = 0;
		} else {
			finishAnimating();
		}
	};

	this.animationData = new Picture.AnimationData(
		animationPicture, animationSpeed, this.updates.length, pushAnimationUpdate);

	var animationFrame = function () {
		if (that.animationData.updateIndex < that.animationData.updateCount) {
			if (updateT === 0) {
				var updateStr = serializeToString(that.updates[that.animationData.updateIndex]);
				update = PictureUpdate.fromJS(JSON.parse(updateStr));
				if (update.updateType === 'add_picture_event') {
					picEvent = update.pictureEvent;
					picEvent.undone = false;
					if (picEvent.eventType === 'brush') {
						that.animationData.picture.setCurrentEventAttachment(update.targetLayerId);
						that.animationData.picture.setCurrentAnimationEvent(picEvent, 0);
					} else {
						updateT = 1;
					}
				} else {
					updateT = 1;
				}
			}
			if (updateT < 1) {
				updateT += that.animationData.speed;
				if (updateT > 1) {
					updateT = 1;
				}
				var untilCoord = picEvent.coords.length * updateT;
				untilCoord = Math.ceil(untilCoord / 3) * 3;
				that.animationData.picture.setCurrentAnimationEvent(picEvent, untilCoord);

				that.animationData.picture.display(that.ctx);
				window.requestAnimationFrame(animationFrame);
			} else {
				pushAnimationUpdate();

				that.animationData.picture.display(that.ctx);
				window.setTimeout(animationFrame, 50);
			}
		} else {
			finishAnimating();
		}
	};

	animationFrame();
	return true;
};

/**
 * Scrub the animation to the given time if animation is in progress.
 * Can currently be used only to scrub forward.
 * @param {number} t Animation time from 0.0 to 1.0, inclusive.
 */
Picture.prototype.scrubAnimation = function (t) {
	while (this.animating && this.animationData.updateIndex < t * this.animationData.updateCount) {
		this.animationData.pushUpdate();
	}
	if (this.animating) {
		this.animationData.picture.display(this.ctx);
	}
};

/**
 * Stop animating if animation is in progress.
 */
Picture.prototype.stopAnimating = function () {
	if (this.animating) {
		this.animating = false;
		// TODO: this.animationData.picture.free();
		this.animationData.picture = null;
		this.animationData.pushUpdate = null;
		this.display();
	}
};

/**
 * @return {number} The current animation position from 0 to 1.
 */
Picture.prototype.getAnimationT = function () {
	if (this.animating && this.animationData.updateCount > 0) {
		return this.animationData.updateIndex / this.animationData.updateCount;
	} else {
		return 0;
	}
};

/**
 * @return {number} The current animation speed.
 */
Picture.prototype.getAnimationSpeed = function () {
	if (this.animating) {
		return this.animationData.speed;
	} else {
		return 0;
	}
};

/**
 * Return objects that contain events touching the given pixel. The objects
 * have two keys: event, and alpha which determines that event's alpha value
 * affecting this pixel. The objects are sorted from newest to oldest.
 * The results are according to which buffers are currently being composited.
 * @param {Vec2} coords Position of the pixel in bitmap coordinates.
 * @return {Array.<Object>} Objects that contain events touching this pixel.
 */
Picture.prototype.blamePixel = function (coords) {
	var blame = [];
	var j = this.buffers.length;
	while (j >= 1) {
		--j;
		if (this.buffers[j].events.length > 1 && this.buffers[j].isComposited()) {
			var bufferBlame = this.buffers[j].blamePixel(coords);
			if (bufferBlame.length > 0) {
				blame = blame.concat(bufferBlame);
			}
		}
	}
	return blame;
};

/**
 * Get a pixel from the composited picture. Displays the latest changes to the
 * picture as a side effect.
 * @param {Vec2} coords Position of the pixel in bitmap coordinates.
 * @return {Uint8Array|Uint8ClampedArray} Unpremultiplied RGBA value.
 */
Picture.prototype.getPixelRGBA = function (coords) {
	this.display();
	if (this.renderer.usesWebGl()) {
		var buffer = new ArrayBuffer(4);
		var pixelData = new Uint8Array(buffer);
		var glX = Math.min(Math.floor(coords.x), this.bitmapWidth() - 1);
		var glY = Math.max(0, this.bitmapHeight() - 1 - Math.floor(coords.y));
		this.gl.readPixels(glX, glY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE,
			pixelData);
		return pixelData;
	} else {
		return this.renderer.ctx.getImageData(Math.floor(coords.x),
			Math.floor(coords.y), 1, 1).data;
	}
};

/**
 * Generate a data URL representing this picture. Displays the latest changes to
 * the picture as a side effect.
 * @return {string} PNG data URL representing this picture.
 */
Picture.prototype.toDataURL = function () {
	this.display();
	return this.canvas.toDataURL();
};

/**
 * Generate a PNG blob representing this picture. Displays the latest changes to the picture as a side effect.
 * @param {function(Blob)} callback Callback to process the resulting blob. May be called asynchronously.
 */
Picture.prototype.toBlob = function (callback) {
	var dataURLtoBlob = function (dataURL, dataType) {
		var binary = window.atob(dataURL.split(',')[1]);
		var array = new Uint8Array(binary.length);
		for (var i = 0; i < binary.length; i++) {
			array[i] = binary.charCodeAt(i);
		}
		return new Blob([array], {'type': dataType});
	};
	callback(dataURLtoBlob(this.toDataURL(), 'image/png'));
	// TODO: When this is supported widely enough:
	// this.display();
	// this.canvas.toBlob(callback);
};

