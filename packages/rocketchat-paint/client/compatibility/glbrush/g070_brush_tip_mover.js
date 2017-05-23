/*
 * Copyright Olli Etuaho 2013.
 */

'use strict';

/**
 * Utility for generating a series of individual tip sample positions from
 * control points.
 * @param {boolean} fillShortSegments If true, segments smaller than one pixel
 * are filled with a circle with reduced flow.
 * @constructor
 */
var BrushTipMover = function (fillShortSegments) {
	this.fillShortSegments = fillShortSegments;
	this.target = null;
};

/**
 * @enum {number}
 */
BrushTipMover.Rotation = {
	off: 0,
	random: 1,
	clockwise: 2,
	counterclockwise: 3,
	controlled: 4
};

/**
 * @const
 */
BrushTipMover.lineSegmentLength = 5.0;

/**
 * Reset the brush tip position and the target to draw to.
 * @param {Object} target Target that implements the fillCircle interface.
 * @param {AffineTransform} transform Transform for the event coordinates.
 * @param {number} x Horizontal position to place the tip to.
 * @param {number} y Vertical position to place the tip to.
 * @param {number} pressure Pressure at the start of the stroke.
 * @param {number} radius Maximum radius of the stroke. Must be > 0.
 * @param {number} flow Alpha value affecting the alpha of individual fillCircle calls.
 * @param {number} scatterOffset Relative amount of random offset for each fillCircle call. Must be >= 0.
 * @param {number} spacing Amount of spacing between fillCircle calls. Must be > 0.
 * @param {boolean} relativeSpacing If true, spacing is interpreted as relative to the current radius.
 * @param {BrushTipMover.Rotation} rotationMode How to rotate the tip samples
 * along the stroke. If something else than off, there's no guarantee that two
 * identical inputs will generate the same rotation output values.
 * @param {number=} rotationAngle If rotationMode is controlled, angle of the brush tip sample at the starting point.
 * If rotationMode is something else, the value is ignored.
 */
BrushTipMover.prototype.reset = function (target, transform, x, y, pressure, radius, flow, scatterOffset,
																					spacing, relativeSpacing, rotationMode, rotationAngle) {
	if (rotationAngle === undefined) {
		rotationAngle = 0;
	}
	this.target = target;
	this.transform = transform;

	this.targetX = transform.transformX(x, y);
	this.targetY = transform.transformY(x, y);
	this.targetR = transform.scaleValue(pressure * radius);
	this.targetRot = rotationAngle;
	this.t = 0; // position along last drawn curve segment, relative to the segment's end, in pixels

	this.x = this.targetX;
	this.y = this.targetY;
	this.pressure = pressure;
	this.rotationAngle = rotationAngle,
		this.radius = transform.scaleValue(radius);
	this.flow = flow;
	// TODO: assert(scatterOffset >= 0);
	this.scatterOffset = scatterOffset;
	// TODO: assert(spacing > 0);
	this.spacing = spacing;
	this.relativeSpacing = relativeSpacing;
	this.rotationMode = rotationMode;
	this.rot = 0;
	this.rotationStep = 0;
	// Rotation speed of 1 should correspond to one pixel movement of a point on the edge of the circle at the
	// maximum radius per one pixel of brush movement.
	var rotationSpeed = 1.0;
	if (this.rotationMode === BrushTipMover.Rotation.clockwise) {
		this.rotationStep = rotationSpeed / (2 * Math.PI * this.radius);
	}
	if (this.rotationMode === BrushTipMover.Rotation.counterclockwise) {
		this.rotationStep = -rotationSpeed / (2 * Math.PI * this.radius);
	}

	// TODO: Allow continuous brush when rotation is clockwise or counterclockwise
	this.continuous = !this.relativeSpacing && this.spacing === 1 &&
		this.scatterOffset === 0 && this.rotationMode === BrushTipMover.Rotation.off;
	// Calculate drawFlowAlpha to achieve the intended flow in case of maximum pressure and solid, continuous brush.
	// For non-continuous brush, the alpha gets adjusted while drawing to match the flow of the continuous brush.
	var nBlends = this.radius * 2;
	this.drawFlowAlpha = colorUtil.alphaForNBlends(this.flow, nBlends);

	this.direction = new Vec2(0, 0);
};

/**
 * Move the brush tip.
 * @param {number} x Horizontal position to move the tip to.
 * @param {number} y Vertical position to move the tip to.
 * @param {number} pressure Pressure at the position to move to.
 * @param {number=} rotationAngle If rotationMode is controlled, angle of the brush tip sample at this point. If
 * rotationMode is something else, the value is ignored.
 * @param {number=} rotationAngleAfter If present, the angle of the brush tip sample after this point is set to this
 * value.
 */
BrushTipMover.prototype.move = function (x, y, pressure, rotationAngle, rotationAngleAfter) {
	if (rotationAngle === undefined) {
		rotationAngle = 0;
	}
	if (rotationAngleAfter === undefined) {
		rotationAngleAfter = rotationAngle;
	}
	x = this.transform.transformX(x, y);
	y = this.transform.transformY(x, y);
	var xd, yd, pd, rd, rotd;
	var dx = x - this.x;
	var dy = y - this.y;
	var d = Math.sqrt(dx * dx + dy * dy);

	// Brush smoothing. By default, make a straight line.
	var bezierX = this.x + dx * 0.5;
	var bezierY = this.y + dy * 0.5;
	var useBezier = dx * this.direction.x + dy * this.direction.y > d * 0.5;
	if (useBezier) {
		// ad-hoc weighing of points to get a visually pleasing result
		bezierX = this.x + this.direction.x * d * 0.25 + dx * 0.25;
		bezierY = this.y + this.direction.y * d * 0.25 + dy * 0.25;
	}

	if (d < this.t) {
		if (this.continuous && this.fillShortSegments) {
			// this.t - 1.0 is basically how far this.t was from the end of the previous segment when the previous
			// circle was drawn.
			// TODO: assert(this.t - 1.0 <= 0);
			var step = d * 0.5 - (this.t - 1.0);
			if (100000 * step > this.radius * 2) {
				var drawFlowAlpha = colorUtil.alphaForNBlends(this.flow, Math.ceil(this.radius * 2 / step));
				this.target.fillCircle(bezierX, bezierY, (pressure + this.pressure) * 0.5 * this.radius,
					drawFlowAlpha, 0);
			}
			this.t = 1.0 - d * 0.5;
		} else {
			this.t -= d;
		}
		this.targetX = x;
		this.targetY = y;
		this.targetR = pressure * this.radius;
	} else {
		// We'll split the smoothed stroke segment to line segments with approx
		// length of BrushTipMover.lineSegmentLength, trying to fit them nicely
		// between the two stroke segment endpoints.
		var t = 0;
		var drawSteps = Math.ceil(d / BrushTipMover.lineSegmentLength);
		var tSegment = 0.99999 / drawSteps;
		var drawLength = d;
		var bezierLength = d;
		if (useBezier) {
			drawLength = mathUtil.bezierLength(this.x, this.y, bezierX, bezierY, x, y, drawSteps);
			bezierLength = mathUtil.bezierLength(this.x, this.y, bezierX, bezierY, x, y, 16);
		}
		while (t < 1.0) {
			xd = this.x * Math.pow(1.0 - t, 2) + bezierX * t * (1.0 - t) * 2 + x * Math.pow(t, 2);
			yd = this.y * Math.pow(1.0 - t, 2) + bezierY * t * (1.0 - t) * 2 + y * Math.pow(t, 2);
			pd = this.pressure + (pressure - this.pressure) * t;
			rd = pd * this.radius;
			rotd = mathUtil.mixAngles(this.rotationAngle, rotationAngle, t);
			this.circleLineTo(xd, yd, rd, rotd, drawLength / bezierLength);
			t += tSegment;
		}
	}
	// The tangent of the bezier curve at the end of the curve intersects
	// with the control point, we get the next step's starting direction
	// from there.
	this.direction.x = x - bezierX;
	this.direction.y = y - bezierY;
	this.direction.normalize();
	this.x = x;
	this.y = y;
	this.pressure = pressure;
	this.rotationAngle = rotationAngleAfter;
	if (rotationAngleAfter !== rotationAngle) {
		this.targetRot = rotationAngleAfter;
	}
};

/**
 * Draw a series of circles from the current target point and radius to the given
 * point and radius. Radius, x, and y values for circles along the line are
 * interpolated linearly from the previous parameters to this function. Circles
 * are placed at intervals determined by spacing along the path, a circle
 * doesn't necessarily end up exactly at the end point. On the first call,
 * doesn't draw anything.
 * @param {number} centerX The x coordinate of the center of the circle at the
 * end of the line.
 * @param {number} centerY The y coordinate of the center of the circle at the
 * end of the line.
 * @param {number} radius The radius at the end of the line.
 * @param {number} rotation Rotation at the end of the line.
 * @param {number} spacingMultiplier Multiplier to adjust spacing by so that the
 * amount of tip samples drawn does not vary by the accuracy of the curve
 * approximation.
 */
BrushTipMover.prototype.circleLineTo = function (centerX, centerY, radius, rotation, spacingMultiplier) {
	// TODO: assert(spacingMultiplier > 0)
	if (this.targetX !== null) {
		var diff = new Vec2(centerX - this.targetX, centerY - this.targetY);
		var d = diff.length();
		var drawSpacing = this.spacing * spacingMultiplier;
		var drawFlowAlpha = this.drawFlowAlpha;
		if (this.rotationMode !== BrushTipMover.Rotation.random && this.scatterOffset === 0) {
			// Combine very nearly spaced tip samples together by adjusting the alpha (for absolute spacing).
			// This shouldn't cause problems for scaling, since the spacing is imperceptible if it is < 1 pixel.
			drawSpacing = Math.max(this.spacing * spacingMultiplier, 1.0);
			var nBlends = drawSpacing / (this.spacing * spacingMultiplier);
			drawFlowAlpha = colorUtil.nBlends(this.drawFlowAlpha, nBlends);
		}
		while (this.t < d) {
			var t = this.t / d;
			var drawRadius = this.targetR + (radius - this.targetR) * t;
			if (this.continuous) { // No scatter, absolute spacing of 1, constant alpha and no rotation.
				this.target.fillCircle(this.targetX + diff.x * t,
					this.targetY + diff.y * t,
					drawRadius, drawFlowAlpha, 0);
			} else {
				if (this.rotationMode === BrushTipMover.Rotation.random) {
					this.rot = Math.random() * 2 * Math.PI;
				} else if (this.rotationMode === BrushTipMover.Rotation.controlled) {
					this.rot = mathUtil.mixAngles(this.targetRot, rotation, t);
				}
				var offset = Math.random() * this.scatterOffset * radius;
				var offsetAngle = Math.random() * 2 * Math.PI;
				if (this.relativeSpacing) {
					// TODO: Consider accumulating relatively spaced tip samples if they're very close to each other
					var desiredSpacing = (this.spacing * spacingMultiplier) * drawRadius;
					// If the step is too small, just do an arbitrary, smallish resolution-independent step.
					var smallPressure = 0.01;
					var minSpacing = (this.spacing * spacingMultiplier) * this.radius * smallPressure;
					if (desiredSpacing > 0) {
						desiredSpacing = Math.max(desiredSpacing, minSpacing);
						// Calculate how many blends would happen with a brush of absolute spacing
						// of 1, or if the circles don't touch each other, how many blends would
						// happen in one circle's diameter.
						var nBlends = Math.min(desiredSpacing, drawRadius * 2);
						drawFlowAlpha = colorUtil.nBlends(this.drawFlowAlpha, nBlends);
						drawSpacing = desiredSpacing;
					} else {
						drawFlowAlpha = 0.0;
						drawSpacing = minSpacing;
					}
				}
				this.target.fillCircle(this.targetX + diff.x * t + offset * Math.sin(offsetAngle),
					this.targetY + diff.y * t + offset * Math.cos(offsetAngle),
					drawRadius, drawFlowAlpha, this.rot);
			}
			this.t += drawSpacing;
			this.rot += this.rotationStep * drawSpacing;
		}
		this.t -= d;
	}
	this.targetX = centerX;
	this.targetY = centerY;
	this.targetR = radius;
	this.targetRot = rotation;
};
