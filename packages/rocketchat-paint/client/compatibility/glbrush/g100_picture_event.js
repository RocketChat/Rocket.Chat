/*
 * Copyright Olli Etuaho 2012-2013.
 */

'use strict';

/**
 * Draw state for a brush event. Used to resume drawTo() from a point along
 * the brush stroke.
 * @constructor
 * @param {number} coordsInd Index in the coords array. Must be an integer.
 */
var BrushEventState = function (coordsInd) {
	if (coordsInd === undefined) {
		coordsInd = 0;
	}
	this.coordsInd = coordsInd;
};

/**
 * Draw state for a gradient event. Used to determine whether a gradient is
 * already drawn in a rasterizer.
 * @constructor
 */
var GradientEventState = function () {
	this.drawn = false;
};

/**
 * An event that is a part of the picture buffer's state.
 * @constructor
 * @param {string} eventType A short identifier for the type of the event. May
 * not contain spaces.
 */
var PictureEvent = function (eventType) {
	// TODO: Assert no spaces in eventType.
	this.eventType = eventType;
};

/**
 * @param {Object} json Json object to add event information to.
 */
PictureEvent.prototype.serializePictureEvent = function (json) {
	json['eventType'] = this.eventType;
	json['sid'] = this.sid;
	json['sessionEventId'] = this.sessionEventId;
	json['undone'] = this.undone;
};

/**
 * Parse values shared between different picture event classes from a JS object.
 * @param {Object} json JS object to parse values from.
 */
PictureEvent.prototype.pictureEventFromJS = function (json) {
	this.sid = json['sid'];
	this.sessionEventId = json['sessionEventId'];
	this.undone = json['undone'];
};

/**
 * Parse a json representation of a PictureEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 * @return {boolean} True if parsing succeeded.
 */
PictureEvent.parseLegacy = function (json, arr, i, version) {
	json['eventType'] = arr[i++];
	json['sid'] = parseInt(arr[i++]);
	json['sessionEventId'] = parseInt(arr[i++]);
	json['undone'] = (parseInt(arr[i++]) !== 0);

	var eventType = json['eventType'];
	if (eventType === 'brush') {
		BrushEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'scatter') {
		ScatterEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'gradient') {
		GradientEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'rasterImport') {
		RasterImportEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'bufferMerge') {
		BufferMergeEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'bufferAdd') {
		BufferAddEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'bufferRemove') {
		BufferRemoveEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'bufferMove') {
		BufferMoveEvent.parseLegacy(json, arr, i, version);
		return true;
	} else if (eventType === 'eventHide') {
		EventHideEvent.parseLegacy(json, arr, i, version);
		return true;
	} else {
		console.log('Unexpected picture event type ' + eventType);
		return false;
	}
};

/**
 * @param {Object} json JS object to parse values from.
 * @return {PictureEvent} The parsed event or null if the event was not recognized.
 */
PictureEvent.fromJS = function (json) {
	var eventType = json['eventType'];
	if (eventType === 'brush') {
		var event = new BrushEvent();
	} else if (eventType === 'scatter') {
		var event = new ScatterEvent();
	} else if (eventType === 'gradient') {
		var event = new GradientEvent();
	} else if (eventType === 'rasterImport') {
		var event = new RasterImportEvent();
	} else if (eventType === 'bufferMerge') {
		var event = new BufferMergeEvent();
	} else if (eventType === 'bufferAdd') {
		var event = new BufferAddEvent();
	} else if (eventType === 'bufferRemove') {
		var event = new BufferRemoveEvent();
	} else if (eventType === 'bufferMove') {
		var event = new BufferMoveEvent();
	} else if (eventType === 'eventHide') {
		var event = new EventHideEvent();
	} else {
		console.log('Unexpected picture event type ' + eventType);
		return null;
	}
	event.pictureEventFromJS(json);
	event.fromJS(json);
	return event;
};

/**
 * Create an identical copy of the given PictureEvent.
 * @param {PictureEvent} event Event to copy.
 * @return {PictureEvent} A copy of the event.
 */
PictureEvent.copy = function (event) {
	var serialization = serializeToString(event);
	return PictureEvent.fromJS(JSON.parse(serialization));
};

/**
 * Determine whether this event's bounding box intersects with the given
 * rectangle.
 * @param {Rect} rect The rectangle to intersect with.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @return {boolean} Does the event's axis-aligned bounding box intersect the
 * given rectangle?
 */
PictureEvent.prototype.boundsIntersectRect = function (rect, transform) {
	return this.getBoundingBox(rect, transform).intersectsRectRoundedOut(rect);
};

/**
 * @return {boolean} Whether the event is a buffer stack change.
 */
PictureEvent.prototype.isBufferStackChange = function () {
	return false;
};

/**
 * Scale this event.
 * @param {number} scale Scaling factor. Must be larger than 0.
 */
PictureEvent.prototype.scale = function (scale) {
};

/**
 * @enum {number}
 */
PictureEvent.Mode = {
	erase: 0,
	normal: 1,
	multiply: 2,
	screen: 3,
	overlay: 4,
	hardlight: 5,
	softlight: 6,
	darken: 7,
	lighten: 8,
	difference: 9,
	exclusion: 10,
	colorburn: 11,
	linearburn: 12,
	vividlight: 13,
	linearlight: 14,
	pinlight: 15,
	colordodge: 16,
	lineardodge: 17
};

/**
 * Generate a constructor for an event conforming to the brush event format.
 * @param {boolean} needsTipMovers True if needs brush tip movement interpolation.
 * @return {function(number, number, boolean, Uint8Array|Array.<number>, number,
 * number, number, number, number, PictureEvent.Mode)} Constructor for the event.
 */
var brushEventConstructor = function (needsTipMovers) {
	return function (sid, sessionEventId, undone, color, flow, opacity, radius, textureId, softness, mode) {
		if (sid !== undefined) {
			// TODO: assert(color.length == 3);
			this.sid = sid;
			this.sessionEventId = sessionEventId;
			this.undone = undone;
			this.color = color;
			this.flow = flow;
			this.opacity = opacity;
			this.radius = radius;
			this.textureId = textureId; // Id 0 is a circle, others are bitmap textures.
			this.soft = softness > 0.5;
			this.mode = mode;
		}
		this.coords = []; // holding x,y,pressure triplets
		this.boundingBoxRasterizer = new BrushEvent.BBRasterizer();
		this.hideCount = 0;
		this.generation = 0;
		if (needsTipMovers) {
			this.bbTip = new BrushTipMover(true);
			this.brushTip = new BrushTipMover(true);
		}
	};
};

/**
 * A PictureEvent representing a brush stroke.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
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
 * @param {number} softness Value controlling the softness. Range 0 to 1.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 */
var BrushEvent = brushEventConstructor(true);

BrushEvent.prototype = new PictureEvent('brush');

/**
 * @param {Object} json JS object to parse values from.
 */
BrushEvent.prototype.fromJS = function (json) {
	this.color = json['color'];
	this.flow = json['flow'];
	this.opacity = json['opacity'];
	this.radius = json['radius'];
	this.textureId = json['textureId']; // Id 0 is a circle, others are bitmap textures.
	this.soft = json['softness'] > 0.5;
	this.mode = json['mode'];
	var coords = json['coordinates'];
	for (var i = 0; i < coords.length; ++i) {
		this.coords.push(coords[i]);
	}
};

/**
 * @const
 * @protected
 */
BrushEvent.coordsStride = 3; // x, y and pressure coordinates belong together

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
BrushEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['color'] = colorUtil.serializeRGB(this.color);
	json['flow'] = this.flow;
	json['opacity'] = this.opacity;
	json['radius'] = this.radius;
	json['textureId'] = this.textureId;
	json['softness'] = this.soft ? 1.0 : 0.0;
	json['mode'] = this.mode;
	var coords = [];
	var i = 0;
	while (i < this.coords.length) {
		coords.push(this.coords[i++]);
	}
	json['coordinates'] = coords;
};

/**
 * Generate a parser for an event conforming to the brush event format.
 * @param {function(number, number, boolean, Uint8Array|Array.<number>, number,
 * number, number, number, PictureEvent.Mode)} constructor Constructor for the
 * parsed object.
 * @return {function(Array.<string>, number, number, number, number, boolean)}
 * Parse function.
 */
var brushEventLegacyParser = function (constructor) {
	return function (json, arr, i, version) {
		var color = [];
		color[0] = parseInt(arr[i++]);
		color[1] = parseInt(arr[i++]);
		color[2] = parseInt(arr[i++]);
		json['color'] = color;
		json['flow'] = parseFloat(arr[i++]);
		json['opacity'] = parseFloat(arr[i++]);
		json['radius'] = parseFloat(arr[i++]);
		json['textureId'] = 0;
		if (version > 1) {
			json['textureId'] = parseInt(arr[i++]);
		}
		json['softness'] = parseFloat(arr[i++]);
		json['mode'] = parseInt(arr[i++]);
		constructor.parseLegacyCoords(json, arr, i, version);
	};
};

/**
 * Parse a BrushEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BrushEvent.parseLegacy = brushEventLegacyParser(BrushEvent);

/**
 * Parse BrushEvent coordinates from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BrushEvent.parseLegacyCoords = function (json, arr, i, version) {
	var coords = [];
	while (i <= arr.length - BrushEvent.coordsStride) {
		coords.push(parseFloat(arr[i++]));
		coords.push(parseFloat(arr[i++]));
		coords.push(parseFloat(arr[i++]));
	}
	json['coordinates'] = coords;
};

/**
 * Add a triplet of coordinates to the brush stroke. The stroke will travel
 * through this control point.
 * @param {number} x The x coordinate of the stroke control point.
 * @param {number} y The y coordinate of the stroke control point.
 * @param {number} pressure Used as a multiplier for stroke radius at this
 * point. Must be larger than zero.
 */
BrushEvent.prototype.pushCoordTriplet = function (x, y, pressure) {
	// Limit pressure to 5 decimals to cut on file size a bit. This rounding
	// method should be okay as long as pressure stays within reasonable bounds.
	pressure = Math.round(pressure * 100000) / 100000;
	if (this.coords.length > 0) {
		if (x === this.coords[this.coords.length - BrushEvent.coordsStride] &&
			y === this.coords[this.coords.length - BrushEvent.coordsStride - 1]) {
			return;
			// TODO: Possible to do something smarter if only pressure changes?
			// Drawing small strokes in place would benefit from that.
			// Also needs changes in drawing.
		}
	}
	this.coords.push(x);
	this.coords.push(y);
	this.coords.push(pressure);
};

/**
 * Scale this event. This will change the coordinates of the stroke.
 * @param {number} scale Scaling factor. Must be larger than 0.
 */
BrushEvent.prototype.scale = function (scale) {
	//TODO: assert(scale > 0)
	this.radius *= scale;
	for (var i = 0; i < this.coords.length; ++i) {
		if (i % BrushEvent.coordsStride < 2) {
			this.coords[i] *= scale;
		}
	}
	++this.generation; // This invalidates any rasterizers (including BBRasterizer) which have this event cached.
};

/**
 * Translate this event. This will change the coordinates of the stroke.
 * @param {Vec2} offset The vector to translate with.
 */
BrushEvent.prototype.translate = function (offset) {
	for (var i = 0; i < this.coords.length; ++i) {
		if (i % BrushEvent.coordsStride === 0) {
			this.coords[i] += offset.x;
		} else if (i % BrushEvent.coordsStride === 1) {
			this.coords[i] += offset.y;
		}
	}
	++this.generation; // This invalidates any rasterizers (including BBRasterizer) which have this event cached.
};

/**
 * Normalize pressure to the range 0 to 1. Adjusts the radius accordingly.
 */
BrushEvent.prototype.normalizePressure = function () {
	var i;
	var maxPressure = 0;
	for (i = 0; i < this.coords.length; i += BrushEvent.coordsStride) {
		if (this.coords[i + 2] > maxPressure) {
			maxPressure = this.coords[i + 2];
		}
	}
	if (maxPressure <= 1.0) {
		return;
	}
	for (i = 0; i < this.coords.length; i += BrushEvent.coordsStride) {
		this.coords[i + 2] = Math.round(this.coords[i + 2] / maxPressure * 100000) / 100000;
	}
	this.scaleRadiusPreservingFlow(maxPressure);
	++this.generation;
};

/**
 * Scale radius while preserving the stroke's appearance.
 * @param {number} radiusScale Multiplier for radius.
 */
BrushEvent.prototype.scaleRadiusPreservingFlow = function (radiusScale) {
	var nBlends = Math.ceil(this.radius * 2);
	var drawAlpha = colorUtil.alphaForNBlends(this.flow, nBlends);
	this.radius *= radiusScale;
	nBlends = Math.ceil(this.radius * 2);
	this.flow = colorUtil.nBlends(drawAlpha, nBlends);
};

/**
 * A rasterizer that does not rasterize, but computes bounding boxes for a brush
 * event. Only implements functions necessary for drawing a brush event.
 * @constructor
 */
BrushEvent.BBRasterizer = function () {
	this.state = null;
	this.boundingBox = null;
	this.generation = -1;
	this.transform = null;
	this.transformGeneration = 0;
};

/**
 * Clear the bounding box.
 */
BrushEvent.BBRasterizer.prototype.clearDirty = function () {
	this.state = null;
	this.boundingBox = null;
};

/**
 * Get draw event state for the given event.
 * @param {BrushEvent} event The event to be rasterized.
 * @param {AffineTransform} transform The transform to check to determine whether a
 * clear needs to be performed. Does not affect the rasterizer's operation.
 * @param {function()} stateConstructor Constructor for creating a new draw
 * event state object unless the event already has been rasterized to this
 * rasterizer's bitmap.
 * @return {Object} Draw event state for the given event.
 */
BrushEvent.BBRasterizer.prototype.getDrawEventState = function (event, transform, stateConstructor) {
	if (this.boundingBox === null || event.generation !== this.generation || transform !== this.transform ||
		transform.generation !== this.transformGeneration) {
		this.state = new stateConstructor();
		this.boundingBox = new Rect();
		this.generation = event.generation;
		this.transform = transform;
		this.transformGeneration = transform.generation;
	}
	return this.state;
};

/**
 * Do nothing.
 */
BrushEvent.BBRasterizer.prototype.beginCircles = function () {
};

/**
 * Add a circle to the bounding box.
 * @param {number} centerX The x coordinate of the center of the circle.
 * @param {number} centerY The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 * @param {number} flowAlpha The flow alpha. Unused.
 * @param {number} rotation Rotation of the circle texture in radians. Unused.
 */
BrushEvent.BBRasterizer.prototype.fillCircle = function (centerX, centerY, radius, flowAlpha, rotation) {
	this.boundingBox.unionCircle(centerX, centerY, Math.max(radius, 1.0) + 1.0);
};

/**
 * Do nothing.
 */
BrushEvent.BBRasterizer.prototype.flushCircles = function () {
};

/**
 * Draw the brush event to the given rasterizer's bitmap.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @param {number} untilCoord Maximum coordinate index to draw + 1.
 */
BrushEvent.prototype.drawTo = function (rasterizer, transform, untilCoord) {
	var drawState = rasterizer.getDrawEventState(this, transform, BrushEventState);
	// Use different tips for BB and normal drawing to avoid clearing the rasterizer all the time while drawing
	var brushTip = rasterizer === this.boundingBoxRasterizer ? this.bbTip : this.brushTip;
	if (untilCoord === undefined) {
		untilCoord = this.coords.length;
	}
	// TODO: Reset also if transform has changed
	if (drawState.coordsInd > untilCoord || brushTip.target !== rasterizer) {
		rasterizer.clearDirty();
		drawState = rasterizer.getDrawEventState(this, transform, BrushEventState);
	}
	// TODO: assert(this.coords.length % BrushEvent.coordsStride === 0);
	// TODO: assert(untilCoord % BrushEvent.coordsStride === 0);

	var i = drawState.coordsInd;

	if (i === 0) {
		rasterizer.beginCircles(this.soft, this.textureId);
		var x = this.coords[i++];
		var y = this.coords[i++];
		var pressure = this.coords[i++];
		brushTip.reset(rasterizer, transform, x, y, pressure, this.radius, this.flow, 0, 1, false,
			BrushTipMover.Rotation.off);
	}

	while (i + BrushEvent.coordsStride <= untilCoord) {
		var x = this.coords[i++];
		var y = this.coords[i++];
		var pressure = this.coords[i++];
		brushTip.move(x, y, pressure);
	}
	drawState.coordsInd = i;
	rasterizer.flushCircles();
};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
BrushEvent.prototype.getBoundingBox = function (clipRect, transform) {
	this.drawTo(this.boundingBoxRasterizer, transform);
	return this.boundingBoxRasterizer.boundingBox;
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
BrushEvent.prototype.isRasterized = function () {
	return true;
};


/**
 * A PictureEvent representing a bunch of individually positioned circles.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {Uint8Array|Array.<number>} color The RGB color of the event. Channel
 * values are between 0-255.
 * @param {number} flow Alpha value controlling blending individual brush
 * samples (circles) to each other in the rasterizer. Range 0 to 1.
 * @param {number} opacity Alpha value controlling blending the rasterizer
 * data to the target buffer. Range 0 to 1.
 * @param {number} radius The stroke radius in pixels.
 * @param {number} textureId Id of the brush tip shape texture. 0 is a circle, others are bitmap textures.
 * @param {number} softness Value controlling the softness. Range 0 to 1.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 */
var ScatterEvent = brushEventConstructor(false);

/**
 * @const
 * @protected
 */
ScatterEvent.coordsStride = 5; // x, y, radius, flow and rotation coordinates belong together

ScatterEvent.prototype = new PictureEvent('scatter');

/** @inheritDoc */
ScatterEvent.prototype.fromJS = BrushEvent.prototype.fromJS;

/** @inheritDoc */
ScatterEvent.prototype.serialize = BrushEvent.prototype.serialize;


/**
 * Parse a ScatterEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
ScatterEvent.parseLegacy = brushEventLegacyParser(ScatterEvent);

/**
 * Parse ScatterEvent coordinates from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
ScatterEvent.parseLegacyCoords = function (json, arr, i, version) {
	var coords = [];
	var eventRadius = json['radius'];
	var eventFlow = json['flow'];
	while (i < arr.length) {
		coords.push(parseFloat(arr[i++]));
		coords.push(parseFloat(arr[i++]));
		var pressure = parseFloat(arr[i++]);
		if (version >= 4) {
			coords.push(pressure); // interpreted as radius
			coords.push(parseFloat(arr[i++]));
			coords.push(parseFloat(arr[i++]));
		} else {
			coords.push(pressure * eventRadius);
			coords.push(eventFlow);
			coords.push(0);
		}
	}
	json['coordinates'] = coords;
};


/**
 * Scale this event. This will change the coordinates of the stroke.
 * @param {number} scale Scaling factor. Must be larger than 0.
 */
ScatterEvent.prototype.scale = function (scale) {
	//TODO: assert(scale > 0)
	this.radius *= scale;
	for (var i = 0; i < this.coords.length; ++i) {
		if (i % ScatterEvent.coordsStride < 3) {
			this.coords[i] *= scale;
		}
	}
	++this.generation; // This invalidates any rasterizers (including BBRasterizer) which have this event cached.
};

/**
 * Translate this event. This will change the coordinates of the stroke.
 * @param {Vec2} offset The vector to translate with.
 */
ScatterEvent.prototype.translate = function (offset) {
	for (var i = 0; i < this.coords.length; ++i) {
		if (i % ScatterEvent.coordsStride === 0) {
			this.coords[i] += offset.x;
		} else if (i % ScatterEvent.coordsStride === 1) {
			this.coords[i] += offset.y;
		}
	}
	++this.generation; // This invalidates any rasterizers (including BBRasterizer) which have this event cached.
};

/** @inheritDoc */
ScatterEvent.prototype.getBoundingBox = BrushEvent.prototype.getBoundingBox;

/**
 * Draw the brush event to the given rasterizer's bitmap.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @param {number} untilCoord Maximum coordinate index to draw + 1.
 */
ScatterEvent.prototype.drawTo = function (rasterizer, transform, untilCoord) {
	var drawState = rasterizer.getDrawEventState(this, transform, BrushEventState);
	if (untilCoord === undefined) {
		untilCoord = this.coords.length;
	} else {
		if (drawState.coordsInd > untilCoord) {
			rasterizer.clearDirty();
			drawState = rasterizer.getDrawEventState(this, transform, BrushEventState);
		}
	}
	var i = drawState.coordsInd;
	if (i === 0) {
		rasterizer.beginCircles(this.soft, this.textureId);
	}
	while (i + ScatterEvent.coordsStride <= untilCoord) {
		var x = this.coords[i++];
		var y = this.coords[i++];
		var radius = this.coords[i++];
		var flow = this.coords[i++];
		var rotation = this.coords[i++];
		rasterizer.fillCircle(transform.transformX(x, y),
			transform.transformY(x, y),
			transform.scaleValue(radius),
			flow, rotation);
	}
	drawState.coordsInd = i;
	rasterizer.flushCircles();
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
ScatterEvent.prototype.isRasterized = function () {
	return true;
};

/**
 * Add coordinates for a circle.
 * @param {number} x The x center of the circle.
 * @param {number} y The y center of the circle.
 * @param {number} radius Radius of the circle.
 * @param {number} flow Alpha value for the circle.
 * @param {number} rotation Rotation of the circle texture in radians.
 */
ScatterEvent.prototype.fillCircle = function (x, y, radius, flow, rotation) {
	this.coords.push(x);
	this.coords.push(y);
	this.coords.push(radius);
	this.coords.push(flow);
	this.coords.push(rotation);
};


/**
 * A PictureEvent representing a gradient.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {Uint8Array|Array.<number>} color The RGB color of the gradient.
 * Channel values are between 0-255.
 * @param {number} opacity Alpha value controlling blending the rasterizer
 * stroke to the target buffer. Range 0 to 1.
 * @param {PictureEvent.Mode} mode Blending mode to use.
 */
var GradientEvent = function (sid, sessionEventId, undone, color, opacity,
															mode) {
	// TODO: assert(color.length == 3);
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.color = color;
		this.opacity = opacity;
		this.coords0 = new Vec2(0, 0);
		this.coords1 = new Vec2(1, 1);
		this.mode = mode;
	}
	this.hideCount = 0;
	this.generation = 0;
};

GradientEvent.prototype = new PictureEvent('gradient');

/**
 * @param {Object} json JS object to parse values from.
 */
GradientEvent.prototype.fromJS = function (json) {
	this.color = json['color'];
	this.opacity = json['opacity'];
	this.coords0 = new Vec2(json['x0'], json['y0']);
	this.coords1 = new Vec2(json['x1'], json['y1']);
	this.mode = json['mode'];
};

/**
 * Parse a GradientEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
GradientEvent.parseLegacy = function (json, arr, i, version) {
	var color = [];
	color[0] = parseInt(arr[i++]);
	color[1] = parseInt(arr[i++]);
	color[2] = parseInt(arr[i++]);
	json['color'] = color;
	json['opacity'] = parseFloat(arr[i++]);
	json['mode'] = parseInt(arr[i++]);
	json['x0'] = parseFloat(arr[i++]);
	json['y0'] = parseFloat(arr[i++]);
	json['x1'] = parseFloat(arr[i++]);
	json['y1'] = parseFloat(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
GradientEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['color'] = colorUtil.serializeRGB(this.color);
	json['opacity'] = this.opacity;
	json['mode'] = this.mode;
	json['x0'] = this.coords0.x;
	json['y0'] = this.coords0.y;
	json['x1'] = this.coords1.x;
	json['y1'] = this.coords1.y;
};

/**
 * Scale this event. This will change the coordinates of the gradient.
 * @param {number} scale Scaling factor. Must be larger than 0.
 */
GradientEvent.prototype.scale = function (scale) {
	//TODO: assert(scale > 0)
	this.coords0.x *= scale;
	this.coords0.y *= scale;
	this.coords1.x *= scale;
	this.coords1.y *= scale;
	++this.generation; // This invalidates any rasterizers which have this event cached.
};

/**
 * Translate this event. This will change the coordinates of the gradient.
 * @param {Vec2} offset The vector to translate with.
 */
GradientEvent.prototype.translate = function (offset) {
	this.coords0.x += offset.x;
	this.coords0.y += offset.y;
	this.coords1.x += offset.x;
	this.coords1.y += offset.y;
	++this.generation; // This invalidates any rasterizers which have this event cached.
};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
GradientEvent.prototype.getBoundingBox = function (clipRect, transform) {
	var boundingBox = new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
	var coords0 = new Vec2();
	var coords1 = new Vec2();
	coords0.setVec2(this.coords0);
	coords1.setVec2(this.coords1);
	transform.transform(coords0);
	transform.transform(coords1);
	if (coords0.y === coords1.y) {
		if (coords1.x > coords0.x) {
			boundingBox.limitLeft(coords0.x - 1);
		} else if (coords1.x < coords0.x) {
			boundingBox.limitRight(coords0.x + 1);
		} else {
			boundingBox.makeEmpty();
		}
	} else {
		// y = slope * x + b
		var normalSlope = -1.0 / coords0.slope(coords1);
		var normalB = coords0.y - normalSlope * coords0.x;
		if (normalSlope === 0.0) {
			if (coords0.y < coords1.y) {
				boundingBox.limitTop(coords0.y - 1);
			} else {
				boundingBox.limitBottom(coords0.y + 1);
			}
		} else if (normalSlope < 0 && coords1.y < coords0.y) {
			// the covered area is in the top left corner
			// intersection with left edge
			boundingBox.limitBottom(normalSlope * boundingBox.left +
				normalB + 1);
			// intersection with top edge
			boundingBox.limitRight((boundingBox.top - normalB) /
				normalSlope + 1);
		} else if (normalSlope > 0 && coords1.y < coords0.y) {
			// the covered area is in the top right corner
			// intersection with right edge
			boundingBox.limitBottom(normalSlope * boundingBox.right +
				normalB + 1);
			// intersection with top edge
			boundingBox.limitLeft((boundingBox.top - normalB) /
				normalSlope - 1);
		} else if (normalSlope < 0 && coords1.y > coords0.y) {
			// the covered area is in the bottom right corner
			// intersection with right edge
			boundingBox.limitTop(normalSlope * boundingBox.right + normalB - 1);
			// intersection with bottom edge
			boundingBox.limitLeft((boundingBox.bottom - normalB) /
				normalSlope - 1);
		} else {
			// TODO: assert(normalSlope > 0 && coords1.y > coords0.y);
			// the covered area is in the bottom left corner
			// intersection with left edge
			boundingBox.limitTop(normalSlope * boundingBox.left + normalB - 1);
			// intersection with bottom edge
			boundingBox.limitRight((boundingBox.bottom - normalB) /
				normalSlope + 1);
		}
	}
	return boundingBox;
};

/**
 * Draw the GradientEvent to the given rasterizer's bitmap.
 * @param {BaseRasterizer} rasterizer The rasterizer to use.
 * @param {AffineTransform} transform Transform for the event coordinates.
 */
GradientEvent.prototype.drawTo = function (rasterizer, transform) {
	var drawState = rasterizer.getDrawEventState(this, transform, GradientEventState);
	if (drawState.drawn) {
		return;
	}
	var coords0 = new Vec2();
	var coords1 = new Vec2();
	coords0.setVec2(this.coords0);
	coords1.setVec2(this.coords1);
	transform.transform(coords0);
	transform.transform(coords1);
	rasterizer.linearGradient(coords1, coords0);
	drawState.drawn = true;
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
GradientEvent.prototype.isRasterized = function () {
	return true;
};


/**
 * Event that adds an imported raster image into a buffer.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {HTMLImageElement} importedImage The imported image.
 * @param {Rect} rect Rectangle defining the position and scale of the imported image in the buffer.
 */
var RasterImportEvent = function (sid, sessionEventId, undone, importedImage, rect) {
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.rect = rect;
		this.loadImg(importedImage);
	}
};

RasterImportEvent.prototype = new PictureEvent('rasterImport');

/**
 * Load an image element. this.loaded will be set to true once loading is complete.
 * @param {HTMLImageElement} importedImage Image to load.
 */
RasterImportEvent.prototype.loadImg = function (importedImage) {
	this.importedImage = document.createElement('img');
	this.loaded = false;
	var that = this;
	this.importedImage.onload = function () {
		that.loaded = true;
	};
	if (importedImage.src.substring(0, 4) === 'data') {
		this.importedImage.src = importedImage.src;
	} else {
		var c = document.createElement('canvas');
		c.width = importedImage.width;
		c.height = importedImage.height;
		var ctx = c.getContext('2d');
		ctx.drawImage(importedImage, 0, 0);
		this.importedImage.src = c.toDataURL();
	}
};

/**
 * @param {Object} json JS object to parse values from.
 */
RasterImportEvent.prototype.fromJS = function (json) {
	this.rect = new Rect();
	this.rect.left = json['left'];
	this.rect.right = json['right'];
	this.rect.top = json['top'];
	this.rect.bottom = json['bottom'];
	var img = document.createElement('img');
	img.src = json['src'];
	this.loadImg(img);
};

/**
 * Parse a RasterImportEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
RasterImportEvent.parseLegacy = function (json, arr, i, version) {
	json['src'] = arr[i++]; // data URI
	json['left'] = parseFloat(arr[i++]);
	json['right'] = parseFloat(arr[i++]);
	json['top'] = parseFloat(arr[i++]);
	json['bottom'] = parseFloat(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
RasterImportEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['src'] = this.importedImage.src;
	json['left'] = this.rect.left;
	json['right'] = this.rect.right;
	json['top'] = this.rect.top;
	json['bottom'] = this.rect.bottom;

};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
RasterImportEvent.prototype.getBoundingBox = function (clipRect) {
	var bbRect = new Rect();
	bbRect.setRect(this.rect);
	return bbRect;
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
RasterImportEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * Scale this event. This will change the coordinates of the bitmap.
 * @param {number} scale Scaling factor. Must be larger than 0.
 */
RasterImportEvent.prototype.scale = function (scale) {
	//TODO: assert(scale > 0)
	this.rect.scale(scale);
};

/**
 * Translate this event. This will change the coordinates of the bitmap.
 * @param {Vec2} offset The vector to translate with.
 */
RasterImportEvent.prototype.translate = function (offset) {
	this.rect.translate(offset);
};


/**
 * Event that adds a buffer into a Picture.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {number} bufferId Id of the added buffer. Unique at the Picture level.
 * Should be an integer >= 0.
 * @param {boolean} hasAlpha Whether the buffer has an alpha channel.
 * @param {Uint8Array|Array.<number>} clearColor The RGB(A) color used to clear
 * the buffer. Channel values are integers between 0-255.
 * @param {number} opacity Alpha value controlling compositing the buffer. Range
 * 0 to 1.
 * @param {number} insertionPoint Insertion point for the added buffer. Only
 * taken into account when the whole picture containing this buffer is parsed or
 * serialized.
 */
var BufferAddEvent = function (sid, sessionEventId, undone, bufferId, hasAlpha,
															 clearColor, opacity, insertionPoint) {
	if (sid !== undefined) {
		// TODO: assert(clearColor.length === (hasAlpha ? 4 : 3));
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.bufferId = bufferId;
		this.hasAlpha = hasAlpha;
		this.clearColor = clearColor;
		this.opacity = opacity;

		// TODO: storing this is necessary for restoring complete picture state,
		// but might not really logically belong in the add event.
		// Note that this is not used when the event is pushed to a picture the
		// usual way, only when a whole picture is parsed / serialized!
		this.insertionPoint = insertionPoint;
	}
};

BufferAddEvent.prototype = new PictureEvent('bufferAdd');

/**
 * @param {Object} json JS object to parse values from.
 */
BufferAddEvent.prototype.fromJS = function (json) {
	this.bufferId = json['bufferId'];
	this.hasAlpha = json['hasAlpha'];
	this.clearColor = json['backgroundColor'];
	if (this.hasAlpha) {
		this.clearColor[3] = json['backgroundAlpha'];
	}
	this.opacity = json['opacity'];
	this.insertionPoint = json['insertionPoint'];
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
BufferAddEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * @return {boolean} Whether the event is a buffer stack change.
 */
BufferAddEvent.prototype.isBufferStackChange = function () {
	return true;
};

/**
 * Parse a BufferAddEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BufferAddEvent.parseLegacy = function (json, arr, i, version) {
	json['bufferId'] = parseInt(arr[i++]);
	json['hasAlpha'] = arr[i++] === '1';
	var clearColor = [];
	clearColor[0] = parseInt(arr[i++]);
	clearColor[1] = parseInt(arr[i++]);
	clearColor[2] = parseInt(arr[i++]);
	json['backgroundColor'] = clearColor;
	if (json['hasAlpha']) {
		json['backgroundAlpha'] = parseInt(arr[i++]);
	}
	json['opacity'] = parseFloat(arr[i++]);
	json['insertionPoint'] = parseInt(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
BufferAddEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['bufferId'] = this.bufferId;
	json['hasAlpha'] = this.hasAlpha;
	json['backgroundColor'] = colorUtil.serializeRGB(this.clearColor);
	if (this.hasAlpha) {
		json['backgroundAlpha'] = this.clearColor[3];
	}
	json['opacity'] = this.opacity;
	json['insertionPoint'] = this.insertionPoint;

};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
BufferAddEvent.prototype.getBoundingBox = function (clipRect) {
	return new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
};

/**
 * Event that removes a buffer from a Picture.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {number} bufferId Id of the removed buffer.
 */
var BufferRemoveEvent = function (sid, sessionEventId, undone, bufferId) {
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.bufferId = bufferId;
	}
};

BufferRemoveEvent.prototype = new PictureEvent('bufferRemove');

/**
 * @param {Object} json JS object to parse values from.
 */
BufferRemoveEvent.prototype.fromJS = function (json) {
	this.bufferId = json['removedBufferId'];
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
BufferRemoveEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * @return {boolean} Whether the event is a buffer stack change.
 */
BufferRemoveEvent.prototype.isBufferStackChange = function () {
	return true;
};

/**
 * Parse a BufferRemoveEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BufferRemoveEvent.parseLegacy = function (json, arr, i, version) {
	json['removedBufferId'] = parseInt(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
BufferRemoveEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['removedBufferId'] = this.bufferId;

};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
BufferRemoveEvent.prototype.getBoundingBox = function (clipRect) {
	return new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
};


/**
 * Event that moves a buffer to a different position in the Picture stack.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {number} movedId Id of the moved buffer.
 * @param {number} fromIndex Index where the buffer was moved from. Only used
 * for undo.
 * @param {number} toIndex Index where the buffer is being moved to.
 */
var BufferMoveEvent = function (sid, sessionEventId, undone, movedId, fromIndex, toIndex) {
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.movedId = movedId;
		this.fromIndex = fromIndex;
		this.toIndex = toIndex;
	}
};

BufferMoveEvent.prototype = new PictureEvent('bufferMove');

/**
 * @param {Object} json JS object to parse values from.
 */
BufferMoveEvent.prototype.fromJS = function (json) {
	this.movedId = json['movedId'];
	this.fromIndex = json['fromIndex'];
	this.toIndex = json['toIndex'];
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
BufferMoveEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * @return {boolean} Whether the event is a buffer stack change.
 */
BufferMoveEvent.prototype.isBufferStackChange = function () {
	return true;
};

/**
 * Parse a BufferMoveEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BufferMoveEvent.parseLegacy = function (json, arr, i, version) {
	json['movedId'] = parseInt(arr[i++]);
	json['fromIndex'] = parseInt(arr[i++]);
	json['toIndex'] = parseInt(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
BufferMoveEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['movedId'] = this.movedId;
	json['fromIndex'] = this.fromIndex;
	json['toIndex'] = this.toIndex;

};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
BufferMoveEvent.prototype.getBoundingBox = function (clipRect) {
	return new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
};


/**
 * Event that draws a merged buffer's contents to a target buffer, and also
 * removes the merged buffer from the main buffer stack. This is different from
 * simply pushing the merged buffer's events on top of the target buffer, rather
 * the merged buffer's contents are first composited together independent of the
 * target buffer.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {number} opacity Alpha value controlling blending the merged buffer to
 * the target buffer. Range 0 to 1.
 * @param {CanvasBuffer|GLBuffer} mergedBuffer The merged buffer.
 */
var BufferMergeEvent = function (sid, sessionEventId, undone, opacity, mergedBuffer) {
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.opacity = opacity;
		this.mergedBuffer = mergedBuffer;
	}
};

BufferMergeEvent.prototype = new PictureEvent('bufferMerge');

/**
 * @param {Object} json JS object to parse values from.
 */
BufferMergeEvent.prototype.fromJS = function (json) {
	this.opacity = json['opacity'];
	this.mergedBuffer = {
		id: json['mergedBufferId'],
		isDummy: true
	};
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
BufferMergeEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * @return {boolean} Whether the event is a buffer stack change.
 */
BufferMergeEvent.prototype.isBufferStackChange = function () {
	return true;
};

/**
 * Parse a BufferMergeEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
BufferMergeEvent.parseLegacy = function (json, arr, i, version) {
	json['opacity'] = parseFloat(arr[i++]);
	json['mergedBufferId'] = parseInt(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
BufferMergeEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['opacity'] = this.opacity;
	json['mergedBufferId'] = this.mergedBuffer.id;
};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
BufferMergeEvent.prototype.getBoundingBox = function (clipRect) {
	return new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
};


/**
 * Event that hides an another event in an undoable way.
 * @constructor
 * @param {number} sid Session identifier. Must be an integer.
 * @param {number} sessionEventId An event/session specific identifier. The idea
 * is that the sid/sessionEventId pair is unique for this event, and that newer
 * events will have greater sessionEventIds. Must be an integer.
 * @param {boolean} undone Whether this event is undone.
 * @param {number} hiddenSid The session identifier of the hidden event.
 * @param {number} hiddenSessionEventId Event/session specific identifier of the
 * hidden event.
 */
var EventHideEvent = function (sid, sessionEventId, undone, hiddenSid, hiddenSessionEventId) {
	if (sid !== undefined) {
		this.sid = sid;
		this.sessionEventId = sessionEventId;
		this.undone = undone;
		this.hiddenSid = hiddenSid;
		this.hiddenSessionEventId = hiddenSessionEventId;
	}
};

EventHideEvent.prototype = new PictureEvent('eventHide');

/**
 * @param {Object} json JS object to parse values from.
 */
EventHideEvent.prototype.fromJS = function (json) {
	this.hiddenSid = json['hiddenSid'];
	this.hiddenSessionEventId = json['hiddenSessionEventId'];
};

/**
 * @return {boolean} Is the event drawn using a rasterizer?
 */
EventHideEvent.prototype.isRasterized = function () {
	return false;
};

/**
 * Parse an EventHideEvent from a tokenized serialization.
 * @param {Object} json JS object corresponding to the event to add parsed information to.
 * @param {Array.<string>} arr Array containing the tokens, split at spaces from
 * the original serialization.
 * @param {number} i Index of the first token to deserialize.
 * @param {number} version Version number of the serialization format.
 */
EventHideEvent.parseLegacy = function (json, arr, i, version) {
	json['hiddenSid'] = parseInt(arr[i++]);
	json['hiddenSessionEventId'] = parseInt(arr[i++]);
};

/**
 * @param {Object} json JS object to serialize the event data to, that can then be stringified.
 */
EventHideEvent.prototype.serialize = function (json) {
	this.serializePictureEvent(json);
	json['hiddenSid'] = this.hiddenSid;
	json['hiddenSessionEventId'] = this.hiddenSessionEventId;
};

/**
 * @param {Rect} clipRect Canvas bounds that can be used to intersect the
 * bounding box against, though this is not mandatory.
 * @return {Rect} The event's bounding box. This function is not allowed to
 * change its earlier return values as a side effect.
 */
EventHideEvent.prototype.getBoundingBox = function (clipRect) {
	return new Rect(clipRect.left, clipRect.right,
		clipRect.top, clipRect.bottom);
};

/**
 * Convert object with serialize(json) support to a string.
 * @param {Object} obj
 * @return {string} String JSON representation of the object.
 */
var serializeToString = function (obj) {
	var json = {};
	obj.serialize(json);
	return JSON.stringify(json);
};
