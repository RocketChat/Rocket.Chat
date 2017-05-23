/*
 * Copyright Olli Etuaho 2012-2014.
 */

// This file contains following utilities:
// cssUtil: Utilities for working with CSS
// colorUtil: Utilities for working with RGB colors represented as arrays of numbers, including blending
// Vec2: A class for storing a two-dimensional vector.
// AffineTransform: A scale/translate transform.
// Rect: A class for storing a two-dimensional rectangle.
// canvasUtil: Utilities for drawing to a 2D canvas.

'use strict';

var cssUtil = {
	rgbString: null,
	rgbaString: null
};

/**
 * Create a CSS RGB color based on the input array.
 * @param {Array.<number>|Uint8Array} rgbArray Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {string} CSS color.
 */
cssUtil.rgbString = function (rgbArray) {
	return 'rgb(' + Math.floor(rgbArray[0]) + ',' + Math.floor(rgbArray[1]) +
		',' + Math.floor(rgbArray[2]) + ')';
};

/**
 * Create a CSS RGBA color based on the input array.
 * @param {Array.<number>|Uint8Array} rgbaArray Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {string} CSS color.
 */
cssUtil.rgbaString = function (rgbaArray) {
	return 'rgba(' + Math.floor(rgbaArray[0]) + ',' + Math.floor(rgbaArray[1]) +
		',' + Math.floor(rgbaArray[2]) + ',' + (rgbaArray[3] / 255) + ')';
};

var colorUtil = {
	unpremultiply: null,
	premultiply: null,
	blend: null,
	serializeRGB: null,
	differentColor: null,
	blendWithFunction: null,
	blendMultiply: null,
	blendScreen: null,
	blendDarken: null,
	blendLighten: null,
	blendDifference: null,
	blendExclusion: null,
	blendOverlay: null,
	blendHardLight: null,
	blendSoftLight: null,
	blendColorBurn: null,
	blendLinearBurn: null,
	blendVividLight: null,
	blendLinearLight: null,
	blendPinLight: null,
	blendColorDodge: null,
	blendLinearDodge: null
};

/**
 * Unpremultiply a color value.
 * @param {Array.<number>|Uint8Array} premultRGBA Premultiplied color value.
 * Channel values should be 0-255.
 * @return {Array.<number>|Uint8Array} The input array, if the result is
 * identical, or a new array with unpremultiplied color. Channel values 0-255.
 */
colorUtil.unpremultiply = function (premultRGBA) {
	if (premultRGBA[3] === 255) {
		return premultRGBA;
	}
	var buffer = new ArrayBuffer(4);
	var unmultRGBA = new Uint8Array(buffer);
	var alpha = premultRGBA[3] / 255.0;
	if (alpha > 0) {
		for (var i = 0; i < 3; ++i) {
			unmultRGBA[i] = premultRGBA[i] / alpha;
		}
		unmultRGBA[3] = premultRGBA[3];
	} else {
		for (var i = 0; i < 4; ++i) {
			unmultRGBA[i] = 0;
		}
	}
	return unmultRGBA;
};

/**
 * Premultiply a color value.
 * @param {Array.<number>|Uint8Array} unpremultRGBA Unpremultiplied color value.
 * Channel values should be 0-255.
 * @return {Array.<number>|Uint8Array} The input array, if the result is
 * identical, or a new array with premultiplied color. Channel values 0-255.
 */
colorUtil.premultiply = function (unpremultRGBA) {
	if (unpremultRGBA[3] === 255) {
		return unpremultRGBA;
	}
	var buffer = new ArrayBuffer(4);
	var premultRGBA = new Uint8Array(buffer);
	var alpha = unpremultRGBA[3] / 255.0;
	if (alpha > 0) {
		for (var i = 0; i < 3; ++i) {
			premultRGBA[i] = unpremultRGBA[i] * alpha;
		}
		premultRGBA[3] = unpremultRGBA[3];
	} else {
		for (var i = 0; i < 4; ++i) {
			premultRGBA[i] = 0;
		}
	}
	return premultRGBA;
};

/**
 * Blend two unpremultiplied color values.
 * @param {Array.<number>|Uint8Array} dstRGBA Destination RGBA value.
 * @param {Array.<number>|Uint8Array} srcRGBA Source RGBA value.
 * @return {Uint8Array} Resulting RGBA color value.
 */
colorUtil.blend = function (dstRGBA, srcRGBA) {
	var srcAlpha = srcRGBA[3] / 255.0;
	var dstAlpha = dstRGBA[3] / 255.0;
	var alpha = srcAlpha + dstAlpha * (1.0 - srcAlpha);
	var buffer = new ArrayBuffer(4);
	var resultRGBA = new Uint8Array(buffer);
	for (var i = 0; i < 3; ++i) {
		resultRGBA[i] = (dstRGBA[i] * dstAlpha * (1.0 - srcAlpha) +
			srcRGBA[i] * srcAlpha) / alpha + 0.5;
	}
	resultRGBA[3] = alpha * 255 + 0.5;
	return resultRGBA;
};

/**
 * Serialize an RGB value.
 * @param {Array.<number>|Uint8Array} RGB RGB value.
 * @return {Array} Copy of the value suitable for adding to JSON.
 */
colorUtil.serializeRGB = function (RGB) {
	return [RGB[0], RGB[1], RGB[2]];
};

/**
 * Return a color that is visually distinct from the given color. The hue is
 * inverted and the lightness is inverted, unless the lightness is close to
 * 0.5, when the lightness is simply increased.
 * @param {Array.<number>|Uint8Array} color An RGB value.
 * @return {Array.<number>} A different RGB value.
 */
colorUtil.differentColor = function (color) {
	var hsl = rgbToHsl(color[0], color[1], color[2]);
	hsl[0] = (hsl[0] + 0.5) % 1;
	if (hsl[2] < 0.4 || hsl[2] > 0.6) {
		hsl[2] = 1.0 - hsl[2];
	} else {
		hsl[2] = (hsl[2] + 0.4) % 1;
	}
	return hslToRgb(hsl[0], hsl[1], hsl[2]);
};

/**
 * Blend the two single-channel values to each other, taking into account bottom and top layer alpha.
 * @param {function} blendFunction The blend function to use, one of colorUtil.blend*
 * @param {number} target Single-channel color value of the bottom layer, 0 to 255.
 * @param {number} source Single-channel color value of the top layer, 0 to 255.
 * @param {number} targetAlpha Alpha value of the bottom layer, 0.0 to 1.0.
 * @param {number} sourceAlpha Alpha value of the top layer, 0.0 to 1.0.
 * @return {number} Blend result as an integer from 0 to 255.
 */
colorUtil.blendWithFunction = function (blendFunction, target, source, targetAlpha, sourceAlpha) {
	var alpha = targetAlpha + sourceAlpha * (1.0 - targetAlpha);
	if (alpha > 0.0) {
		// First calculate the blending result without taking the transparency of the target into account.
		var rawResult = blendFunction(target, source);
		// Then mix according to weights.
		// See KHR_blend_equation_advanced specification for reference.
		return Math.round((rawResult * targetAlpha * sourceAlpha +
			source * sourceAlpha * (1.0 - targetAlpha) +
			target * targetAlpha * (1.0 - sourceAlpha)) / alpha);
	} else {
		return 0.0;
	}
};

/**
 * Multiply blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendMultiply = function (a, b) {
	return a * b / 255.;
};

/**
 * Screen blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendScreen = function (a, b) {
	return 255. - (1. - a / 255.) * (255. - b);
};

/**
 * Overlay blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendOverlay = function (a, b) {
	return a < 127.5 ?
		(2.0 / 255.0 * a * b) :
		(255.0 - 2.0 * (1.0 - b / 255.0) * (255.0 - a));
};

/**
 * Hard Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendHardLight = function (a, b) {
	return b < 127.5 ?
		(2.0 / 255.0 * a * b) :
		(255.0 - 2.0 * (1.0 - b / 255.0) * (255.0 - a));
};

/**
 * Soft Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendSoftLight = function (a, b) {
	a /= 255;
	b /= 255;
	return 255 * (b <= .5 ? a - (1 - 2 * b) * a * (1 - a) :
			b > 0.5 && a <= 0.25 ? a + (2 * b - 1) * a * ((16 * a - 12) * a + 3) :
			a + (2 * b - 1) * (Math.sqrt(a) - a));
};

/**
 * Darken blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendDarken = function (a, b) {
	return a < b ? a : b;
};

/**
 * Lighten blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLighten = function (a, b) {
	return a > b ? a : b;
};

/**
 * Difference blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendDifference = function (a, b) {
	return Math.abs(a - b);
};

/**
 * Exclusion blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendExclusion = function (a, b) {
	return a + b - 2.0 / 255.0 * a * b;
};

/**
 * Color Burn blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendColorBurn = function (a, b) {
	if (a === 255)
		return 255;
	if (b === 0)
		return 0;
	return mathUtil.clamp(0, 255, 255 - (255 - a) / b * 255);
};

/**
 * Linear Burn blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearBurn = function (a, b) {
	return mathUtil.clamp(0, 255, a + b - 255.);
};

/**
 * Vivid Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendVividLight = function (a, b) {
	if (b === 0)
		return 0;
	if (b === 255)
		return 255;
	a /= 255;
	b /= 255;
	return mathUtil.clamp(0, 255, 255 * (b <= .5 ?
		1 - (1 - a) / (2 * b) :
		a / (2 * (1 - b))));
};

/**
 * Linear Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearLight = function (a, b) {
	a /= 255;
	b /= 255;
	return mathUtil.clamp(0, 255, 255 * (b <= .5 ?
			(a + 2 * b - 1) :
			(a + 2 * (b - 0.5))));
};

/**
 * Pin Light blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendPinLight = function (a, b) {
	a /= 255;
	b /= 255;
	return 255 * (b <= .5 ?
			(Math.min(a, 2 * b)) :
			(Math.max(a, 2 * (b - 0.5))));
};

/**
 * Color Dodge blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendColorDodge = function (a, b) {
	if (a === 0)
		return 0;
	if (b === 255)
		return 255;
	return mathUtil.clamp(0, 255, 255. * a / (255 - b));
};

/**
 * Linear Dodge blend mode.
 * @param {number} a Value between/or 0 and 255
 * @param {number} b Value between/or 0 and 255
 * @return {number} Blended value between/or 0 and 255
 */
colorUtil.blendLinearDodge = function (a, b) {
	return mathUtil.clamp(0, 255, a + b);
};

var mathUtil = {
	mix: null,
	fmod: null,
	mixAngles: null,
	angleDifference: null,
	angleGreater: null,
	ease: null,
	clamp: null,
	bezierLength: null
};

/**
 * Linear interpolation of a and b by weight f
 * @param {number} a Value a, if f == 0.0, a is returned
 * @param {number} b Value b, if f == 1.0, b is returned
 * @param {number} f Interpolation weight
 * @return {number} Interpolated value between a and b
 */
mathUtil.mix = function (a, b, f) {
	return a + f * (b - a);
};

/**
 * Modulus for floating point numbers.
 * @param {number} a Dividend
 * @param {number} b Divisor
 * @return {number} Float remainder of a / b
 */
mathUtil.fmod = function (a, b) {
	return Number((a - (Math.floor(a / b) * b)).toPrecision(8));
};

/**
 * Mix numbers by weight a and b, wrapping back to 0 at w.
 * @param {number} a Number a, if f == 0.0, a + n * w is returned.
 * @param {number} b Number b, if f == 1.0, b + n * w is returned.
 * @param {number} f Interpolation weight.
 * @param {number} w Number to wrap around at.
 * @return {number} Interpolated value between a and b.
 */
mathUtil.mixWithWrap = function (a, b, f, w) {
	a = mathUtil.fmod(a, w);
	b = mathUtil.fmod(b, w);
	if (Math.abs(a - b) > w * 0.5) {
		if (a > b) {
			b += w;
		} else {
			a += w;
		}
	}
	return mathUtil.fmod(mathUtil.mix(a, b, f), w);
};

/**
 * Linear interpolation of angles a and b in radians by weight f
 * @param {number} a Angle a, if f == 0.0, a + n * PI * 2 is returned.
 * @param {number} b Angle b, if f == 1.0, b + n * PI * 2 is returned.
 * @param {number} f Interpolation weight.
 * @return {number} Interpolated value between a and b.
 */
mathUtil.mixAngles = function (a, b, f) {
	return mathUtil.mixWithWrap(a, b, f, 2 * Math.PI);
};

/**
 * @param {number} a Angle a.
 * @param {number} b Angle b.
 * @return {number} Smallest difference of the angles a + n * PI * 2 and b in radians.
 */
mathUtil.angleDifference = function (a, b) {
	a = mathUtil.fmod(a, Math.PI * 2);
	b = mathUtil.fmod(b, Math.PI * 2);
	if (Math.abs(a - b) > Math.PI) {
		if (a > b) {
			b += Math.PI * 2;
		} else {
			a += Math.PI * 2;
		}
	}
	return Math.abs(a - b);
};

/**
 * @param {number} a Angle a.
 * @param {number} b Angle b.
 * @return {boolean} True if the angle a + n * PI * 2 that is closest to b is greater than b.
 */
mathUtil.angleGreater = function (a, b) {
	a = mathUtil.fmod(a, Math.PI * 2);
	b = mathUtil.fmod(b, Math.PI * 2);
	if (Math.abs(a - b) > Math.PI) {
		if (a > b) {
			return false;
		} else {
			return true;
		}
	}
	return (a > b);
};

/**
 * Smooth interpolation of a and b by transition value f. Starts off quickly but eases towards the end.
 * @param {number} a Value a, if f == 0.0, a is returned
 * @param {number} b Value b, if f == 1.0, b is returned
 * @param {number} f Interpolation transition value
 * @return {number} Interpolated value between a and b
 */
mathUtil.ease = function (a, b, f) {
	return a + Math.sin(f * Math.PI * 0.5) * (b - a);
};

/**
 * Clamps value to range.
 * @param {number} min Minimum bound
 * @param {number} max Maximum bound
 * @param {number} value Value to be clamped
 * @return {number} Clamped value
 */
mathUtil.clamp = function (min, max, value) {
	return value < min ? min : (value > max ? max : value);
};

/**
 * @param {number} x0 Start point x.
 * @param {number} y0 Start point y.
 * @param {number} x1 Control point x.
 * @param {number} y1 Control point y.
 * @param {number} x2 End point x.
 * @param {number} y2 End point y.
 * @param {number} steps How many segments to split the bezier curve to.
 * @return {number} Approximate length of the quadratic bezier curve.
 */
mathUtil.bezierLength = function (x0, y0, x1, y1, x2, y2, steps) {
	var len = 0;
	var prevX = x0;
	var prevY = y0;
	var t = 0;
	var xd, yd;
	for (var i = 0; i < steps; ++i) {
		t += 1.0 / steps;
		xd = x0 * Math.pow(1.0 - t, 2) + x1 * t * (1.0 - t) * 2 + x2 * Math.pow(t, 2);
		yd = y0 * Math.pow(1.0 - t, 2) + y1 * t * (1.0 - t) * 2 + y2 * Math.pow(t, 2);
		len += Math.sqrt(Math.pow(xd - prevX, 2) + Math.pow(yd - prevY, 2));
		prevX = xd;
		prevY = yd;
	}
	return len;
};

/**
 * @constructor
 * @param {number} x Horizontal component of the vector.
 * @param {number} y Vertical component of the vector.
 */
var Vec2 = function (x, y) {
	this.x = x;
	this.y = y;
};

/**
 * Copy vec2 coordinates from another vec2.
 * @param {Vec2} vec Another vector.
 */
Vec2.prototype.setVec2 = function (vec) {
	this.x = vec.x;
	this.y = vec.y;
};

/**
 * Round the coordinates of this vector to the closest integers.
 */
Vec2.prototype.round = function () {
	this.x = Math.round(this.x);
	this.y = Math.round(this.y);
};

/**
 * Normalize this vector.
 */
Vec2.prototype.normalize = function () {
	var len = this.length();
	this.x /= len;
	this.y /= len;
};

/**
 * Calculate this vector's distance from another vector.
 * @param {Vec2} vec The other vector.
 * @return {number} The distance.
 */
Vec2.prototype.distance = function (vec) {
	return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2));
};

/**
 * Calculate length.
 * @return {number} The length of the vector.
 */
Vec2.prototype.length = function () {
	return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
};

/**
 * Scale this vector by scalar mult.
 * @param {number} mult Multiplier to scale with.
 */
Vec2.prototype.scale = function (mult) {
	this.x *= mult;
	this.y *= mult;
};

/**
 * Dot product with another Vec2.
 * @param {Vec2} vec Vector to calculate the dot product with.
 * @return {number} The dot product.
 */
Vec2.prototype.dotProduct = function (vec) {
	return this.x * vec.x + this.y * vec.y;
};

/**
 * Calculate the angle of this vector compared to the positive x axis, so that
 * the angle is < PI when y < 0 and > PI when y < 0.
 * @return {number} The angle.
 */
Vec2.prototype.angle = function () {
	var angle = Math.acos(this.x / this.length());
	if (this.y < 0) {
		angle = Math.PI * 2 - angle;
	}
	return angle;
};

/**
 * Calculate the angle difference between two vectors, with both vectors'
 * angles calculated from the positive x axis.
 * @param {Vec2} vec The other vector.
 * @return {number} The difference in angles.
 */
Vec2.prototype.angleFrom = function (vec) {
	return this.angle() - vec.angle();
};

/**
 * Calculate slope from this vector to another vector i.e. delta Y / delta X.
 * Does not check for division by zero.
 * @param {Vec2} vec The other vector.
 * @return {number} The slope.
 */
Vec2.prototype.slope = function (vec) {
	return (vec.y - this.y) / (vec.x - this.x);
};

/**
 * Projects this vector to the nearest point on the line defined by two points.
 * @param {Vec2} lineA One point on the line to project to.
 * @param {Vec2} lineB Another point on the line to project to.
 */
Vec2.prototype.projectToLine = function (lineA, lineB) {
	if (lineA.x === lineB.x) {
		this.x = lineA.x;
		return;
	} else if (lineA.y === lineB.y) {
		this.y = lineA.y;
		return;
	}

	// The line's equation: y = lineSlope * x + lineYAtZero
	var lineSlope = lineA.slope(lineB);
	var lineYAtZero = lineA.y - lineSlope * lineA.x;

	var perpVector = new Vec2(1.0, -1.0 / lineSlope);
	perpVector.normalize();
	// perpVector's dot product with a vector that goes from line to this Vec2
	var perpProjLength = perpVector.y *
		(this.y - (lineSlope * this.x + lineYAtZero));
	this.x -= perpVector.x * perpProjLength;
	this.y -= perpVector.y * perpProjLength;
};

/**
 * Projects this vector to the nearest point on the given circle.
 * @param {number} x The x coordinate of the center of the circle.
 * @param {number} y The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 */
Vec2.prototype.projectToCircle = function (x, y, radius) {
	var angle = Math.atan2(this.y - y, this.x - x);
	this.x = x + Math.cos(angle) * radius;
	this.y = y + Math.sin(angle) * radius;
};

/**
 * Calculate this vector's distance to the line defined by two points.
 * @param {Vec2} lineA One point on the line.
 * @param {Vec2} lineB Another point on the line.
 * @return {number} This vector's distance to the nearest point on the line.
 */
Vec2.prototype.distanceToLine = function (lineA, lineB) {
	var projection = new Vec2(this.x, this.y);
	projection.projectToLine(lineA, lineB);
	return this.distance(projection);
};

/**
 * Transform this vector with a 3x3 SVG matrix.
 * @param {SVGMatrix} svgMatrix Matrix to transform with.
 */
Vec2.prototype.transformSvg = function (svgMatrix) {
	var x = svgMatrix.a * this.x + svgMatrix.c * this.y + svgMatrix.e;
	this.y = svgMatrix.b * this.x + svgMatrix.d * this.y + svgMatrix.f;
	this.x = x;
};

/**
 * Translate this vector with another vector.
 * @param {Vec2} vec Vector to translate with.
 */
Vec2.prototype.translate = function (vec) {
	this.x += vec.x;
	this.y += vec.y;
};

/**
 * Rotate this vector with a given angle.
 * @param {number} angle Angle to rotate with.
 */
Vec2.prototype.rotate = function (angle) {
	var x = Math.cos(angle) * this.x - Math.sin(angle) * this.y;
	this.y = Math.sin(angle) * this.x + Math.cos(angle) * this.y;
	this.x = x;
};

/**
 * A 2D affine transform.
 * @constructor
 */
var AffineTransform = function () {
	this.scale = 1.0;
	this.translate = new Vec2(0, 0);
	this.generation = 0; // Id number that can be used to determine the transform's identity.
};

/**
 * Transform the given vector.
 * @param {Vec2} vec Vector to transform in-place.
 */
AffineTransform.prototype.transform = function (vec) {
	vec.x = vec.x * this.scale + this.translate.x;
	vec.y = vec.y * this.scale + this.translate.y;
};

/**
 * Inverse transform the given vector.
 * @param {Vec2} vec Vector to transform in-place.
 */
AffineTransform.prototype.inverseTransform = function (vec) {
	vec.x = (vec.x - this.translate.x) / this.scale;
	vec.y = (vec.y - this.translate.y) / this.scale;
};

/**
 * Transform the given coordinate.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {number} Transformed x coordinate.
 */
AffineTransform.prototype.transformX = function (x, y) {
	return x * this.scale + this.translate.x;
};

/**
 * Transform the given coordinate.
 * @param {number} x X coordinate.
 * @param {number} y Y coordinate.
 * @return {number} Transformed y coordinate.
 */
AffineTransform.prototype.transformY = function (x, y) {
	return y * this.scale + this.translate.y;
};

/**
 * Scale the given coordinate.
 * @param {number} v Coordinate.
 * @return {number} Scaled coordinate.
 */
AffineTransform.prototype.scaleValue = function (v) {
	return v * this.scale;
};

/**
 * Inverse scale the given coordinate.
 * @param {number} v Coordinate.
 * @return {number} Scaled coordinate.
 */
AffineTransform.prototype.inverseScale = function (v) {
	return v / this.scale;
};

/**
 * Transform an axis-aligned rectangle.
 * @param {Rect} rect Rectangle to transform in-place.
 */
AffineTransform.prototype.transformRect = function (rect) {
	var left = rect.left;
	rect.left = this.transformX(rect.left, rect.top);
	rect.right = this.transformX(rect.right, rect.top);
	rect.top = this.transformY(left, rect.top);
	rect.bottom = this.transformY(left, rect.bottom);
};


/**
 * @constructor
 * @param {number} left Left edge of the rectangle.
 * @param {number} right Right edge of the rectangle.
 * @param {number} top Top edge of the rectangle.
 * @param {number} bottom Bottom edge of the rectangle.
 */
var Rect = function (left, right, top, bottom) {
	this.set(left, right, top, bottom);
};

/**
 * Set the rectangle's coordinates.
 * @param {number} left Left edge of the rectangle.
 * @param {number} right Right edge of the rectangle.
 * @param {number} top Top edge of the rectangle.
 * @param {number} bottom Bottom edge of the rectangle.
 */
Rect.prototype.set = function (left, right, top, bottom) {
	if (left === undefined || left === right || top === bottom) {
		this.makeEmpty();
		return;
	}
	this.left = left;
	this.right = right;
	this.top = top;
	this.bottom = bottom;
};

/**
 * Copy rectangle coordinates from another rectangle.
 * @param {Rect} rect Another rectangle.
 */
Rect.prototype.setRect = function (rect) {
	this.left = rect.left;
	this.right = rect.right;
	this.top = rect.top;
	this.bottom = rect.bottom;
};

/**
 * Make this rectangle empty.
 */
Rect.prototype.makeEmpty = function () {
	this.left = 0;
	this.right = 0;
	this.top = 0;
	this.bottom = 0;
};

/**
 * @return {boolean} Is the rectangle empty?
 */
Rect.prototype.isEmpty = function () {
	return this.left === this.right || this.top === this.bottom;
};

/**
 * @return {number} The width of the rectangle.
 */
Rect.prototype.width = function () {
	return this.right - this.left;
};

/**
 * @return {number} The height of the rectangle.
 */
Rect.prototype.height = function () {
	return this.bottom - this.top;
};

/**
 * @return {number} Area of the rectangle.
 */
Rect.prototype.area = function () {
	return this.width() * this.height();
};

/**
 * @return {Object} This rectangle in a different representation. The return
 * value includes numbers x (left edge), y (top edge), w (width) and h (height).
 */
Rect.prototype.getXYWH = function () {
	return {
		x: this.left,
		y: this.top,
		w: this.right - this.left,
		h: this.bottom - this.top
	};
};

/**
 * @return {Object} This rectangle rounded out to integer coordinates. The
 * return value includes numbers x (left edge), y (top edge), w (width) and h
 * (height).
 */
Rect.prototype.getXYWHRoundedOut = function () {
	return {
		x: Math.floor(this.left),
		y: Math.floor(this.top),
		w: Math.ceil(this.right) - Math.floor(this.left),
		h: Math.ceil(this.bottom) - Math.floor(this.top)
	};
};

/**
 * Set this rectangle to the bounding box of this rectangle and the given
 * rectangle.
 * @param {Rect} rect Another rectangle.
 */
Rect.prototype.unionRect = function (rect) {
	if (rect.isEmpty()) {
		return;
	}
	if (this.isEmpty()) {
		this.setRect(rect);
	} else {
		this.left = Math.min(this.left, rect.left);
		this.right = Math.max(this.right, rect.right);
		this.top = Math.min(this.top, rect.top);
		this.bottom = Math.max(this.bottom, rect.bottom);
	}
};

/**
 * @param {Rect} rect Another rectangle.
 * @return {Rect} A new rectangle containing the union of this rectangle and the
 * given rectangle.
 */
Rect.prototype.getUnion = function (rect) {
	var ret = new Rect(rect.left, rect.right, rect.top, rect.bottom);
	ret.unionRect(this);
	return ret;
};

/**
 * Set this rectangle to the intersection of this this rectangle and the given
 * rectangle.
 * @param {Rect} rect Another rectangle.
 */
Rect.prototype.intersectRect = function (rect) {
	if (this.isEmpty()) {
		return;
	}
	if (rect.isEmpty()) {
		this.makeEmpty();
	} else {
		this.left = Math.max(this.left, rect.left);
		this.right = Math.min(this.right, rect.right);
		this.top = Math.max(this.top, rect.top);
		this.bottom = Math.min(this.bottom, rect.bottom);
		if (this.left >= this.right || this.top >= this.bottom) {
			this.makeEmpty();
		}
	}
};

/**
 * @param {Rect} rect Another rectangle.
 * @return {Rect} A new rectangle containing the intersection of this rectangle
 * and the given rectangle.
 */
Rect.prototype.getIntersection = function (rect) {
	var ret = new Rect(rect.left, rect.right, rect.top, rect.bottom);
	ret.intersectRect(this);
	return ret;
};

/**
 * Clip the rectangle from the top.
 * @param {number} top Coordinate to clip with.
 */
Rect.prototype.limitTop = function (top) {
	this.top = Math.min(Math.max(top, this.top), this.bottom);
};

/**
 * Clip the rectangle from the bottom.
 * @param {number} bottom Coordinate to clip with.
 */
Rect.prototype.limitBottom = function (bottom) {
	this.bottom = Math.min(Math.max(bottom, this.top), this.bottom);
};

/**
 * Clip the rectangle from the left.
 * @param {number} left Coordinate to clip with.
 */
Rect.prototype.limitLeft = function (left) {
	this.left = Math.min(Math.max(left, this.left), this.right);
};

/**
 * Clip the rectangle from the right.
 * @param {number} right Coordinate to clip with.
 */
Rect.prototype.limitRight = function (right) {
	this.right = Math.min(Math.max(right, this.left), this.right);
};

/**
 * @param {Vec2} coords Coordinates to check.
 * @return {boolean} Does this rectangle contain the given coordinates?
 */
Rect.prototype.containsVec2 = function (coords) {
	return !this.isEmpty() &&
		this.left <= coords.x &&
		this.right >= coords.x &&
		this.top <= coords.y &&
		this.bottom >= coords.y;
};

/**
 * @param {Rect} rect Another rectangle.
 * @return {boolean} Does this rectangle contain the other rectangle? The edges
 * are allowed to touch.
 */
Rect.prototype.containsRect = function (rect) {
	return this.left <= rect.left && this.right >= rect.right &&
		this.top <= rect.top && this.bottom >= rect.bottom;
};

/**
 * Test whether this rectangle is mostly inside another.
 * @param {Rect} rect Rectangle to check against.
 * @return {boolean} Whether most of this rectangle is inside the given one.
 */
Rect.prototype.isMostlyInside = function (rect) {
	return (this.getIntersection(rect).area() > 0.5 * this.area());
};

/**
 * Create a rectangle that's the bounding box of the given circle.
 * @param {number} x The x coordinate of the center of the circle.
 * @param {number} y The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 * @return {Rect} A new rectangle.
 */
Rect.fromCircle = function (x, y, radius) {
	return new Rect(x - radius, x + radius, y - radius, y + radius);
};

/**
 * Scale the rectangle with respect to the origin.
 * @param {number} scale Scaling factor.
 */
Rect.prototype.scale = function (scale) {
	this.left *= scale;
	this.right *= scale;
	this.top *= scale;
	this.bottom *= scale;
};

/**
 * Translate the rectangle with an offset.
 * @param {Vec2} offset The vector to translate with.
 */
Rect.prototype.translate = function (offset) {
	this.left += offset.x;
	this.right += offset.x;
	this.top += offset.y;
	this.bottom += offset.y;
};


var canvasUtil = {
	dummySvg: document.createElementNS('http://www.w3.org/2000/svg', 'svg')
};

/**
 * Draw an outlined stroke using the current path.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
 * @param {number} alpha Alpha multiplier for the drawing.
 */
canvasUtil.dualStroke = function (ctx, alpha) {
	if (alpha === undefined) {
		alpha = 1.0;
	}
	ctx.globalAlpha = 0.5 * alpha;
	ctx.lineWidth = 4.5;
	ctx.strokeStyle = '#fff';
	ctx.stroke();
	ctx.globalAlpha = 1.0 * alpha;
	ctx.lineWidth = 1.5;
	ctx.strokeStyle = '#000';
	ctx.stroke();
};

/**
 * Draw a light stroke using the current path.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
 */
canvasUtil.lightStroke = function (ctx) {
	ctx.globalAlpha = 0.3;
	ctx.lineWidth = 1.0;
	ctx.strokeStyle = '#000';
	ctx.stroke();
	ctx.globalAlpha = 1.0;
};

/**
 * NOTE: Didn't work on released browsers other than Firefox yet on 2014-01-24.
 * @param {CanvasRenderingContext2D} ctx The canvas rendering context.
 * @return {SVGMatrix} The current transform of the canvas rendering context.
 */
canvasUtil.getCurrentTransform = function (ctx) {
	var t = null;
	if (ctx.mozCurrentTransform) {
		t = canvasUtil.dummySvg.createSVGMatrix();
		t.a = ctx.mozCurrentTransform[0];
		t.b = ctx.mozCurrentTransform[1];
		t.c = ctx.mozCurrentTransform[2];
		t.d = ctx.mozCurrentTransform[3];
		t.e = ctx.mozCurrentTransform[4];
		t.f = ctx.mozCurrentTransform[5];
	} else {
		t = ctx.currentTransform.scale(1);
	}
	return t;
};

/**
 * Set the canvas clip rectangle.
 * @param {CanvasRenderingContext2D} ctx Context to set the rectangle to.
 * @param {Rect} rect Rectangle to set as canvas clip rectangle.
 */
canvasUtil.clipRect = function (ctx, rect) {
	var xywh = rect.getXYWHRoundedOut();
	ctx.beginPath();
	ctx.rect(xywh.x, xywh.y, xywh.w, xywh.h);
	ctx.clip();
};


/*
 * Copyright Olli Etuaho 2012-2014.
 */

// This file augments the 2d utilities to add functions that are useful for
// bitmap painting applications.

'use strict';

/**
 * Calculate the resulting alpha value from blending a given alpha value with
 * itself n times.
 * @param {number} alpha The alpha value to blend with itself, between 0 and 1.
 * @param {number} n Amount of times to blend.
 * @return {number} The resulting alpha value.
 */
colorUtil.nBlends = function (alpha, n) {
	if (n < 1) {
		return alpha * n;
	}
	if (alpha === 1.0) {
		return 1.0;
	}
	var i = 1;
	var result = alpha;
	while (i * 2 <= Math.floor(n)) {
		result = result + result * (1.0 - result);
		i *= 2;
	}
	while (i < Math.floor(n)) {
		result = result + alpha * (1.0 - result);
		++i;
	}
	if (n > i) {
		var remainder = n - i;
		result = result + alpha * (1.0 - result) * remainder; // Rough linear approximation
	}
	return result;
};

/**
 * Calculate an alpha value so that blending a sample with that alpha n times
 * results approximately in the given flow value.
 * @param {number} flow The flow value, between 0 and 1.
 * @param {number} n The number of times to blend.
 * @return {number} Such alpha value that blending it with itself n times
 * results in the given flow value.
 */
colorUtil.approximateAlphaForNBlends = function (flow, n) {
	// Solved from alpha blending differential equation:
	// flow'(n) = (1.0 - flow(n)) * singleBlendAlpha
	//return Math.min(-Math.log(1.0 - flow) / n, 1.0);

	// Above solution with an ad-hoc tweak:
	return Math.min(-Math.log(1.0 - flow) / (n + Math.pow(flow, 2) * 1.5), 1.0);
};

/**
 * Calculate an alpha value so that blending a sample with that alpha n times
 * results in the given flow value.
 * @param {number} flow The flow value, between 0 and 1.
 * @param {number} n The number of times to blend.
 * @return {number} Such alpha value that blending it with itself n times
 * results in the given flow value.
 */
colorUtil.alphaForNBlends = function (flow, n) {
	if (n < 1.0) {
		return Math.min(flow / n, 1.0);
	}
	if (flow < 1.0) {
		var guess = colorUtil.approximateAlphaForNBlends(flow, n);
		var low = 0;
		var high = flow;
		// Bisect until result is close enough
		while (true) {
			var blended = colorUtil.nBlends(guess, n);
			if (Math.abs(blended - flow) < 0.0005) {
				return guess;
			}
			if (blended < flow) {
				low = guess;
			} else {
				high = guess;
			}
			guess = (low + high) * 0.5;
		}
	} else {
		return 1.0;
	}
};

/**
 * Set this rectangle to the bounding box of this rectangle and the given
 * circle.
 * @param {number} x The x coordinate of the center of the circle.
 * @param {number} y The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 */
Rect.prototype.unionCircle = function (x, y, radius) {
	this.unionRect(new Rect(x - radius, x + radius, y - radius, y + radius));
};

/**
 * Set this rectangle to the intersection of this this rectangle and the given
 * rectangle, first rounding out both rectangles to integer coordinates.
 * @param {Rect} rect Another rectangle.
 */
Rect.prototype.intersectRectRoundedOut = function (rect) {
	if (rect.left === rect.right || rect.top === rect.bottom || !this.intersectsRectRoundedOut(rect)) {
		this.makeEmpty();
	} else {
		this.left = Math.max(Math.floor(this.left), Math.floor(rect.left));
		this.right = Math.min(Math.ceil(this.right), Math.ceil(rect.right));
		this.top = Math.max(Math.floor(this.top), Math.floor(rect.top));
		this.bottom = Math.min(Math.ceil(this.bottom), Math.ceil(rect.bottom));
	}
};

/**
 * Determine if this rectangle intersects with the bounding box of the given
 * circle, when they are both rounded out to integer coordinates.
 * @param {number} x The x coordinate of the center of the circle.
 * @param {number} y The y coordinate of the center of the circle.
 * @param {number} radius The radius of the circle.
 * @return {boolean} Does this rectangle intersect the bounding box of the
 * circle?
 */
Rect.prototype.mightIntersectCircleRoundedOut = function (x, y, radius) {
	return this.intersectsCoordsRoundedOut(x - radius, x + radius,
		y - radius, y + radius);
};

/**
 * Determine if this rectangle intersects with another rectangle, when both
 * rectangles have first been rounded out to integer coordinates.
 * @param {Rect} rect Another rectangle.
 * @return {boolean} Does this rectangle intersect the other rectangle?
 */
Rect.prototype.intersectsRectRoundedOut = function (rect) {
	return this.intersectsCoordsRoundedOut(rect.left, rect.right,
		rect.top, rect.bottom);
};

/**
 * Determine if this rectangle intersects with another rectangle defined by the
 * given coordinates, when both rectangles have first been rounded out to
 * integer coordinates.
 * @param {number} left Left edge of the rectangle.
 * @param {number} right Right edge of the rectangle.
 * @param {number} top Top edge of the rectangle.
 * @param {number} bottom Bottom edge of the rectangle.
 * @return {boolean} Does this rectangle intersect the other rectangle?
 */
Rect.prototype.intersectsCoordsRoundedOut = function (left, right, top, bottom) {
	return !(this.right <= Math.floor(left) || this.left >= Math.ceil(right) ||
	this.bottom <= Math.floor(top) || this.top >= Math.ceil(bottom));
};

/**
 * @param {Vec2} coords Coordinates to check.
 * @return {boolean} Does this rectangle contain the given coordinates?
 */
Rect.prototype.containsRoundedOut = function (coords) {
	return Math.floor(this.left) <= coords.x &&
		Math.ceil(this.right) >= coords.x &&
		Math.floor(this.top) <= coords.y &&
		Math.ceil(this.bottom) >= coords.y;
};
