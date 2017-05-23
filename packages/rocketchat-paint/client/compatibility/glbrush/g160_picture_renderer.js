'use strict';

/**
 * A relatively thin wrapper around a canvas and context used to render multiple Pictures.
 * Maintains state that isn't specific to a single Picture, such as the compositor and brush texture collection.
 * @constructor
 * @param {string=} mode Either 'webgl', 'no-dynamic-webgl' or 'canvas'. Defaults to 'webgl'.
 * @param {Array.<HTMLImageElement|HTMLCanvasElement>=} brushTextureData Set of brush textures to use. Can be undefined
 * if no textures are needed.
 */
var PictureRenderer = function (mode, brushTextureData) {
	if (mode === undefined) {
		mode = 'webgl';
	}
	this.mode = mode;
	this.brushTextureData = brushTextureData;

	this.canvas = document.createElement('canvas');

	this.sharedRasterizer = null;
	this.currentEventRasterizer = null;

	if (this.usesWebGl()) {
		if (!this.setupGLState()) {
			this.mode = undefined;
		}
	} else if (this.mode === 'canvas') {
		this.ctx = this.canvas.getContext('2d');
		this.compositor = new CanvasCompositor(this.ctx);
		this.brushTextures = new CanvasBrushTextures();
		this.initBrushTextures();
	} else {
		this.mode = undefined;
	}
};

/**
 * Create a renderer, choosing mode automatically.
 * @param {Array.<string>} modesToTry Modes to try to initialize the picture.
 * Can contain either 'webgl', 'no-dynamic-webgl', 'no-float-webgl' or 'canvas'.
 * Modes are tried in the order they are in the array.
 * @param {Array.<HTMLImageElement|HTMLCanvasElement>=} brushTextureData Set of brush textures to use. Can be undefined
 * if no textures are needed.
 * @return {PictureRenderer} A renderer or null if failed.
 */
PictureRenderer.create = function (modesToTry, brushTextureData) {
	var i = 0;
	var renderer = null;
	while (i < modesToTry.length && renderer === null) {
		var mode = modesToTry[i];
		if (glUtils.supportsTextureUnits(4) || mode === 'canvas') {
			renderer = new PictureRenderer(mode, brushTextureData);
			if (renderer.mode === undefined) {
				renderer = null;
			}
		}
		i++;
	}
	return renderer;
};

/**
 * True if WebGL context was initialized but a rendering test produced wrong results.
 */
PictureRenderer.hasFailedWebGLSanity = false;

/**
 * @return {boolean} Does the renderer use WebGL?
 */
PictureRenderer.prototype.usesWebGl = function () {
	return (this.mode === 'webgl' || this.mode === 'no-float-webgl' ||
	this.mode === 'no-dynamic-webgl');
};

/**
 * Call when the picture doing rendering operations with this renderer's context might have changed.
 * @param {Picture} picture Picture that's going to do rendering operations with this renderer's context.
 */
PictureRenderer.prototype.setPicture = function (picture) {
	if (this.usesWebGl()) {
		this.gl.viewport(0, 0, picture.bitmapWidth(), picture.bitmapHeight());
	}
};

/**
 * Show the picture on the canvas of this renderer.
 * @param {Picture} picture Picture about to be displayed on the canvas attached to this renderer.
 */
PictureRenderer.prototype.display = function (picture) {
	if (picture.currentEvent) {
		this.currentEventRasterizer.resetClip();
		picture.currentEvent.drawTo(this.currentEventRasterizer, picture.pictureTransform,
			picture.currentEventUntilCoord);
	}
	this.setPicture(picture);
	this.canvas.width = picture.bitmapWidth();
	this.canvas.height = picture.bitmapHeight();
	if (this.usesWebGl()) {
		this.gl.scissor(0, 0, this.canvas.width, this.canvas.height);
		this.glManager.useFbo(null);
	}
	var compositor = this.compositor;
	compositor.setTargetDimensions(this.canvas.width, this.canvas.height);
	for (var i = 0; i < picture.buffers.length; ++i) {
		if (picture.buffers[i].isComposited()) {
			compositor.pushBuffer(picture.buffers[i]);
			if (picture.currentEventAttachment === picture.buffers[i].id) {
				if (picture.currentEvent) {
					compositor.pushRasterizer(this.currentEventRasterizer,
						picture.currentEventColor,
						picture.currentEvent.opacity,
						picture.currentEventMode,
						picture.currentEvent.getBoundingBox(picture.bitmapRect,
							picture.pictureTransform));
				} else {
					// Even if there's no picture.currentEvent at the moment, push
					// so that the GLCompositor can avoid extra shader changes.
					compositor.pushRasterizer(this.currentEventRasterizer,
						[0, 0, 0], 0,
						picture.currentEventMode,
						null);
				}
			}
		}
	}
	compositor.flush();
};

/**
 * Create a single rasterizer using the mode specified for this renderer.
 * @param {number} width Width of the rasterizer to create in pixels.
 * @param {number} height Height of the rasterizer to create in pixels.
 * @return {BaseRasterizer} The rasterizer.
 */
PictureRenderer.prototype.createRasterizer = function (width, height) {
	if (this.glRasterizerCreator !== undefined) {
		return this.glRasterizerCreator(this.gl, this.glManager, width, height, this.brushTextures);
	} else {
		return new Rasterizer(width, height, this.brushTextures);
	}
};

/**
 * Set the minimum size of the shared rasterizer in pixels.
 * @param {number} width Width of the rasterizer that is required.
 * @param {number} height Height of the rasterizer that is required.
 */
PictureRenderer.prototype.setSharedRasterizerSize = function (width, height) {
	if (this.sharedRasterizer !== null) {
		if (this.sharedRasterizer.width < width || this.sharedRasterizer.height < height) {
			if (this.sharedRasterizer.width > width) {
				width = this.sharedRasterizer.width;
			}
			if (this.sharedRasterizer.height > height) {
				height = this.sharedRasterizer.height;
			}
			this.sharedRasterizer.free();
			this.sharedRasterizer = null;
		}
	}
	if (this.currentEventRasterizer !== null) {
		if (this.currentEventRasterizer.width < width || this.currentEventRasterizer.height < height) {
			if (this.currentEventRasterizer.width > width) {
				width = this.currentEventRasterizer.width;
			}
			if (this.currentEventRasterizer.height > height) {
				height = this.currentEventRasterizer.height;
			}
			this.currentEventRasterizer.free();
			this.currentEventRasterizer = null;
		}
	}
	if (this.sharedRasterizer === null) {
		this.sharedRasterizer = this.createRasterizer(width, height);
	}
	if (this.currentEventRasterizer === null) {
		this.currentEventRasterizer = this.createRasterizer(width, height);
	}
};

/**
 * @param {HTMLCanvasElement} canvas Canvas to use for rasterization.
 * @param {boolean=} debugGL True to log every WebGL call made on the context. Defaults to false.
 * @return {WebGLRenderingContext} Context to use or null if unsuccessful.
 */
PictureRenderer.initWebGL = function (canvas, debugGL) {
	if (debugGL === undefined) {
		debugGL = false;
	}
	var contextAttribs = {
		antialias: false,
		stencil: false,
		depth: false,
		premultipliedAlpha: false
	};
	var gl = glUtils.initGl(canvas, contextAttribs, 4);
	if (!gl) {
		return null;
	}
	if (debugGL) {
		var logGLCall = function (functionName, args) {
			console.log('gl.' + functionName + '(' + WebGLDebugUtils.glFunctionArgsToString(functionName, args) + ');');
		};
		gl = WebGLDebugUtils.makeDebugContext(gl, undefined, logGLCall);
	}
	gl.getExtension('OES_texture_float');

	gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
	gl.enable(gl.BLEND);
	gl.enable(gl.SCISSOR_TEST); // scissor rect is initially set to canvas size.
	gl.hint(gl.GENERATE_MIPMAP_HINT, gl.NICEST);
	return gl;
};

/**
 * Set up state in an existing gl context.
 * @return {boolean} Whether initialization succeeded.
 */
PictureRenderer.prototype.setupGLState = function () {
	var useFloatRasterizer = (this.mode === 'webgl' || this.mode === 'no-dynamic-webgl');
	if (useFloatRasterizer && !glUtils.floatFboSupported) {
		return false;
	}

	this.gl = PictureRenderer.initWebGL(this.canvas);
	if (!this.gl) {
		return false;
	}
	this.glManager = glStateManager(this.gl);
	this.glManager.useQuadVertexBuffer(); // All drawing is done using the same vertex array
	this.loseContext = this.gl.getExtension('WEBGL_lose_context');

	this.brushTextures = new GLBrushTextures(this.gl, this.glManager);
	this.initBrushTextures();

	if (useFloatRasterizer) {
		if (this.mode === 'webgl') {
			this.glRasterizerCreator = function (gl, glManager, width, height, brushTextures) {
				return new GLFloatRasterizer(gl, glManager, width, height, brushTextures, true);
			};
		} else {
			// TODO: assert(this.mode === 'no-dynamic-webgl');
			this.glRasterizerCreator = function (gl, glManager, width, height, brushTextures) {
				return new GLFloatRasterizer(gl, glManager, width, height, brushTextures, false);
			};
		}
	} else {
		this.glRasterizerCreator = function (gl, glManager, width, height, brushTextures) {
			return new GLDoubleBufferedRasterizer(gl, glManager, width, height, brushTextures);
		};
	}

	this.texBlitProgram = this.glManager.shaderProgram(blitShader.blitSrc,
		blitShader.blitVertSrc,
		{'uSrcTex': 'tex2d'});
	this.rectBlitProgram = this.glManager.shaderProgram(blitShader.blitSrc,
		blitShader.blitScaledTranslatedVertSrc,
		{'uSrcTex': 'tex2d', 'uScale': '2fv', 'uTranslate': '2fv'});

	this.compositor = new GLCompositor(this.glManager, this.gl, glUtils.maxTextureUnits);

	this.setSharedRasterizerSize(128, 128);
	if (!this.sharedRasterizer.checkSanity()) {
		PictureRenderer.hasFailedWebGLSanity = true;
		console.log('WebGL accelerated rasterizer did not pass sanity test ' +
			'(mode ' + this.mode + '). Update your graphics drivers ' +
			'or try switching browsers if possible.');
		this.sharedRasterizer.free();
		this.sharedRasterizer = null;
		return false;
	}
	return true;
};

/**
 * Clean up any allocated resources.
 * Call setSharedRasterizerSize() to make the renderer usable again after this.
 */
PictureRenderer.prototype.free = function () {
	this.currentEventRasterizer.free();
	this.sharedRasterizer.free();
	this.currentEventRasterizer = null;
	this.sharedRasterizer = null;
};

/**
 * Initialize brush textures to use in rasterizers from the given brush texture data.
 * @protected
 */
PictureRenderer.prototype.initBrushTextures = function () {
	if (!this.brushTextureData) {
		return;
	}
	for (var i = 0; i < this.brushTextureData.length; ++i) {
		this.brushTextures.addTexture(this.brushTextureData[i]);
	}
};
