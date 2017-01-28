/*
 * Copyright Olli Etuaho 2013.
 */

'use strict';

/**
 * Generate shaders for compositing a linear stack of layers.
 */
var compositingShader = {};

/**
 * @param {Array.<Object>} layers The array of layers to composit. May contain
 * objects specifying PictureBuffers and objects specifying BaseRasterizers
 * which are blended to the previous PictureBuffer.
 * @return {string} The fragment shader source for compositing the given layer
 * stack.
 */
compositingShader.getFragmentSource = function (layers) {
	var src = ['precision highp float;'];
	var i;
	for (i = 0; i < layers.length; ++i) {
		if (layers[i].type === CanvasCompositor.Element.buffer) {
			// TODO: assert(layers[i].buffer.visible);
			src.push('uniform sampler2D uLayer' + i + ';');
			src.push('uniform float uOpacity' + i + ';');
		} else {
			src.push('uniform sampler2D uLayer' + i + ';');
			src.push('uniform vec2 uLayer' + i + 'Scale;');
			src.push('uniform vec4 uColor' + i + ';');
		}
	}
	src.push('varying vec2 vTexCoord;');
	src.push('void main(void) {');
	src.push('  float tmpAlpha;');
	var colorInitialized = false; // Will be set to true once first buffer is blended to "color"
	var blendingSource = function (dstColor, srcColor) {
		src.push('  tmpAlpha = ' + srcColor + '.w + ' + dstColor + '.w * (1.0 - ' + srcColor + '.w);');
		src.push('  ' + dstColor + '.xyz = tmpAlpha > 0.0 ? (' + srcColor + '.xyz * ' + srcColor + '.w' +
			' + ' + dstColor + '.xyz * ' + dstColor + '.w * (1.0 - ' + srcColor + '.w)) / tmpAlpha : vec3(0.0);');
		src.push('  ' + dstColor + '.w = tmpAlpha;');
	};
	// Add rasterizer layer blending operation to src. The given blending
	// equation eq must use unpremultiplied vec3 srcColor, unpremultiplied vec3
	// dstColor and srcAlpha to produce an unpremultiplied vec3 color value.
	var blendEq = function (eq) {
		src.push('  float blendedAlpha' + i + ' = layer' + i + 'Color.w + ' +
			bufferColor + '.w * (1.0 - layer' + i + 'Color.w);');
		src.push('  if (blendedAlpha' + i + ' > 0.0) {');
		// Blending according to KHR_blend_equation_advanced
		eq = '(' + eq + ') * srcAlpha * dstAlpha';
		eq = eq + ' + srcColor * srcAlpha * (1.0 - dstAlpha)';
		eq = eq + ' + dstColor * dstAlpha * (1.0 - srcAlpha)';
		// The spec produces premultiplied color values, so unpremultiply:
		eq = '(' + eq + ') / blendedAlpha' + i;
		// Fill in unpremultiplied colors:
		eq = eq.replace(/srcColor/g, 'layer' + i + 'Color.xyz');
		eq = eq.replace(/srcAlpha/g, 'layer' + i + 'Color.w');
		eq = eq.replace(/dstColor/g, bufferColor + '.xyz');
		eq = eq.replace(/dstAlpha/g, bufferColor + '.w');
		// Store:
		src.push('  ' + bufferColor + ' = vec4(' + eq + ', blendedAlpha' + i + ');');
		src.push('  } else {');
		src.push('  ' + bufferColor + ' = vec4(0.0);');
		src.push('  }');
	};
	// Some blending operations require per component logic.
	// TODO: Some of these could probably be vectorized, using functions such as lessThan (see lighten for example)
	var blendEqPerComponent = function (eq) {
		src.push('  float blendedAlpha' + i + ' = layer' + i + 'Color.w + ' +
			bufferColor + '.w * (1.0 - layer' + i + 'Color.w);');
		src.push('  if (blendedAlpha' + i + ' > 0.0) {');
		src.push('  ' + bufferColor + ' = vec4(vec3(');
		// Blending according to KHR_blend_equation_advanced
		eq = '(' + eq + ') * dstAlpha * srcAlpha';
		eq = eq + ' + srcColor * srcAlpha * (1.0 - dstAlpha)';
		eq = eq + ' + dstColor * dstAlpha * (1.0 - srcAlpha)';
		// Fill in colors, once for each channel:
		var eqc;
		for (var channel = 0; channel < 3; channel++) {
			eqc = eq.replace(/srcColor/g, 'layer' + i + 'Color[' + channel + ']');
			eqc = eqc.replace(/srcAlpha/g, 'layer' + i + 'Color.w');
			eqc = eqc.replace(/dstColor/g, bufferColor + '[' + channel + ']');
			eqc = eqc.replace(/dstAlpha/g, bufferColor + '.w');
			src.push('   ' + eqc + (channel !== 2 ? ',' : ''));
		}
		// The blending spec produces premultiplied color values, so unpremultiply:
		src.push(') / blendedAlpha' + i + ', blendedAlpha' + i + ');');
		src.push('  } else {');
		src.push('  ' + bufferColor + ' = vec4(0.0);');
		src.push('  }');
	};
	i = 0;
	while (i < layers.length) {
		// TODO: assert(layers[i].type === CanvasCompositor.Element.buffer);
		// TODO: assert(layers[i].buffer.visible);
		var bufferColor = 'layer' + i + 'Color';
		var bufferOpacity = 'uOpacity' + i;
		src.push('  vec4 ' + bufferColor +
			' = texture2D(uLayer' + i + ', vTexCoord);');
		++i;
		while (i < layers.length &&
		layers[i].type === CanvasCompositor.Element.rasterizer) {
			var tcScale = 'uLayer' + i + 'Scale';
			var scaledCoord = 'vec2(vTexCoord.x * ' + tcScale + '.x, 1.0 - (1.0 - vTexCoord.y) * ' + tcScale + '.y)';
			if (layers[i].rasterizer.format === GLRasterizerFormat.alpha) {
				src.push('  float layer' + i + 'Alpha = texture2D(uLayer' + i + ', ' + scaledCoord + ').w;');
			} else {
				src.push('  vec4 layer' + i + ' = texture2D(uLayer' + i + ', ' + scaledCoord + ');');
				src.push('  float layer' + i + 'Alpha = layer' + i + '.x + layer' + i + '.y / 256.0;');
			}
			// Unpremultiplied color
			src.push('  vec4 layer' + i + 'Color = vec4(uColor' + i + '.xyz, ' +
				'layer' + i + 'Alpha * uColor' + i + '.w);');
			if (layers[i].mode === PictureEvent.Mode.normal) {
				blendingSource(bufferColor, 'layer' + i + 'Color');
			} else if (layers[i].mode === PictureEvent.Mode.erase) {
				src.push('  ' + bufferColor + '.w = ' + bufferColor + '.w * (1.0 - layer' + i + 'Color.w);');
			} else {
				if (layers[i].mode === PictureEvent.Mode.multiply) {
					blendEq('dstColor * srcColor');
				} else if (layers[i].mode === PictureEvent.Mode.screen) {
					blendEq('1.0 - (1.0 - dstColor) * (1.0 - srcColor)');
				} else if (layers[i].mode === PictureEvent.Mode.overlay) {
					blendEqPerComponent('dstColor <= 0.5 ? (2.0 * srcColor * dstColor) : ' +
						'(1.0 - 2.0 * (1.0 - dstColor) * (1.0 - srcColor))');
				} else if (layers[i].mode === PictureEvent.Mode.hardlight) {
					blendEqPerComponent('srcColor <= 0.5 ? (2.0 * srcColor * dstColor) : ' +
						'(1.0 - 2.0 * (1.0 - dstColor) * (1.0 - srcColor))');
				} else if (layers[i].mode === PictureEvent.Mode.softlight) {
					blendEqPerComponent('(srcColor <= .5 ? ' +
						'dstColor - (1. - 2. * srcColor) * dstColor * (1. - dstColor) :' +
						'srcColor > 0.5 && dstColor <= 0.25 ? ' +
						'dstColor + (2. * srcColor - 1.) * dstColor * ((16. * dstColor - 12.) * dstColor + 3.) :' +
						'dstColor + (2. * srcColor - 1.) * (sqrt(dstColor) - dstColor))');
				} else if (layers[i].mode === PictureEvent.Mode.darken) {
					blendEq('vec3(lessThan(dstColor, srcColor)) * (dstColor - srcColor) + srcColor');
				} else if (layers[i].mode === PictureEvent.Mode.lighten) {
					blendEq('vec3(greaterThan(dstColor, srcColor)) * (dstColor - srcColor) + srcColor');
				} else if (layers[i].mode === PictureEvent.Mode.difference) {
					blendEq('abs(srcColor - dstColor)');
				} else if (layers[i].mode === PictureEvent.Mode.exclusion) {
					blendEq('dstColor + srcColor - 2.0 * dstColor * srcColor');
				} else if (layers[i].mode === PictureEvent.Mode.colorburn) {
					blendEqPerComponent('dstColor >= 1. ? 1.0 : srcColor <= 0. ? 0.0 : ' +
						'clamp(1. - (1. - dstColor) / srcColor, 0., 1.)');
				} else if (layers[i].mode === PictureEvent.Mode.linearburn) {
					blendEq('clamp(dstColor + srcColor - vec3(1.0), vec3(0.0), vec3(1.0))');
				} else if (layers[i].mode === PictureEvent.Mode.vividlight) {
					blendEqPerComponent('srcColor >= 1. ? 1.0 : srcColor <= 0. ? 0.0 : ' +
						'clamp((srcColor <= .5 ? 1. - (1. - dstColor) / (2. * srcColor) :' +
						'dstColor / (2. * (1. - srcColor))), 0., 1.)');
				} else if (layers[i].mode === PictureEvent.Mode.linearlight) {
					blendEqPerComponent(
						'clamp(srcColor <= .5 ? (dstColor + 2. * srcColor - 1.) : ' +
						'(dstColor + 2. * (srcColor - 0.5)), 0., 1.)');
				} else if (layers[i].mode === PictureEvent.Mode.pinlight) {
					blendEqPerComponent('mix(dstColor, (srcColor <= .5 ? (min(dstColor, 2. * srcColor)) : ' +
						'max(dstColor, 2. * (srcColor - 0.5))), srcAlpha)');
				} else if (layers[i].mode === PictureEvent.Mode.colordodge) {
					blendEqPerComponent('dstColor <= 0. ? 0.0 : srcColor >= 1. ? 1.0 : ' +
						'clamp(dstColor / (1. - srcColor), 0., 1.)');
				} else if (layers[i].mode === PictureEvent.Mode.lineardodge) {
					blendEq('clamp(dstColor + srcColor, vec3(0.0), vec3(1.0))');
				} else {
					console.log('Unexpected mode in shader generation ' + layers[i].mode);
				}
			}
			++i;
		}
		src.push('  ' + bufferColor + '.w *= ' + bufferOpacity + ';');
		if (colorInitialized) {
			blendingSource('color', bufferColor);
		} else {
			src.push('  vec4 color = ' + bufferColor + ';');
			colorInitialized = true;
		}
	}
	if (colorInitialized) {
		src.push('  gl_FragColor = color;');
	} else {
		src.push('  gl_FragColor = vec4(0.0);');
	}
	src.push('}');
	return src.join('\n');
};


/**
 * @param {Object} glManager The state manager returned by glStateManager() in
 * utilgl.
 * @param {Array.<Object>} layers The array of layers to composit. May contain
 * objects specifying PictureBuffers and objects specifying BaseRasterizers
 * which are blended to the previous PictureBuffer.
 * @return {ShaderProgram} The shader program for compositing the given layer
 * stack. Contains uniforms uLayer<n> for visible layers where <n> is the layer
 * index starting from zero for setting samplers for the layers. 'uColor<n>'
 * vec4 uniforms are used for rasterizer layers to pass unpremultiplied color
 * and opacity data, with values ranging from 0 to 1.
 * 'uLayer<n>Scale' vec2 uniforms are used to pass scale to apply to texture
 * coordinates for rasterizer layers. This makes it possible to use rasterizers
 * that are larger than the picture.
 * 'uOpacity<n>' float uniforms are used for buffer layers to pass opacity, with
 * values ranging from 0 to 1.
 */
compositingShader.getShaderProgram = function (glManager, layers) {
	var fragSource = compositingShader.getFragmentSource(layers);
	var uniformTypes = {};
	for (var i = 0; i < layers.length; ++i) {
		if (layers[i].type === CanvasCompositor.Element.buffer) {
			// TODO: assert(layers[i].buffer.visible);
			uniformTypes['uLayer' + i] = 'tex2d';
			uniformTypes['uOpacity' + i] = '1f';
		} else {
			uniformTypes['uLayer' + i] = 'tex2d';
			uniformTypes['uLayer' + i + 'Scale'] = '2fv';
			uniformTypes['uColor' + i] = '4fv';
		}
	}
	return glManager.shaderProgram(fragSource, blitShader.blitVertSrc,
		uniformTypes);
};
