/*
 * Copyright Olli Etuaho 2013.
 */

'use strict';

/**
 * Storage for bitmap data from a past PictureBuffer state.
 * @constructor
 * @param {number} index The index of the next event in the events array. The
 * last event that takes part in this undo state is events[index - 1].
 * @param {number} cost Regeneration cost of the undo state.
 * @param {number} width Width of the undo state in pixels.
 * @param {number} height Height of the undo state in pixels.
 * @param {HTMLCanvasElement} srcCanvas Canvas containing the bitmap state
 * corresponding to the given index. May be null to create an invalid state.
 */
var CanvasUndoState = function (index, cost, width, height, srcCanvas) {
	this.width = width;
	this.height = height;
	this.canvas = null;
	this.ctx = null;
	this.invalid = true;
	this.update(srcCanvas, new Rect(0, this.width, 0, this.height));
	this.index = index;
	this.cost = cost;
};

/**
 * Set the bitmap dimensions of the undo state. Can only be done when the undo state is freed.
 * @param {number} width The new width.
 * @param {number} height The new height.
 */
CanvasUndoState.prototype.setDimensions = function (width, height) {
	// TODO: assert(this.canvas === null);
	this.width = width;
	this.height = height;
};

/**
 * Ensure that the undo state has a canvas to use.
 * @protected
 */
CanvasUndoState.prototype.ensureCanvas = function () {
	if (this.canvas === null) {
		this.canvas = document.createElement('canvas');
		this.canvas.width = this.width;
		this.canvas.height = this.height;
		this.ctx = this.canvas.getContext('2d');
	}
};

/**
 * Update this undo state in place.
 * @param {HTMLCanvasElement} srcCanvas Canvas containing the bitmap state
 * corresponding to the given index.
 * @param {Rect} clipRect Area to update.
 */
CanvasUndoState.prototype.update = function (srcCanvas, clipRect) {
	if (srcCanvas === null) {
		return;
	}
	this.ensureCanvas();
	var br = clipRect.getXYWHRoundedOut();
	this.ctx.clearRect(br.x, br.y, br.w, br.h);
	this.ctx.drawImage(srcCanvas, br.x, br.y, br.w, br.h,
		br.x, br.y, br.w, br.h);
	this.invalid = false;
};

/**
 * Copy an area from this undo state to the given context.
 * @param {CanvasRenderingContext2D} ctx Rendering context to draw with.
 * @param {Rect} clipRect Clipping rectangle for the copy operation. Will be
 * rounded outwards.
 */
CanvasUndoState.prototype.draw = function (ctx, clipRect) {
	// TODO: assert(!this.invalid);
	var r = clipRect.getXYWHRoundedOut();
	ctx.clearRect(r.x, r.y, r.w, r.h);
	ctx.drawImage(this.canvas, r.x, r.y, r.w, r.h, r.x, r.y, r.w, r.h);
};

/**
 * Clean up any allocated resources. The undo state will become invalid, but can
 * be restored by calling update().
 */
CanvasUndoState.prototype.free = function () {
	this.ctx = null;
	this.canvas = null;
	this.invalid = true;
};


/**
 * Storage for bitmap data from a past GLBuffer state.
 * @constructor
 * @param {number} index The index of the next event in the events array. The
 * last event that takes part in this undo state is events[index - 1].
 * @param {number} cost Regeneration cost of the undo state.
 * @param {WebGLTexture} srcTex A texture containing the bitmap state
 * corresponding to the given index. May be null to create an invalid state.
 * @param {WebGLRenderingContext} gl The rendering context.
 * @param {Object} glManager The state manager returned by glStateManager() in
 * utilgl.
 * @param {ShaderProgram} texBlitProgram Shader program to use for blits. Must
 * have uniform sampler uSrcTex for the source texture.
 * @param {number} width Width of the texture to copy.
 * @param {number} height Height of the texture to copy.
 * @param {boolean} hasAlpha Must alpha channel data be copied?
 */
var GLUndoState = function (index, cost, srcTex, gl, glManager, texBlitProgram,
														width, height, hasAlpha) {
	this.gl = gl;
	this.glManager = glManager;
	this.texBlitProgram = texBlitProgram;
	this.texBlitUniforms = texBlitProgram.uniformParameters();
	this.width = width;
	this.height = height;
	this.hasAlpha = hasAlpha;
	this.tex = null;
	this.invalid = true;
	this.update(srcTex, new Rect(0, this.width, 0, this.height));
	this.index = index;
	this.cost = cost;
};

/**
 * Set the bitmap dimensions of the undo state. Can only be done when the undo state is freed.
 * @param {number} width The new width.
 * @param {number} height The new height.
 */
GLUndoState.prototype.setDimensions = function (width, height) {
	// TODO: assert(this.tex === null);
	this.width = width;
	this.height = height;
};

/**
 * Ensure that the undo state has a texture to use.
 * @protected
 */
GLUndoState.prototype.ensureTexture = function () {
	if (this.tex === null) {
		var format = this.hasAlpha ? this.gl.RGBA : this.gl.RGB;
		this.tex = glUtils.createTexture(this.gl, this.width, this.height,
			format);
	}
};

/**
 * Update this undo state in place.
 * @param {WebGLTexture} srcTex A texture containing the bitmap state
 * corresponding to the given index.
 * @param {Rect} clipRect Area to update.
 */
GLUndoState.prototype.update = function (srcTex, clipRect) {
	if (srcTex === null) {
		return;
	}
	this.ensureTexture();
	this.gl.viewport(0, 0, this.width, this.height);
	this.glManager.useFboTex(this.tex);
	glUtils.updateClip(this.gl, clipRect, this.height);
	this.texBlitUniforms['uSrcTex'] = srcTex;
	this.gl.clearColor(0, 0, 0, 0);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	this.glManager.drawFullscreenQuad(this.texBlitProgram,
		this.texBlitUniforms);
	this.invalid = false;
};

/**
 * Copy an area from this undo state to the context it was created in.
 * @param {Rect} clipRect Clipping rectangle for the copy operation. Will be
 * rounded outwards.
 */
GLUndoState.prototype.draw = function (clipRect) {
	// TODO: assert(!this.invalid);
	this.gl.viewport(0, 0, this.width, this.height);
	this.texBlitUniforms['uSrcTex'] = this.tex;
	glUtils.updateClip(this.gl, clipRect, this.height);
	this.gl.clearColor(0, 0, 0, 0);
	this.gl.clear(this.gl.COLOR_BUFFER_BIT);
	this.glManager.drawFullscreenQuad(this.texBlitProgram,
		this.texBlitUniforms);
};

/**
 * Clean up any allocated resources. The undo state will become invalid, but can
 * be restored by calling update().
 */
GLUndoState.prototype.free = function () {
	if (this.tex !== null) {
		this.gl.deleteTexture(this.tex);
		this.tex = null;
		this.invalid = true;
	}
};
