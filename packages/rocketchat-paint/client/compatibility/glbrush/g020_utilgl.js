/*
 * Copyright Olli Etuaho 2012-2013.
 */

'use strict';

var glUtils = {
	createTexture: null,
	getShader: null,
	initGl: null,
	supportsTextureUnits: null,
	updateClip: null,
	glSupported: true, // these values will be updated later
	availableExtensions: [],
	floatFboSupported: true,
	maxVaryingVectors: 8, // minimum mandated by the spec
	maxUniformVectors: 16, // minimum mandated by the spec for the fragment shader
	maxTextureUnits: 32,
	maxFramebufferSize: 2048,
	textureUnits: null
};

/**
 * Create a texture and initialize it to use gl.NEAREST filtering and
 * gl.CLAMP_TO_EDGE clamping.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {number} width Width of the texture. Must be an integer.
 * @param {number} height Height of the texture. Must be an integer.
 * @param {GLenum=} format Texture format. Defaults to gl.RGBA.
 * @param {GLenum=} type Texture type. Defaults to gl.UNSIGNED_BYTE.
 * @return {WebGLTexture} The created texture.
 */
glUtils.createTexture = function (gl, width, height, format, type) {
	if (format === undefined) {
		format = gl.RGBA;
	}
	if (type === undefined) {
		type = gl.UNSIGNED_BYTE;
	}
	var tex = gl.createTexture();
	gl.bindTexture(gl.TEXTURE_2D, tex);
	gl.texImage2D(gl.TEXTURE_2D, 0, format, width, height, 0, format, type,
		null);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
	gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
	gl.bindTexture(gl.TEXTURE_2D, null);
	return tex;
};

/**
 * Get shader source from a DOM element.
 * @param {string} id DOM id of the element that contains the shader source.
 * @return {string} The shader source.
 */
glUtils.getShaderSource = function (id) {
	var shaderScript = document.getElementById(id);
	if (!shaderScript) {
		console.log('Shader script not found ' + id);
		return null;
	}
	var shaderSource = '';
	var currentChild = shaderScript.firstChild;
	while (currentChild) {
		if (currentChild.nodeType == currentChild.TEXT_NODE) {
			shaderSource += currentChild.textContent;
		}
		currentChild = currentChild.nextSibling;
	}
	return shaderSource;
};

/**
 * Compile a shader from source.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {GLenum} type Type of the shader. Must be gl.FRAGMENT_SHADER or
 * gl.VERTEX_SHADER.
 * @param {string} shaderSource The shader source.
 * @return {WebGLShader} The created shader.
 */
glUtils.compileShaderSource = function (gl, type, shaderSource) {
	var shader = gl.createShader(type);

	gl.shaderSource(shader, shaderSource);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		console.log('An error occurred compiling a shader:' +
			gl.getShaderInfoLog(shader));
		console.log(shaderSource);
		return null;
	}

	return shader;
};

/**
 * Create a WebGL context on a canvas element.
 * @param {HTMLCanvasElement} canvas The canvas element.
 * @param {Object} contextAttribs The context attributes to pass to the created
 * context.
 * @param {number=} minTextureUnits The required amount of texture units. Must
 * be an integer. Defaults to 0.
 * @return {WebGLRenderingContext} The created context or null if unable to
 * create one filling the requirements.
 */
glUtils.initGl = function (canvas, contextAttribs, minTextureUnits) {
	if (minTextureUnits === undefined) {
		minTextureUnits = 0;
	}
	if (!glUtils.supportsTextureUnits(minTextureUnits)) {
		return null;
	}
	var gl = null;
	try {
		// Try to grab the standard context, or fallback to experimental.
		gl = canvas.getContext('webgl', contextAttribs) ||
			canvas.getContext('experimental-webgl', contextAttribs);
	} catch (e) {
		gl = null;
	}
	gl.enableVertexAttribArray(0);
	return gl;
};

/**
 * @param {number} unitCount The amount of texture units required. Must be an
 * integer.
 * @return {boolean} Is it possible to create a WebGL context with the given
 * amount of texture units.
 */
glUtils.supportsTextureUnits = function (unitCount) {
	return glUtils.glSupported === true && glUtils.maxTextureUnits >= unitCount;
};

/**
 * Update the scissor rectangle to a rectangle in the canvas2d coordinate
 * system.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {Rect} rect The rectangle to use as scissor. In canvas2d coordinate
 * system, as in y 0 is the top of the canvas.
 * @param {number} fbHeight The framebuffer height.
 */
glUtils.updateClip = function (gl, rect, fbHeight) {
	var br = rect.getXYWHRoundedOut();
	br.y = fbHeight - (br.y + br.h);
	gl.scissor(br.x, br.y, br.w, br.h);
};


/**
 * Uniform type and location information.
 * @constructor
 * @param {string} gltype Postfix to gl.uniform function name or 'tex2d' in case
 * of a texture.
 * @param {WebGLUniformLocation} location Location of the uniform.
 * @protected
 */
var Uniform = function (gltype, location) {
	this.gltype = gltype;
	this.location = location;
};


/**
 * An object representing a shader program, tied to the specific gl context. The
 * vertex shader must have an 'aVertexPosition' attribute.
 * @constructor
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @param {string} fragmentShaderSource GLSL source code for the fragment
 * shader.
 * @param {string} vertexShaderSource GLSL source code for the vertex shader.
 * @param {Object.<string, string>} uniforms Map from uniform names to uniform
 * types. Uniform type is specified as postfix to gl.uniform function name or
 * 'tex2d' in case of a texture.
 */
var ShaderProgram = function (gl, fragmentShaderSource, vertexShaderSource,
															uniforms) {
	this.gl = gl;
	this.uniforms = {};

	var vertexShader = glUtils.compileShaderSource(this.gl,
		this.gl.VERTEX_SHADER,
		vertexShaderSource);
	var fragmentShader = glUtils.compileShaderSource(this.gl,
		this.gl.FRAGMENT_SHADER,
		fragmentShaderSource);

	this.shaderProgram = this.gl.createProgram();
	this.gl.attachShader(this.shaderProgram, vertexShader);
	this.gl.attachShader(this.shaderProgram, fragmentShader);
	this.gl.bindAttribLocation(this.shaderProgram, 0, 'aVertexPosition');
	this.gl.linkProgram(this.shaderProgram);

	if (!this.gl.getProgramParameter(this.shaderProgram, this.gl.LINK_STATUS)) {
		console.log('Unable to initialize shader program from shaders:\nINFO:' +
			'\n' + this.gl.getProgramInfoLog(this.shaderProgram) +
			'\nVERTEX:\n' + vertexShaderSource +
			'\nFRAGMENT:\n' + fragmentShaderSource);
	}
	for (var key in uniforms) {
		if (uniforms.hasOwnProperty(key)) {
			var gltype = uniforms[key];
			var location = this.gl.getUniformLocation(this.shaderProgram, key);
			if (location === null) {
				console.log('Could not locate uniform ' + key +
					' in compiled shader');
				console.log(fragmentShaderSource + '\n\n' + vertexShaderSource);
			}
			this.uniforms[key] = new Uniform(gltype, location);
		}
	}

	var vertexPositionAttribLoc = this.gl.getAttribLocation(this.shaderProgram, 'aVertexPosition');
	if (vertexPositionAttribLoc !== 0) {
		console.log('Vertex position attribute location unexpected, ' + vertexPositionAttribLoc);
	}
};

/**
 * @return {Object.<string,*>} Map from uniform names to uniform values that
 * should be filled in and passed to the shader program to draw.
 */
ShaderProgram.prototype.uniformParameters = function () {
	var uniformParams = {};
	for (var key in this.uniforms) {
		if (this.uniforms.hasOwnProperty(key)) {
			uniformParams[key] = null;
		}
	}
	return uniformParams;
};

/**
 * Set the ShaderProgram as active and set uniform values to use with it.
 * @param {Object.<string,*>} uniforms Map from uniform names to uniform values.
 * Single uniforms must not be passed in an array, vector uniforms must be
 * passed in an array. Texture uniforms must be passed as WebGLTexture.
 */
ShaderProgram.prototype.use = function (uniforms) {
	this.gl.useProgram(this.shaderProgram);
	var texU = 0;
	for (var key in uniforms) {
		if (this.uniforms.hasOwnProperty(key)) {
			var gltype = this.uniforms[key].gltype;
			var location = this.uniforms[key].location;
			if (gltype === 'tex2d') {
				if (texU < glUtils.maxTextureUnits) {
					this.gl.activeTexture(glUtils.textureUnits[texU]);
				} else {
					console.log('Too many textures in ShaderProgram.use');
					return;
				}
				this.gl.bindTexture(this.gl.TEXTURE_2D, uniforms[key]);
				this.gl.uniform1i(location, texU);
				++texU;
			} else if (gltype === '1i') {
				this.gl.uniform1i(location, uniforms[key]);
			} else if (gltype === '2iv') {
				this.gl.uniform2iv(location, uniforms[key]);
			} else if (gltype === '3iv') {
				this.gl.uniform3iv(location, uniforms[key]);
			} else if (gltype === '4iv') {
				this.gl.uniform4iv(location, uniforms[key]);
			} else if (gltype === '1f') {
				this.gl.uniform1f(location, uniforms[key]);
			} else if (gltype === '2fv') {
				this.gl.uniform2fv(location, uniforms[key]);
			} else if (gltype === '3fv') {
				this.gl.uniform3fv(location, uniforms[key]);
			} else if (gltype === '4fv') {
				this.gl.uniform4fv(location, uniforms[key]);
			} else if (gltype === 'Matrix2fv') {
				this.gl.uniformMatrix2fv(location, false, uniforms[key]);
			} else if (gltype === 'Matrix3fv') {
				this.gl.uniformMatrix3fv(location, false, uniforms[key]);
			} else if (gltype === 'Matrix4fv') {
				this.gl.uniformMatrix4fv(location, false, uniforms[key]);
			} else {
				console.log('Unrecognized uniform type in ShaderProgram.use: ' +
					gltype);
			}
		} else if (uniforms.hasOwnProperty(key)) {
			console.log('Invalid uniform name in ShaderProgram.use: ' + key +
				' ' + uniforms[key]);
		}
	}
	return;
};

/**
 * A shader program cache for a specific WebGL context.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @return {function(string, string, Object.<string, string>)} ShaderProgram
 * constructor wrapped in a caching closure.
 */
var shaderProgramCache = function (gl) {
	var shaders = [];

	return function (fragmentSource, vertexSource, uniforms) {
		// No need to use object for storing this few variables
		for (var i = 0; i < shaders.length; ++i) {
			if (shaders[i].fragmentSource === fragmentSource &&
				shaders[i].vertexSource === vertexSource) {
				return shaders[i];
			}
		}
		var shader = new ShaderProgram(gl, fragmentSource, vertexSource,
			uniforms);
		shader.fragmentSource = fragmentSource;
		shader.vertexSource = vertexSource;
		shaders.push(shader);
		return shader;
	};
};

/**
 * Create a manager for WebGL context state, such as switching the framebuffer.
 * @param {WebGLRenderingContext} gl The WebGL context.
 * @return {Object} The manager object.
 */
var glStateManager = function (gl) {
	var sharedFbo = gl.createFramebuffer();
	var fboInUse = null;
	var sharedFboTex = null;

	var unitQuadVertexBuffer = gl.createBuffer();
	gl.bindBuffer(gl.ARRAY_BUFFER, unitQuadVertexBuffer);
	var vertices = [
		1.0, 1.0,
		-1.0, 1.0,
		1.0, -1.0,
		-1.0, -1.0
	];
	gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

	var useQuadVertexBufferInternal = function () {
		gl.bindBuffer(gl.ARRAY_BUFFER, unitQuadVertexBuffer);
		var positionAttribLocation = 0;
		gl.vertexAttribPointer(positionAttribLocation, 2, gl.FLOAT, false, 0, 0);
	};

	var drawFullscreenQuadInternal = function (program, uniforms) {
		program.use(uniforms);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};

	var drawRectInternal = function (program, uniforms, rect) {
		if (rect !== undefined) {
			uniforms['uScale'] = [rect.width() / gl.drawingBufferWidth, rect.height() / gl.drawingBufferHeight];
			// Without any translation, the scaled rect would be centered in the gl viewport.
			// uTranslate = rect center point in gl coordinates.
			var rectCenter = new Vec2(rect.left + rect.width() * 0.5, rect.top + rect.height() * 0.5);
			rectCenter.x = (rectCenter.x / gl.drawingBufferWidth) * 2 - 1;
			rectCenter.y = (1 - rectCenter.y / gl.drawingBufferHeight) * 2 - 1;
			uniforms['uTranslate'] = [rectCenter.x, rectCenter.y];
		}
		program.use(uniforms);
		gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
	};

	var useFboInternal = function (fbo) {
		if (fboInUse !== fbo) {
			gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
			fboInUse = fbo;
		}
	};
	var useFboTexInternal = function (tex) {
		useFboInternal(sharedFbo);
		if (sharedFboTex !== tex) {
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
			sharedFboTex = tex;
		}
	};

	return {
		shaderProgram: shaderProgramCache(gl),
		useQuadVertexBuffer: useQuadVertexBufferInternal,
		drawFullscreenQuad: drawFullscreenQuadInternal,
		drawRect: drawRectInternal,
		useFbo: useFboInternal,
		useFboTex: useFboTexInternal
	};
};

// Perform a feature test.
(function () {
	var testCanvas = document.createElement('canvas');
	var gl = glUtils.initGl(testCanvas, {});
	if (!gl) {
		glUtils.glSupported = false;
		return;
	}
	glUtils.availableExtensions = gl.getSupportedExtensions();
	console.log(glUtils.availableExtensions);

	var extensionTextureFloat = gl.getExtension('OES_texture_float');
	if (!extensionTextureFloat) {
		glUtils.floatFboSupported = false;
	} else {
		// It's possible that float textures are supported but float FBOs are not.
		var testFbo = gl.createFramebuffer();
		var testTex = glUtils.createTexture(gl, 128, 128, gl.RGBA, gl.FLOAT);
		gl.bindFramebuffer(gl.FRAMEBUFFER, testFbo);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, testTex, 0);
		if (gl.checkFramebufferStatus(gl.FRAMEBUFFER) !== gl.FRAMEBUFFER_COMPLETE) {
			glUtils.floatFboSupported = false;
		}
	}

	glUtils.maxUniformVectors = Math.min(gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_VECTORS),
		gl.getParameter(gl.MAX_VERTEX_UNIFORM_VECTORS));
	console.log(glUtils.maxUniformVectors);
	glUtils.maxTextureUnits = gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS);
	// Do a best effort at determining framebuffer size limits:
	var maxFramebufferSizes = gl.getParameter(gl.MAX_VIEWPORT_DIMS);
	glUtils.maxFramebufferSize = Math.min(maxFramebufferSizes[0],
		maxFramebufferSizes[1]);
	glUtils.maxFramebufferSize =
		Math.min(gl.getParameter(gl.MAX_TEXTURE_SIZE),
			glUtils.maxFramebufferSize);
	// Memory limits are an issue, so additionally limit to 2048 at least for
	// now...
	glUtils.maxFramebufferSize = Math.min(2048, glUtils.maxFramebufferSize);
	glUtils.textureUnits = [gl.TEXTURE0, gl.TEXTURE1, gl.TEXTURE2, gl.TEXTURE3,
		gl.TEXTURE4, gl.TEXTURE5, gl.TEXTURE6, gl.TEXTURE7,
		gl.TEXTURE8, gl.TEXTURE9, gl.TEXTURE10,
		gl.TEXTURE11, gl.TEXTURE12, gl.TEXTURE13,
		gl.TEXTURE14, gl.TEXTURE15, gl.TEXTURE16,
		gl.TEXTURE17, gl.TEXTURE18, gl.TEXTURE19,
		gl.TEXTURE20, gl.TEXTURE21, gl.TEXTURE22,
		gl.TEXTURE23, gl.TEXTURE24, gl.TEXTURE25,
		gl.TEXTURE26, gl.TEXTURE27, gl.TEXTURE28,
		gl.TEXTURE29, gl.TEXTURE30, gl.TEXTURE31];
})();
