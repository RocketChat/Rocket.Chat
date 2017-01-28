/*
 * Copyright Olli Etuaho 2012-2013.
 */

'use strict';

/**
 * A buffer for 2D picture data. Contains a series of picture events in back-
 * to-front order and a combined bitmap representation of them. Not to be
 * instanced directly.
 * @constructor
 * @protected
 */
var PictureBuffer = function () {
};

/**
 * Initialize picture buffer data.
 * @param {BufferAddEvent} createEvent Event that initializes the buffer.
 * @param {number} width Width of the buffer in pixels. Must be an integer.
 * @param {number} height Height of the buffer in pixels. Must be an integer.
 * @param {AffineTransform} transform Transform to apply to all event coordinates.
 * @param {boolean} hasUndoStates Does this buffer store undo states? Defaults
 * to false.
 * @param {boolean} freed Should this buffer be left without bitmaps?
 * @protected
 */
PictureBuffer.prototype.initializePictureBuffer = function (createEvent, width, height, transform,
																														hasUndoStates, freed) {
	// TODO: assert(createEvent.hasAlpha || createEvent.clearColor[3] === 255);
	this.hasAlpha = createEvent.hasAlpha;
	this.id = createEvent.bufferId;
	this.transform = transform;
	this.events = [];
	this.isDummy = false;
	this.mergedTo = null;
	// How many remove events are not undone in this buffer. There could be
	// multiple ones if the buffer is edited from multiple sessions.
	this.removeCount = 0;
	if (hasUndoStates === undefined) {
		hasUndoStates = false;
	}
	if (hasUndoStates) {
		this.undoStates = [];
		this.undoStateInterval = 16;
		this.undoStateBudget = 5;
	} else {
		this.undoStates = null;
	}

	this.bitmapRect = new Rect(0, width, 0, height);
	this.clipStack = [];
	this.currentClipRect = new Rect(0, width, 0, height);

	this.visible = true;
	this.insertionPoint = 0;
	if (freed === undefined) {
		freed = false;
	}
	this.freed = createEvent.undone || freed;
};

/**
 * Crop the buffer. Note that the transform set to the buffer must be updated prior to running this function.
 * @param {number} width Width of the buffer in pixels. Must be an integer.
 * @param {number} height Height of the buffer in pixels. Must be an integer.
 * @param {BaseRasterizer} rasterizer The rasterizer.
 */
PictureBuffer.prototype.crop = function (width, height, rasterizer) {
	// TODO: Consider preserving the existing data, only translating it to place.
	// The thing that makes this tricky is that the translation coordinates are not necessarily integers.
	// The picture could also be scaled when cropping to respect the maximum framebuffer size constraints.
	this.free();
	if (this.undoStates !== null) {
		for (var i = 0; i < this.undoStates.length; ++i) {
			this.undoStates[i].setDimensions(width, height);
		}
	}
	this.bitmapRect = new Rect(0, width, 0, height);
	this.clipStack = [];
	this.currentClipRect = new Rect(0, width, 0, height);
	this.regenerate(true, rasterizer);
	this.blameRasterizer = new Rasterizer(width, height, null);
};

/**
 * @return {number} The width of the buffer in pixels.
 */
PictureBuffer.prototype.width = function () {
	return this.bitmapRect.width();
};

/**
 * @return {number} The height of the buffer in pixels.
 */
PictureBuffer.prototype.height = function () {
	return this.bitmapRect.height();
};

/**
 * @return {number} The compositing opacity for this buffer.
 */
PictureBuffer.prototype.opacity = function () {
	return this.events[0].opacity;
};

/**
 * Re-rasterize all events using the given rasterizer. Subject to the current
 * clipping rectangle.
 * @param {BaseRasterizer} rasterizer The rasterizer.
 *
 */
PictureBuffer.prototype.playbackAll = function (rasterizer) {
	this.playbackStartingFrom(0, rasterizer);
};

/**
 * Re-rasterize all events starting from the given index using the given
 * rasterizer. Subject to the current clipping rectangle.
 * @param {number} eventIndex The event index to start from, inclusive. Must be
 * an integer.
 * @param {BaseRasterizer} rasterizer The rasterizer.
 *
 * @protected
 */
PictureBuffer.prototype.playbackStartingFrom = function (eventIndex,
																												 rasterizer) {
	var clipRect = this.getCurrentClipRect();
	var nextUndoStateIndex = this.previousUndoStateIndex(eventIndex) + 1;
	for (var i = eventIndex; i < this.events.length; i++) {
		if (!this.events[i].undone &&
			this.events[i].boundsIntersectRect(clipRect, this.transform)) {
			this.applyEvent(this.events[i], rasterizer);
		}
		if (this.undoStates !== null && !this.freed &&
			nextUndoStateIndex < this.undoStates.length &&
			this.undoStates[nextUndoStateIndex].index === i + 1 &&
			this.undoStates[nextUndoStateIndex].invalid) {
			this.repairUndoState(this.undoStates[nextUndoStateIndex]);
			++nextUndoStateIndex;
		}
	}
};

/**
 * Apply an event to the picture buffer. Subject to the current clipping rectangle. Will recursively regenerate merged
 * buffers if necessary in case of a merge event.
 * @param {PictureEvent} event The event to rasterize and apply.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 *
 * @protected
 */
PictureBuffer.prototype.applyEvent = function (event, rasterizer) {
	if (this.freed) {
		return;
	} else if (event.isRasterized()) {
		if (event.hideCount > 0) {
			return;
		}
		var boundingBox = event.getBoundingBox(this.bitmapRect, this.transform);
		this.pushClipRect(boundingBox);
		if (this.getCurrentClipRect().isEmpty()) {
			this.popClip();
			return;
		}
		rasterizer.setClip(this.getCurrentClipRect());
		event.drawTo(rasterizer, this.transform);
		this.drawRasterizerWithColor(rasterizer, event.color, event.opacity,
			event.mode);
		this.popClip();
	} else if (event.eventType === 'rasterImport') {
		var transformedRect = new Rect();
		transformedRect.setRect(event.rect);
		this.transform.transformRect(transformedRect);
		this.drawImage(event.importedImage, transformedRect);
	} else if (event.eventType === 'bufferMerge') {
		// TODO: assert(event.mergedBuffer !== this);
		event.mergedBuffer.mergedTo = this;
		if (!event.mergedBuffer.events[0].undone) {
			// TODO: assert(event.mergedBuffer.removeCount === 0)
			if (event.mergedBuffer.freed) {
				event.mergedBuffer.regenerate(true, rasterizer);
			}
			// TODO: assert(!event.mergedBuffer.freed);
			this.drawBuffer(event.mergedBuffer, event.opacity);
		}
	} else if (event.eventType === 'bufferAdd') {
		this.clear(event.clearColor);
	} // Nothing to be done on remove or eventHideEvent
};

/**
 * Apply an event that should not be re-applied on playback.
 * @param {PictureEvent} event The event to apply.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 *
 * @protected
 */
PictureBuffer.prototype.applyCountingEvent = function (event, rasterizer) {
	if (event.eventType === 'bufferRemove') {
		++this.removeCount;
	} else if (event.eventType === 'eventHide') {
		var i = this.eventIndexBySessionId(event.hiddenSid,
			event.hiddenSessionEventId);
		if (i >= 0) {
			// TODO: assert(this.events[i].isRasterized());
			++this.events[i].hideCount;
			if (this.events[i].hideCount === 1) {
				this.playbackAfterChange(i, rasterizer, 0, 0);
			}
		}
	}
};

/**
 * Push an event to the top of this buffer's event stack.
 * @param {PictureEvent} event Event to push.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 *
 */
PictureBuffer.prototype.pushEvent = function (event, rasterizer) {
	this.events.push(event);
	if (!event.undone) {
		this.applyEvent(event, rasterizer);
		this.applyCountingEvent(event, rasterizer);
		this.lastEventChanged(rasterizer);
	}
};

/**
 * Called from a merged buffer when its contents have changed and need to be
 * updated.
 * @param {PictureBuffer} changedBuffer The merged buffer that changed.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 *
 * @protected
 */
PictureBuffer.prototype.mergedBufferChanged = function (changedBuffer,
																												rasterizer) {
	var i = this.events.length;
	while (i > 0) {
		--i;
		if (this.events[i].eventType === 'bufferMerge' &&
			this.events[i].mergedBuffer === changedBuffer) {
			this.playbackAfterChange(i, rasterizer, 0, 0);
			return;
		}
	}
};

/**
 * Insert an event at the current insertion point and increment the insertion
 * point. Note that performance is good only if the insertion point is
 * relatively close to the top of the buffer, and that the event should maintain
 * the rule that events with higher sessionEventIds from the same session are
 * closer to the top of the buffer than events with lower sessionEventIds.
 * @param {PictureEvent} event Event to insert.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 *
 */
PictureBuffer.prototype.insertEvent = function (event, rasterizer) {
	if (this.insertionPoint === this.events.length) {
		this.pushEvent(event, rasterizer);
	} else {
		this.events.splice(this.insertionPoint, 0, event);
		if (!event.undone) {
			this.applyCountingEvent(event, rasterizer);
			this.playbackAfterChange(this.insertionPoint, rasterizer, 1, 1);
		} else {
			this.changeUndoStatesFrom(this.insertionPoint, false, 0, 1);
		}
	}
	this.setInsertionPoint(this.insertionPoint + 1);
};

/**
 * Change the insertion point.
 * @param {number} insertionPoint The insertion point to set. Must be an integer
 * event index.
 */
PictureBuffer.prototype.setInsertionPoint = function (insertionPoint) {
	// TODO: assert(insertionPoint > 0) // First event is always create event
	this.insertionPoint = insertionPoint;
	// TODO: Maintain an undo state exactly at the insertion point.
};

/**
 * Replace all the buffer contents with the given event. Meant for interactively
 * editing and displaying an event as efficiently as possible.
 * @param {PictureEvent} event The event to draw to the buffer. Can be null, in
 * which case the buffer is cleared completely.
 * @param {BaseRasterizer} rasterizer The rasterizer to use. The clip rect
 * should be set in the rasterizer in advance.
 *
 */
PictureBuffer.prototype.replaceWithEvent = function (event, rasterizer) {
	// TODO: assert(this.clipStack.length === 0);
	if (this.events.length > 2) {
		this.clear(this.events[0].clearColor);
	} else if (this.events.length === 2) {
		this.pushClipRect(this.events[1].getBoundingBox(this.bitmapRect, this.transform));
		this.clear(this.events[0].clearColor);
		this.popClip();
	}
	this.events.splice(1, this.events.length);
	while (this.undoStates !== null && this.undoStates.length > 0) {
		this.spliceUndoState(0);
	}
	if (event !== null) {
		this.pushEvent(event, rasterizer);
	}
};

/**
 * Return objects that contain events touching the given pixel. The objects
 * have two keys: event, and alpha which determines that event's alpha value
 * affecting this pixel. The objects are sorted from front to back.
 * @param {Vec2} coords Position of the pixel in bitmap coordinates.
 *
 * @return {Array.<Object>} Objects that contain events touching this pixel.
 */
PictureBuffer.prototype.blamePixel = function (coords) {
	var i = this.events.length - 1;
	var coordsRect = new Rect(Math.floor(coords.x), Math.floor(coords.x) + 1,
		Math.floor(coords.y), Math.floor(coords.y) + 1);
	this.blameRasterizer.setClip(coordsRect);
	var blame = [];
	while (i >= 1) {
		if (!this.events[i].undone && this.events[i].isRasterized() &&
			this.events[i].hideCount === 0) {
			var boundingBox = this.events[i].getBoundingBox(coordsRect, this.transform);
			if (boundingBox.containsRoundedOut(coords)) {
				this.events[i].drawTo(this.blameRasterizer, this.transform);
				if (this.blameRasterizer.getPixel(coords) !== 0) {
					var blameAlpha = this.blameRasterizer.getPixel(coords) *
						this.events[i].opacity;
					blame.push({event: this.events[i], alpha: blameAlpha});
				}
			}
		}
		--i;
	}
	return blame;
};

/**
 * @return {Rect} Reference to the current clipping rectangle, that is the
 * intersection of all the rectangles in the clipping stack. Do not modify the
 * return value.
 */
PictureBuffer.prototype.getCurrentClipRect = function () {
	return this.currentClipRect;
};

/**
 * Push a rectangle to the clipping rectangle stack.
 * @param {Rect} rect The rectangle to clip with.
 */
PictureBuffer.prototype.pushClipRect = function (rect) {
	this.clipStack.push(rect);
	this.currentClipRect.intersectRectRoundedOut(rect);
};

/**
 * Remove the topmost rectangle from the clipping rectangle stack.
 */
PictureBuffer.prototype.popClip = function () {
	// TODO: Make this an assert.
	if (this.clipStack.length === 0) {
		console.log('Tried to pop from empty clipStack!');
		return;
	}
	this.clipStack.pop();
	this.currentClipRect.setRect(this.bitmapRect);
	for (var i = 0; i < this.clipStack.length; ++i) {
		this.currentClipRect.intersectRectRoundedOut(this.clipStack[i]);
	}
};

/**
 * Search for an event in the buffer by session id and session event id.
 * @param {number} searchSid Session identifier. Must be an integer.
 * @param {number} searchSessionEventId An event/session specific identifier.
 * @return {number} Index of the event in the buffer or -1 if not found.
 */
PictureBuffer.prototype.eventIndexBySessionId = function (searchSid,
																													searchSessionEventId) {
	for (var e = 0; e < this.events.length; e++) {
		if (this.events[e].sid === searchSid) {
			if (this.events[e].sessionEventId === searchSessionEventId) {
				return e;
			} else if (this.events[e].sessionEventId > searchSessionEventId) {
				return -1;
			}
		}
	}
	return -1;
};

/**
 * @param {number} sid Session identifier. Must be an integer.
 * @param {boolean} canBeUndone Whether to consider undone events.
 * @return {number} The index of the latest event added with the given session
 * id or -1 if not found.
 */
PictureBuffer.prototype.findLatest = function (sid, canBeUndone) {
	var i = this.events.length - 1;
	while (i >= 0) {
		if ((canBeUndone || !this.events[i].undone) &&
			this.events[i].sid === sid) {
			return i;
		}
		i--;
	}
	return -1;
};

/**
 * Save an undo state.
 * @param {number} cost Regeneration cost of the undo state.
 * @return {Object} The undo state.
 */
PictureBuffer.prototype.saveUndoState = function (cost) {
	console.log('Unimplemented saveUndoState in PictureBuffer object');
	return null;
};

/**
 * Repair an undo state using the current bitmap and clip rect.
 * @param {Object} undoState The state to repair.
 */
PictureBuffer.prototype.repairUndoState = function (undoState) {
	console.log('Unimplemented repairUndoState in PictureBuffer object');
};

/**
 * Remove a stored undo state.
 * @param {number} splicedIndex The index of the undo state in the undoStates
 * array.
 * @protected
 */
PictureBuffer.prototype.spliceUndoState = function (splicedIndex) {
	// TODO: assert(splicedIndex < this.undoStates.length);
	if (splicedIndex + 1 < this.undoStates.length) {
		this.undoStates[splicedIndex + 1].cost +=
			this.undoStates[splicedIndex].cost;
	}
	this.undoStates[splicedIndex].free();
	this.undoStates.splice(splicedIndex, 1);
};

/**
 * Remove undo states until within given budget.
 * @protected
 */
PictureBuffer.prototype.stayWithinUndoStateBudget = function () {
	while (this.undoStates.length > this.undoStateBudget) {
		var stateToRemove = 0;
		var stateToRemoveWorth = (1 << 30);
		// Consider all states for removal except the last one.
		for (var i = 0; i < this.undoStates.length - 1; ++i) {
			var distanceFromEnd = this.events.length - this.undoStates[i].index;
			var worth = this.undoStates[i].cost / (distanceFromEnd + 1);
			if (worth < stateToRemoveWorth) {
				stateToRemove = i;
				stateToRemoveWorth = worth;
			}
		}
		this.spliceUndoState(stateToRemove);
	}
};

/**
 * Adjust the undo state budget allocated for this buffer.
 * @param {number} undoStateBudget How many undo states this buffer can use at
 * maximum. Minimum is 1, recommended at least 3 if events in this buffer are
 * being undone. Using more memory will make undo faster especially for older
 * operations.
 */
PictureBuffer.prototype.setUndoStateBudget = function (undoStateBudget) {
	// TODO: assert(undoStateBudget >= 1);
	if (this.undoStates !== null) {
		this.undoStateBudget = undoStateBudget;
		this.stayWithinUndoStateBudget();
	}
};

/**
 * @return {number} Bytes per pixel used for storing the state of this buffer's
 * bitmap.
 * @protected
 */
PictureBuffer.prototype.bytesPerPixel = function () {
	return this.hasAlpha ? 4 : 3;
};

/**
 * @return {number} Amount of memory required for storing a single state of this
 * buffer's bitmap, either the current state or an undo state, in bytes.
 */
PictureBuffer.prototype.getStateMemoryBytes = function () {
	return this.width() * this.height() * this.bytesPerPixel();
};

/**
 * @return {number} Amount of memory needed for reserving this buffer's undo
 * states and current state. Does not take into account whether the buffer is
 * actually freed or not at the moment!
 */
PictureBuffer.prototype.getMemoryNeededForReservingStates = function () {
	return this.getStateMemoryBytes() * (this.undoStateBudget + 1);
};

/**
 * Called after a new event has been pushed and applied. Updates undo states if
 * necessary.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 */
PictureBuffer.prototype.lastEventChanged = function (rasterizer) {
	if (this.undoStates !== null) {
		var previousState = this.previousUndoState(this.events.length);

		// Find out how many new non-undone events are there?
		var newEvents = this.events.length - previousState.index;
		var i = this.events.length;
		while (newEvents >= this.undoStateInterval && i > previousState.index) {
			--i;
			if (this.events[i].undone) {
				--newEvents;
			}
		}
		if (newEvents >= this.undoStateInterval) {
			// Time to save a new undo state. Set the regeneration cost to
			// amount of new events.
			// TODO: A cost measure that's relative to how much effort the
			// events really take to regenerate?
			var newUndoState = this.saveUndoState(newEvents);
			if (newUndoState !== null) {
				this.undoStates.push(newUndoState);
				this.stayWithinUndoStateBudget();
			}
		}
	}
	if (this.isMerged()) {
		this.mergedTo.mergedBufferChanged(this, rasterizer);
	}
};

/**
 * @param {number} eventIndex The index of the event.
 * @return {number} The index of the latest undo state in the undoStates array
 * that is good for undoing the event at the given index, or -1 if no undo state
 * was found.
 * @protected
 */
PictureBuffer.prototype.previousUndoStateIndex = function (eventIndex) {
	// TODO: assert(eventIndex > 0); // event 0 is the buffer add event, which
	// is undone at a higher level.
	if (this.undoStates !== null) {
		var i = this.undoStates.length - 1;
		while (i >= 0) {
			if (this.undoStates[i].index <= eventIndex && !this.undoStates[i].invalid) {
				return i;
			}
			--i;
		}
	}
	return -1;
};

/**
 * @param {number} eventIndex The index of the event.
 * @return {Object} The latest undo state that is good for undoing the event at
 * the given index.
 * @protected
 */
PictureBuffer.prototype.previousUndoState = function (eventIndex) {
	var i = this.previousUndoStateIndex(eventIndex);
	if (i >= 0) {
		return this.undoStates[i];
	} else {
		return {index: 0};
	}
};

/**
 * Change undo state data for states following a given index.
 * @param {number} eventIndex The event index where the events array changed.
 * @param {boolean} invalidate Whether to invalidate following states.
 * @param {number} costChange How much to change the cost of the undo state that
 * would have to apply the event at eventIndex if it were regenerated.
 * @param {number} indexMove How much to increment the index of undo states that
 * contain the event at eventIndex.
 * @protected
 */
PictureBuffer.prototype.changeUndoStatesFrom = function (eventIndex, invalidate,
																												 costChange, indexMove) {
	if (this.undoStates !== null) {
		var i = 0;
		var changeCost = true;
		while (i < this.undoStates.length) {
			if (this.undoStates[i].index > eventIndex) {
				if (invalidate) {
					this.undoStates[i].invalid = true;
				}
				if (changeCost) {
					this.undoStates[i].cost += costChange;
					changeCost = false; // only one undo state carries the cost
				}
				this.undoStates[i].index += indexMove;
				if (i > 0 &&
					this.undoStates[i].index === this.undoStates[i - 1].index) {
					// This undo state is useless
					this.spliceUndoState(i);
				}
			}
			++i;
		}
	}
};

/**
 * Apply the given undo state to the bitmap.
 * @param {Object} undoState The undo state. May be just a dummy state signaling
 * clearing the buffer.
 * @protected
 */
PictureBuffer.prototype.applyState = function (undoState) {
	if (undoState.index !== 0 && !this.freed) {
		this.applyStateObject(undoState);
	}
};

/**
 * Apply the given undo state to the bitmap. Must be a real undo state. This
 * dummy implementation just falls back to a clear, meant to be overridden in
 * inheriting objects.
 * @param {Object} undoState The undo state to apply.
 * @protected
 */
PictureBuffer.prototype.applyStateObject = function (undoState) {
	console.log('Unimplemented applyStateObject in PictureBuffer object');
	undoState.index = 0;
};

/**
 * Undo the non-undone event at the given index.
 * @param {number} eventIndex Event index in the buffer.
 * @param {BaseRasterizer} rasterizer The rasterizer to use to update the
 * bitmap.
 * @param {boolean} allowUndoMerge Allow undoing merge events.
 * @return {PictureEvent} The undone event or null if nothing was undone.
 */
PictureBuffer.prototype.undoEventIndex = function (eventIndex, rasterizer,
																									 allowUndoMerge) {
	if (this.events[eventIndex].undone) {
		console.log('Tried to undo event that was already undone');
		return null;
	}
	if (this.events[eventIndex].eventType === 'bufferMerge') {
		if (!allowUndoMerge) {
			return null;
		}
		this.events[eventIndex].mergedBuffer.mergedTo = null;
	} else if (this.events[eventIndex].eventType === 'bufferRemove') {
		--this.removeCount;
	} else if (this.events[eventIndex].eventType === 'eventHide') {
		var i = this.eventIndexBySessionId(this.events[eventIndex].hiddenSid,
			this.events[eventIndex].hiddenSessionEventId);
		if (i >= 0) {
			--this.events[i].hideCount;
			if (this.events[i].hideCount === 0) {
				// TODO: Whether events are hidden should factor into undo state
				// cost.
				this.playbackAfterChange(i, rasterizer, 0, 0);
			}
		}
	}
	this.events[eventIndex].undone = true;
	// TODO: Buffer moves or removes and event hides don't actually cost
	// anything to regenerate, so take that into account
	this.playbackAfterChange(eventIndex, rasterizer, -1, 0);
	return this.events[eventIndex];
};

/**
 * Fix the bitmap by playback after changing the event at eventIndex.
 * @param {number} eventIndex Index of the first event to play back at minimum.
 * @param {BaseRasterizer} rasterizer The rasterizer to use to update the
 * bitmap.
 * @param {number} followingStateCostChange How much to change the cost of the
 * undo state that would have to apply the event at eventIndex if it were
 * regenerated.
 * @param {number} followingStateMove How much to increment the index of undo
 * states that contain the event at eventIndex.
 * @protected
 */
PictureBuffer.prototype.playbackAfterChange = function (eventIndex, rasterizer,
																												followingStateCostChange,
																												followingStateMove) {
	if (this.events[eventIndex].eventType === 'bufferMove' ||
		this.events[eventIndex].eventType === 'bufferRemove' ||
		this.events[eventIndex].eventType === 'eventHide' ||
		this.events[0].undone) {
		// If event 0 is undone, we can defer real playback until it's redone.
		// Other event types covered here don't affect the bitmap state by
		// themselves (the event which has its hideCount altered is handled
		// separately).
		this.changeUndoStatesFrom(eventIndex, false, followingStateCostChange,
			followingStateMove);
	} else {
		var bBox = this.events[eventIndex].getBoundingBox(this.bitmapRect, this.transform);
		this.pushClipRect(bBox);
		// Undo states following the event are invalidated. The invalidated
		// area is not stored, but it is effectively bBox. playbackStartingFrom
		// uses the same bBox to repair the invalidated undo states.
		this.changeUndoStatesFrom(eventIndex, true, followingStateCostChange,
			followingStateMove);
		var undoState = this.previousUndoState(eventIndex);
		this.applyState(undoState);
		this.playbackStartingFrom(undoState.index, rasterizer);
		this.popClip();
	}
	if (this.isMerged()) {
		this.mergedTo.mergedBufferChanged(this, rasterizer);
	}
};

/**
 * Redo the undone event at the given index. The event's order does not change.
 * @param {number} eventIndex Event index in the buffer.
 * @param {BaseRasterizer} rasterizer The rasterizer to use to update the
 * bitmap.
 */
PictureBuffer.prototype.redoEventIndex = function (eventIndex, rasterizer) {
	if (!this.events[eventIndex].undone) {
		console.log('Tried to redo event that was not undone');
		return;
	}
	this.events[eventIndex].undone = false;
	this.applyCountingEvent(this.events[eventIndex], rasterizer);
	if (eventIndex === this.events.length - 1) {
		this.applyEvent(this.events[eventIndex], rasterizer);
		if (this.undoStates !== null && this.undoStates.length > 0 &&
			this.undoStates[this.undoStates.length - 1].index > eventIndex) {
			++this.undoStates[this.undoStates.length - 1].cost;
		}
		this.lastEventChanged(rasterizer);
	} else {
		this.playbackAfterChange(eventIndex, rasterizer, 1, 0);
	}
	return;
};

/**
 * Remove the event at the given index.
 * @param {number} eventIndex Event index in the buffer.
 * @param {BaseRasterizer} rasterizer The rasterizer to use to update the
 * bitmap.
 */
PictureBuffer.prototype.removeEventIndex = function (eventIndex, rasterizer) {
	if (!this.events[eventIndex].undone) {
		// TODO: maybe a better way to handle merge events
		if (this.undoEventIndex(eventIndex, rasterizer, false)) {
			this.events.splice(eventIndex, 1);
			this.changeUndoStatesFrom(eventIndex, false, 0, -1);
		}
	} else {
		this.events.splice(eventIndex, 1);
	}
};

/**
 * @return {boolean} True if this buffer completely covers everything below when
 * compositing.
 */
PictureBuffer.prototype.isOpaque = function () {
	return !this.hasAlpha && this.opacity() === 1.0;
};

/**
 * @param {Rect} rect Rectangle to pick events from.
 * @return {Array.<PictureEvent>} Events mostly inside the given rect.
 */
PictureBuffer.prototype.pickEventsMostlyInside = function (rect) {
	var inside = [];
	for (var i = 1; i < this.events.length; ++i) {
		var bb = this.events[i].getBoundingBox(this.bitmapRect, this.transform);
		if (bb && !this.events[i].undone && bb.isMostlyInside(rect)) {
			inside.push(this.events[i]);
		}
	}
	return inside;
};

/**
 * @return {boolean} Whether this buffer should be considered removed.
 */
PictureBuffer.prototype.isRemoved = function () {
	return this.events[0].undone || this.removeCount > 0;
};

/**
 * @return {boolean} Whether this buffer is merged to another buffer.
 */
PictureBuffer.prototype.isMerged = function () {
	return this.mergedTo !== null;
};

/**
 * @return {boolean} Whether this buffer should be composited.
 */
PictureBuffer.prototype.isComposited = function () {
	return this.visible && !this.isRemoved() && !this.isMerged();
};

/**
 * @return {boolean} Whether this buffer should be listed in layer lists.
 */
PictureBuffer.prototype.isListed = function () {
	return !this.isRemoved() && !this.isMerged();
};

/**
 * A PictureBuffer implementation with a canvas backing for the bitmap.
 * @constructor
 * @param {BufferAddEvent} createEvent Event that initializes the buffer.
 * @param {number} width Width of the buffer in pixels. Must be an integer.
 * @param {number} height Height of the buffer in pixels. Must be an integer.
 * @param {AffineTransform} transform Transform to apply to all event coordinates.
 * @param {boolean} hasUndoStates Does this buffer store undo states?
 * @param {boolean} freed Should this buffer be left without bitmaps?
 */
var CanvasBuffer = function (createEvent, width, height, transform, hasUndoStates, freed) {
	this.initializePictureBuffer(createEvent, width, height, transform, hasUndoStates, freed);
	this.canvas = null;
	this.ctx = null;
	if (!this.freed) {
		this.createCanvas();
	}

	this.blameRasterizer = new Rasterizer(width, height, null);
	this.insertEvent(createEvent, null); // will clear the buffer
};

CanvasBuffer.prototype = new PictureBuffer();

/**
 * Create a canvas for storing this buffer's current state.
 * @protected
 */
CanvasBuffer.prototype.createCanvas = function () {
	// TODO: assert(!this.canvas);
	this.canvas = document.createElement('canvas');
	this.canvas.width = this.width();
	this.canvas.height = this.height();
	this.ctx = this.canvas.getContext('2d');
};

/**
 * Clean up any allocated resources. To make the buffer usable again after this,
 * call regenerate.
 */
CanvasBuffer.prototype.free = function () {
	this.freed = true;
	this.ctx = null;
	this.canvas = null;
	if (this.undoStates !== null) {
		for (var i = 0; i < this.undoStates.length; ++i) {
			this.undoStates[i].free();
		}
	}
};

/**
 * Call after freeing to restore bitmaps.
 * @param {boolean} regenerateUndoStates Whether to regenerate undo states.
 * @param {Rasterizer} rasterizer Rasterizer to use.
 */
CanvasBuffer.prototype.regenerate = function (regenerateUndoStates, rasterizer) {
	this.freed = false;
	this.createCanvas();
	if (!regenerateUndoStates) {
		this.undoStates = [];
	}
	this.playbackAll(rasterizer);
};

/**
 * Save an undo state.
 * @param {number} cost Regeneration cost of the undo state.
 * @return {CanvasUndoState} The undo state.
 */
CanvasBuffer.prototype.saveUndoState = function (cost) {
	return new CanvasUndoState(this.events.length, cost, this.width(),
		this.height(), this.canvas);
};

/**
 * Repair an undo state using the current bitmap and clip rect.
 * @param {CanvasUndoState} undoState The state to repair.
 */
CanvasBuffer.prototype.repairUndoState = function (undoState) {
	undoState.update(this.canvas, this.getCurrentClipRect());
};

/**
 * Apply the given undo state to the bitmap. Must be a real undo state.
 * @param {CanvasUndoState} undoState The undo state to apply.
 * @protected
 */
CanvasBuffer.prototype.applyStateObject = function (undoState) {
	undoState.draw(this.ctx, this.getCurrentClipRect());
};

/**
 * Clear the bitmap. Subject to the current clipping rectangle.
 * @param {Uint8Array|Array.<number>} clearColor The RGB(A) color to use when
 * clearing the buffer. Unpremultiplied and channel values are between 0-255.
 * @protected
 */
CanvasBuffer.prototype.clear = function (clearColor) {
	var br = this.getCurrentClipRect().getXYWHRoundedOut();
	if (clearColor.length === 4 && clearColor[3] < 255) {
		this.ctx.clearRect(br.x, br.y, br.w, br.h);
	}
	if (clearColor.length === 4) {
		if (clearColor[3] !== 0) {
			this.ctx.fillStyle = cssUtil.rgbaString(clearColor);
			this.ctx.fillRect(br.x, br.y, br.w, br.h);
		}
	} else {
		this.ctx.fillStyle = cssUtil.rgbString(clearColor);
		this.ctx.fillRect(br.x, br.y, br.w, br.h);
	}
};

/**
 * @param {Vec2} coords Position of the pixel in bitmap coordinates.
 * @return {Uint8ClampedArray} Unpremultiplied RGBA value.
 */
CanvasBuffer.prototype.getPixelRGBA = function (coords) {
	var imageData = this.ctx.getImageData(coords.x, coords.y, 1, 1);
	return imageData.data;
};

/**
 * Draw the given rasterizer's contents with the given color to the buffer's
 * bitmap. If the event would erase from a buffer with no alpha channel, draws
 * with the background color instead.
 * @param {Rasterizer} raster The rasterizer to draw.
 * @param {Uint8Array|Array.<number>} color Color to use for drawing. Channel
 * values should be 0-255.
 * @param {number} opacity Opacity to use when drawing the rasterization result.
 * Opacity for each individual pixel is its rasterized opacity times this
 * opacity value.
 * @param {PictureEvent.Mode} mode Blending mode to use for drawing.
 * @protected
 */
CanvasBuffer.prototype.drawRasterizerWithColor = function (raster, color,
																													 opacity, mode) {
	if (mode === PictureEvent.Mode.erase && !this.hasAlpha) {
		mode = PictureEvent.Mode.normal;
		color = this.events[0].clearColor;
	}
	CanvasBuffer.drawRasterizer(this.ctx, this.ctx, raster,
		this.getCurrentClipRect(),
		!this.hasAlpha, color, opacity, mode);
};

/**
 * Draw the given rasterizer's contents blended with the image from dataCtx to
 * targetCtx.
 * @param {CanvasRenderingContext2D} dataCtx Context to get the source data to
 * blend with.
 * @param {CanvasRenderingContext2D} targetCtx Target context to place the
 * blending result. May be the same as dataCtx, which effectively blends the
 * raster to the dataCtx.
 * @param {Rasterizer} raster The rasterizer to draw.
 * @param {Rect} clipRect Clipping rectangle to use for both dataCtx and
 * targetCtx.
 * @param {boolean} opaque Whether the target buffer should be treated as
 * opaque.
 * @param {Uint8Array|Array.<number>} color Color to use for drawing. Channel
 * values should be 0-255.
 * @param {number} opacity Opacity to use when drawing the rasterization result.
 * Opacity for each individual pixel is its rasterized opacity times this
 * opacity value.
 * @param {PictureEvent.Mode} mode Blending mode to use for drawing.
 */
CanvasBuffer.drawRasterizer = function (dataCtx, targetCtx, raster, clipRect,
																				opaque, color, opacity, mode) {
	var br = clipRect.getXYWHRoundedOut();
	if (br.w === 0 || br.h === 0) {
		return;
	}
	// TODO: assert(br.x >= 0 && br.y >= 0 && br.x + br.w <= this.width &&
	// br.y + br.h <= this.height);
	var targetData = dataCtx.getImageData(br.x, br.y, br.w, br.h);
	if (opaque &&
		(mode === PictureEvent.Mode.normal ||
		mode === PictureEvent.Mode.erase)) {
		raster.drawWithColorToOpaque(targetData, color, opacity,
			br.x, br.y, br.w, br.h);
	} else if (mode === PictureEvent.Mode.normal) {
		raster.drawWithColor(targetData, color, opacity,
			br.x, br.y, br.w, br.h);
	} else if (mode === PictureEvent.Mode.erase) {
		raster.erase(targetData, opacity, br.x, br.y, br.w, br.h);
	} else {
		var blendFunction = null;
		switch (mode) {
			case PictureEvent.Mode.multiply:
				blendFunction = colorUtil.blendMultiply;
				break;
			case PictureEvent.Mode.screen:
				blendFunction = colorUtil.blendScreen;
				break;
			case PictureEvent.Mode.overlay:
				blendFunction = colorUtil.blendOverlay;
				break;
			case PictureEvent.Mode.darken:
				blendFunction = colorUtil.blendDarken;
				break;
			case PictureEvent.Mode.darken:
				blendFunction = colorUtil.blendDarken;
				break;
			case PictureEvent.Mode.lighten:
				blendFunction = colorUtil.blendLighten;
				break;
			case PictureEvent.Mode.difference:
				blendFunction = colorUtil.blendDifference;
				break;
			case PictureEvent.Mode.exclusion:
				blendFunction = colorUtil.blendExclusion;
				break;
			case PictureEvent.Mode.hardlight:
				blendFunction = colorUtil.blendHardLight;
				break;
			case PictureEvent.Mode.softlight:
				blendFunction = colorUtil.blendSoftLight;
				break;
			case PictureEvent.Mode.colorburn:
				blendFunction = colorUtil.blendColorBurn;
				break;
			case PictureEvent.Mode.linearburn:
				blendFunction = colorUtil.blendLinearBurn;
				break;
			case PictureEvent.Mode.vividlight:
				blendFunction = colorUtil.blendVividLight;
				break;
			case PictureEvent.Mode.linearlight:
				blendFunction = colorUtil.blendLinearLight;
				break;
			case PictureEvent.Mode.pinlight:
				blendFunction = colorUtil.blendPinLight;
				break;
			case PictureEvent.Mode.colordodge:
				blendFunction = colorUtil.blendColorDodge;
				break;
			case PictureEvent.Mode.lineardodge:
				blendFunction = colorUtil.blendLinearDodge;
				break;
		}
		if (blendFunction !== null) {
			raster.blendPerChannel(targetData, color, opacity, br.x, br.y, br.w, br.h, blendFunction);
		}
	}
	targetCtx.putImageData(targetData, br.x, br.y);
};

/**
 * Blend an image with this buffer.
 * @param {HTMLImageElement} img Image to draw.
 * @param {Rect} rect The extents of the image in this buffer's coordinates.
 */
CanvasBuffer.prototype.drawImage = function (img, rect) {
	var br = this.getCurrentClipRect().getXYWHRoundedOut();
	if (br.w === 0 || br.h === 0) {
		return;
	}
	this.ctx.save(); // Clip
	this.ctx.beginPath();
	this.ctx.rect(br.x, br.y, br.w, br.h);
	this.ctx.clip();
	this.ctx.drawImage(img, rect.left, rect.top, rect.right - rect.left, rect.bottom - rect.top);
	this.ctx.restore();
};

/**
 * Blend another buffer with this one.
 * @param {CanvasBuffer} buffer Buffer to blend.
 * @param {number} opacity Opacity to blend with.
 * @protected
 */
CanvasBuffer.prototype.drawBuffer = function (buffer, opacity) {
	// TODO: Should rather use the compositor for this, but it needs some API
	// changes.
	var br = this.getCurrentClipRect().getXYWHRoundedOut();
	if (br.w === 0 || br.h === 0) {
		return;
	}
	this.ctx.globalAlpha = opacity;
	this.ctx.drawImage(buffer.canvas, br.x, br.y, br.w, br.h,
		br.x, br.y, br.w, br.h);
	this.ctx.globalAlpha = 1.0;
};

/**
 * @return {number} Bytes per pixel used for storing the state of this buffer's
 * bitmap.
 * @protected
 */
CanvasBuffer.prototype.bytesPerPixel = function () {
	return 4;
};


/**
 * A PictureBuffer implementation with a GL texture backing for the bitmap.
 * @constructor
 * @param {WebGLRenderingContext} gl The rendering context.
 * @param {Object} glManager The state manager returned by glStateManager() in
 * utilgl.
 * @param {GLCompositor} compositor The compositor to use for blends that are
 * not supported by blendFunc and merge operations.
 * @param {ShaderProgram} texBlitProgram Shader program to use for blits. Must
 * have uniform sampler uSrcTex for the source texture.
 * @param {ShaderProgram} rectBlitProgram Shader program to use for blits. Must
 * have uniform sampler uSrcTex for the source texture, and uScale and
 * uTranslate to control the positioning.
 * @param {BufferAddEvent} createEvent Event that initializes the buffer.
 * @param {number} width Width of the buffer in pixels. Must be an integer.
 * @param {number} height Height of the buffer in pixels. Must be an integer.
 * @param {AffineTransform} transform Transform to apply to all event coordinates.
 * @param {boolean} hasUndoStates Does this buffer store undo states?
 * @param {boolean} freed Should this buffer be left without bitmaps?
 */
var GLBuffer = function (gl, glManager, compositor, texBlitProgram, rectBlitProgram, createEvent,
												 width, height, transform, hasUndoStates, freed) {
	this.texBlitProgram = texBlitProgram;
	this.texBlitUniforms = texBlitProgram.uniformParameters();
	this.rectBlitProgram = rectBlitProgram;
	this.rectBlitUniforms = rectBlitProgram.uniformParameters();
	this.initializePictureBuffer(createEvent, width, height, transform, hasUndoStates, freed);
	// Add undo states less often than the default, since drawing is cheap.
	this.undoStateInterval = 32;
	this.gl = gl;
	this.glManager = glManager;
	this.compositor = compositor;

	this.tex = null;
	if (!this.freed) {
		this.createTex();
	}

	this.blameRasterizer = new Rasterizer(this.width(), this.height(), null);
	this.insertEvent(createEvent, null); // will clear the buffer
};

GLBuffer.prototype = new PictureBuffer();

/**
 * Create a texture for storing this buffer's current state.
 * @protected
 */
GLBuffer.prototype.createTex = function () {
	// TODO: assert(!this.tex);
	var format = this.hasAlpha ? this.gl.RGBA : this.gl.RGB;
	this.tex = glUtils.createTexture(this.gl, this.width(), this.height(),
		format);
};

/**
 * Clean up any allocated resources. To make the buffer usable again after this,
 * call regenerate.
 */
GLBuffer.prototype.free = function () {
	this.freed = true;
	this.gl.deleteTexture(this.tex);
	this.tex = null;
	if (this.undoStates !== null) {
		for (var i = 0; i < this.undoStates.length; ++i) {
			this.undoStates[i].free();
		}
	}
};

/**
 * Call after freeing to restore bitmaps.
 * @param {boolean} regenerateUndoStates Whether to regenerate undo states.
 * @param {BaseRasterizer} rasterizer Rasterizer to use.
 */
GLBuffer.prototype.regenerate = function (regenerateUndoStates, rasterizer) {
	this.freed = false;
	this.createTex();
	if (!regenerateUndoStates) {
		this.undoStates = [];
	}
	this.playbackAll(rasterizer);
};

/**
 * Clear the bitmap. Subject to the current clipping rectangle.
 * @param {Uint8Array|Array.<number>} unPremulClearColor The RGB(A) color to use
 * when clearing the buffer. Unpremultiplied and channel values are between
 * 0-255.
 * @protected
 */
GLBuffer.prototype.clear = function (unPremulClearColor) {
	this.updateClip();
	this.glManager.useFboTex(this.tex);
	if (unPremulClearColor.length === 3) {
		this.gl.clearColor(unPremulClearColor[0] / 255.0,
			unPremulClearColor[1] / 255.0,
			unPremulClearColor[2] / 255.0,
			1.0);
	} else {
		this.gl.clearColor(unPremulClearColor[0] / 255.0,
			unPremulClearColor[1] / 255.0,
			unPremulClearColor[2] / 255.0,
			unPremulClearColor[3] / 255.0);
	}
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
};

/**
 * Set the current clipping rectangle as a scissor rectangle for GL.
 * @protected
 */
GLBuffer.prototype.updateClip = function () {
	glUtils.updateClip(this.gl, this.getCurrentClipRect(), this.height());
};

/**
 * Draw the given rasterizer's contents with the given color to the buffer's
 * bitmap. If the event would erase from a buffer with no alpha channel, draws
 * with the background color instead.
 * @param {BaseRasterizer} raster The rasterizer to draw.
 * @param {Uint8Array|Array.<number>} color Color to use for drawing. Channel
 * values should be 0-255.
 * @param {number} opacity Opacity to use when drawing the rasterization result.
 * Opacity for each individual pixel is its rasterized opacity times this
 * opacity value.
 * @param {PictureEvent.Mode} mode Blending mode to use for drawing.
 * @protected
 */
GLBuffer.prototype.drawRasterizerWithColor = function (raster, color, opacity,
																											 mode) {
	this.gl.viewport(0, 0, this.width(), this.height());
	this.updateClip();
	if (!this.hasAlpha && mode === PictureEvent.Mode.erase) {
		mode = PictureEvent.Mode.normal;
		color = this.events[0].clearColor;
	}
	// Copy into helper texture from this.tex, then use compositor to render
	// that blended with the contents of the rasterizer back to this.tex.
	var helper = glUtils.createTexture(this.gl, this.width(),
		this.height());
	this.glManager.useFboTex(helper);
	this.texBlitUniforms['uSrcTex'] = this.tex;

	this.glManager.drawFullscreenQuad(this.texBlitProgram, this.texBlitUniforms);

	this.glManager.useFboTex(this.tex);
	this.compositor.setTargetDimensions(this.width(), this.height());
	this.compositor.pushBufferTex(helper, 1.0, false);
	this.compositor.pushRasterizer(raster, color, opacity, mode, null);
	this.compositor.flush();
	this.gl.deleteTexture(helper);
};

/**
 * Blend an image with this buffer.
 * @param {HTMLImageElement} img Image to draw.
 * @param {Rect} rect The extents of the image in this buffer's coordinates.
 */
GLBuffer.prototype.drawImage = function (img, rect) {
	this.gl.viewport(0, 0, this.width(), this.height());
	var imageTex = this.gl.createTexture();
	this.gl.bindTexture(this.gl.TEXTURE_2D, imageTex);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, true);
	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, img);
	this.gl.pixelStorei(this.gl.UNPACK_FLIP_Y_WEBGL, false);
	// TODO: Enlarge image so that dimensions are POT and add a mipmap.

	this.updateClip();
	this.glManager.useFboTex(this.tex);
	this.rectBlitUniforms['uSrcTex'] = imageTex;
	this.glManager.drawRect(this.rectBlitProgram, this.rectBlitUniforms, rect);
	this.gl.deleteTexture(imageTex);
};

/**
 * Blend another buffer with this one.
 * @param {GLBuffer} buffer Buffer to blend.
 * @param {number} opacity Opacity to blend with.
 * @protected
 */
GLBuffer.prototype.drawBuffer = function (buffer, opacity) {
	this.gl.viewport(0, 0, this.width(), this.height());
	this.updateClip();
	// Copy into helper texture from this.tex, then use compositor to render
	// that blended with the contents of the buffer back to this.tex.
	var helper = glUtils.createTexture(this.gl, this.width(), this.height());
	this.glManager.useFboTex(helper);
	this.texBlitUniforms['uSrcTex'] = this.tex;
	this.glManager.drawFullscreenQuad(this.texBlitProgram,
		this.texBlitUniforms);
	this.glManager.useFboTex(this.tex);
	this.compositor.setTargetDimensions(this.width(), this.height());
	this.compositor.pushBufferTex(helper, 1.0, false);
	this.compositor.pushBufferTex(buffer.tex, opacity, false);
	this.compositor.flush();
	this.gl.deleteTexture(helper);
};

/**
 * Save an undo state.
 * @param {number} cost Regeneration cost of the undo state.
 * @return {GLUndoState} The undo state.
 */
GLBuffer.prototype.saveUndoState = function (cost) {
	return new GLUndoState(this.events.length, cost, this.tex, this.gl,
		this.glManager, this.texBlitProgram,
		this.width(), this.height(), this.hasAlpha);
};

/**
 * Repair an undo state using the current bitmap and clip rect.
 * @param {GLUndoState} undoState The state to repair.
 */
GLBuffer.prototype.repairUndoState = function (undoState) {
	undoState.update(this.tex, this.getCurrentClipRect());
};

/**
 * Apply the given undo state to the bitmap. Must be a real undo state.
 * @param {GLUndoState} undoState The undo state to apply.
 * @protected
 */
GLBuffer.prototype.applyStateObject = function (undoState) {
	this.glManager.useFboTex(this.tex);
	undoState.draw(this.getCurrentClipRect());
};

/**
 * @param {Vec2} coords Position of the pixel in bitmap coordinates.
 * @return {Uint8ClampedArray} Unpremultiplied RGBA value.
 */
GLBuffer.prototype.getPixelRGBA = function (coords) {
	this.glManager.useFboTex(this.tex);
	var buffer = new ArrayBuffer(4);
	var pixelData = new Uint8Array(buffer);
	var glX = Math.min(Math.floor(coords.x), this.width() - 1);
	var glY = Math.max(0, this.height() - 1 - Math.floor(coords.y));
	this.gl.readPixels(glX, glY, 1, 1, this.gl.RGBA, this.gl.UNSIGNED_BYTE, pixelData);
	return pixelData;
};
