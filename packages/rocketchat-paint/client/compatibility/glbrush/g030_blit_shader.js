/*
 * Copyright Olli Etuaho 2012-2013.
 */
'use strict';

var blitShader = {};

/**
 * Fragment shader source for converting a float monochrome raster to color.
 */
blitShader.convertSimpleSrc = '  precision highp float;\n' +
	'  uniform sampler2D uSrcTex;\n' +
	'  varying vec2 vTexCoord;\n' +
	'  uniform vec4 uColor;\n' +
	'  void main(void) {\n' +
	'    vec4 src = texture2D(uSrcTex, vTexCoord);\n' +
	'    float a = src.w * uColor.w;\n' +
	'    gl_FragColor = vec4(uColor.xyz * a, a); // premultiply\n' +
	'  }';

/**
 * Fragment shader source for converting a monochrome raster stored in red and
 * green channels to color.
 */
blitShader.convertRedGreenSrc = '  precision highp float;\n' +
	'  uniform sampler2D uSrcTex;\n' +
	'  varying vec2 vTexCoord;\n' +
	'  uniform vec4 uColor;\n' +
	'  void main(void) {\n' +
	'    vec4 src = texture2D(uSrcTex, vTexCoord);\n' +
	'    float a = (src.x + src.y / 256.0) * uColor.w;\n' +
	'    gl_FragColor = vec4(uColor.xyz * a, a); // premultiply\n' +
	'  }';

/**
 * Fragment shader source for a straight-up blit.
 */
blitShader.blitSrc = '  precision highp float;\n' +
	'  uniform sampler2D uSrcTex;\n' +
	'  varying vec2 vTexCoord;\n' +
	'  void main(void) {\n' +
	'    gl_FragColor = texture2D(uSrcTex, vTexCoord);\n' +
	'  }';

/**
 * Vertex shader source for blitting/conversion/compositing.
 */
blitShader.blitVertSrc = '  precision highp float;\n' +
	'  attribute vec2 aVertexPosition;\n' +
	'  varying vec2 vTexCoord;\n' +
	'  void main(void) {\n' +
	'    vTexCoord = vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.y + 1.0) * 0.5);\n' +
	'    gl_Position = vec4(aVertexPosition, 0.0, 1.0);\n' +
	'  }';

/**
 * Vertex shader source for drawing scaled/translated image.
 */
blitShader.blitScaledTranslatedVertSrc = '  precision highp float;\n' +
	'  attribute vec2 aVertexPosition;\n' +
	'  uniform vec2 uScale;\n' +
	'  uniform vec2 uTranslate;\n' +
	'  varying vec2 vTexCoord;\n' +
	'  void main(void) {\n' +
	'    vTexCoord = vec2((aVertexPosition.x + 1.0) * 0.5, (aVertexPosition.y + 1.0) * 0.5);\n' +
	'    vec2 vertexPosition = aVertexPosition * uScale + uTranslate;\n' +
	'    gl_Position = vec4(vertexPosition, 0.0, 1.0);\n' +
	'  }';

/**
 * Uniform parameters for the conversion shaders.
 * @constructor
 */
blitShader.ConversionUniformParameters = function () {
	this['uSrcTex'] = null;
	this['uColor'] = new Float32Array([0.0, 0.0, 0.0, 0.0]);
};
