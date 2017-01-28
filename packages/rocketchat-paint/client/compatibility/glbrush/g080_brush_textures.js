'use strict';

/*
 * Copyright Olli Etuaho 2013.
 */

/**
 * A monochrome mipmap for software access.
 * @constructor
 * @param {HTMLCanvasElement|HTMLImageElement|ImageData} imageSource Image containing the level 0 texture in its red
 * channel. Both dimensions of the image must be equal and powers of two.
 */
var SWMipmap = function (imageSource) {
	var canvas = document.createElement('canvas');
	var ctx = canvas.getContext('2d');
	canvas.width = imageSource.width;
	canvas.height = imageSource.height;
	ctx.drawImage(imageSource, 0, 0);
	var sourceData = ctx.getImageData(0, 0, canvas.width, canvas.height);

	this.padding = 3; // Note that sampler functions assume this is larger than 0. Larger values give more leeway for
	// stepping out of the 0.0 to 1.0 texture coordinate range in sampleUnsafe().
	var padding = this.padding;
	this.levels = [];
	this.levelWidths = [];
	var width = canvas.width;
	var dataWidth = width + padding * 2;
	this.levels.push(new Float64Array(dataWidth * dataWidth));
	this.levelWidths.push(width);
	for (var x = 0; x < width; ++x) {
		for (var y = 0; y < width; ++y) {
			this.levels[0][x + padding + (y + padding) * dataWidth] = sourceData.data[(x + y * width) * 4] / 255;
		}
	}
	/**
	 * Copy data from the center of the image array to n edge rows, n is given by padding.
	 * @param {Float64Array} array Array to pad.
	 */
	var pad = function (array) {
		var i;
		var p;
		for (i = 0; i < width; ++i) {
			for (p = 0; p < padding; ++p) {
				array[i + padding + (padding - p - 1) * dataWidth] =
					array[i + padding + padding * dataWidth];
				array[i + padding + (dataWidth - padding + p) * dataWidth] =
					array[i + padding + (dataWidth - padding - 1) * dataWidth];
			}
		}
		for (i = 0; i < dataWidth; ++i) {
			for (p = 0; p < padding; ++p) {
				array[padding - p - 1 + i * dataWidth] = array[padding + i * dataWidth];
				array[dataWidth - padding + p + i * dataWidth] = array[dataWidth - padding - 1 + i * dataWidth];
			}
		}
	};
	pad(this.levels[0]);
	var level = 0;
	while (width > 1) {
		width = width >> 1;
		++level;
		var prevWidth = dataWidth;
		dataWidth = width + padding * 2;
		this.levels.push(new Float64Array(dataWidth * dataWidth));
		this.levelWidths.push(width);
		for (var x = 0; x < width; ++x) {
			for (var y = 0; y < width; ++y) {
				this.levels[level][x + padding + (y + padding) * dataWidth] =
					(this.levels[level - 1][x * 2 + padding + (y * 2 + padding) * prevWidth] +
					this.levels[level - 1][x * 2 + 1 + padding + (y * 2 + padding) * prevWidth] +
					this.levels[level - 1][x * 2 + padding + (y * 2 + 1 + padding) * prevWidth] +
					this.levels[level - 1][x * 2 + 1 + padding + (y * 2 + 1 + padding) * prevWidth]) * 0.25;
			}
		}
		pad(this.levels[this.levels.length - 1]);
	}
};

/**
 * @param {number} s Horizontal texture coordinate.
 * @param {number} lod The lod passed to sampleUnsafe.
 * @return {number} sInd to pass to sampleUnsafe at this horizontal coordinate.
 */
SWMipmap.prototype.getSInd = function (s, lod) {
	return s * this.levelWidths[lod] - 0.5 + this.padding;
};

/**
 * @param {number} drawWidth The width at which the texture is drawn at.
 * @param {number} lod The lod passed to sampleUnsafe.
 * @return {number} How much sInd needs to be incremented when draw-space s grows by 1 pixel.
 */
SWMipmap.prototype.getSIndStep = function (drawWidth, lod) {
	return (1 / drawWidth) * this.levelWidths[lod];
};

/**
 * @param {number} t Vertical texture coordinate.
 * @param {number} lod The lod passed to sampleUnsafe.
 * @return {number} rowInd to pass to sampleUnsafe at this vertical coordinate.
 */
SWMipmap.prototype.getRowInd = function (t, lod) {
	return Math.floor(t * this.levelWidths[lod] - 0.5 + this.padding) * (this.levelWidths[lod] + this.padding * 2);
};

/**
 * @param {number} t Vertical texture coordinate.
 * @param {number} lod The lod passed to sampleUnsafe.
 * @return {number} rowBelowWeight to pass to sampleUnsafe at this vertical coordinate.
 */
SWMipmap.prototype.getRowBelowWeight = function (t, lod) {
	var tInd = t * this.levelWidths[lod] - 0.5 + this.padding;
	return tInd - Math.floor(tInd);
};

/**
 * Perform linear interpolation from given indices on the mipmap level.
 * @param {number} sInd Index on the array row, calculated using values from getSInd and getSIndStep. Must correspond to
 * texture coordinate s between 0.0 - (padding - 0.5) / level's width and 1.0 + (padding - 0.5) / level's width.
 * @param {number} rowInd Index of the first element of the array row, calculated using getRowInd. Must be positive and
 * less than the index of the last row's first element.
 * @param {number} rowBelowWeight Weight of the row below rowInd in interpolation, calculated using getRowBelowHeight.
 * @param {number} lod Level of detail number. Level 0 corresponds to full sized texture, larger integers to smaller
 * mipmap levels. Must be an integer and a valid level.
 * @return {number} Sample value in the range 0 to 1.
 */
SWMipmap.prototype.sampleUnsafe = function (sInd, rowInd, rowBelowWeight, lod) {
	var floorSInd = Math.floor(sInd);
	var weight = sInd - floorSInd;
	return (this.levels[lod][floorSInd + rowInd] * (1.0 - weight) +
		this.levels[lod][floorSInd + 1 + rowInd] * weight) *
		(1.0 - rowBelowWeight) +
		(this.levels[lod][floorSInd + rowInd + this.levelWidths[lod] + this.padding * 2] * (1.0 - weight) +
		this.levels[lod][floorSInd + 1 + rowInd + this.levelWidths[lod] + this.padding * 2] * weight) *
		rowBelowWeight;
};

/**
 * Perform linear interpolation on the mipmap row. Will be clamped to edges.
 * @param {number} s Horizontal texture coordinate in the range 0 to 1.
 * @param {number} rowInd Index of the first item on the mipmap row.
 * @param {number} lod Level of detail number. Level 0 corresponds to full sized texture, larger integers to smaller
 * mipmap levels. Must be an integer and a valid level.
 * @return {number} Sample value in the range 0 to 1.
 * @protected
 */
SWMipmap.prototype.sampleFromRow = function (s, rowInd, lod) {
	if (s <= 0.0) {
		return this.levels[lod][rowInd];
	} else if (s >= 1.0) {
		return this.levels[lod][this.levelWidths[lod] + this.padding + rowInd];
	}
	var sInd = s * this.levelWidths[lod] - 0.5 + this.padding;
	var floorSInd = Math.floor(sInd);
	var weight = sInd - floorSInd;
	return this.levels[lod][floorSInd + rowInd] * (1.0 - weight) +
		this.levels[lod][floorSInd + 1 + rowInd] * weight;
};

/**
 * Perform bilinear interpolation on the mipmap level. Will be clamped to edges.
 * @param {number} s Horizontal texture coordinate in the range 0 to 1.
 * @param {number} t Vertical texture coordinate in the range 0 to 1.
 * @param {number} lod Level of detail number. Level 0 corresponds to full sized texture, larger integers to smaller
 * mipmap levels. Must be an integer and a valid level.
 * @return {number} Sample value in the range 0 to 1.
 */
SWMipmap.prototype.sampleFromLevel = function (s, t, lod) {
	// TODO: assert(lod >= 0 && lod < this.levels.length);
	var dataWidth = this.levelWidths[lod] + this.padding * 2;
	// TODO: assert(this.padding > 0);
	if (t <= 0.0) {
		return this.sampleFromRow(s, 0, lod);
	} else if (t >= 1.0) {
		return this.sampleFromRow(s, (this.levelWidths[lod] + this.padding) * dataWidth, lod);
	}
	var tInd = t * this.levelWidths[lod] - 0.5 + this.padding;
	var floorTInd = Math.floor(tInd);
	var tIndW = floorTInd * dataWidth;
	var weight = tInd - floorTInd;
	return this.sampleFromRow(s, tIndW, lod) * (1.0 - weight) +
		this.sampleFromRow(s, tIndW + dataWidth, lod) * weight;
};

/**
 * Perform trilinear interpolation on the mipmap. Will be clamped to edges.
 * @param {number} s Horizontal texture coordinate in the range 0 to 1.
 * @param {number} t Vertical texture coordinate in the range 0 to 1.
 * @param {number} lod Level of detail number. Level 0 corresponds to full sized texture, larger integers to smaller
 * mipmap levels.
 * @return {number} Sample value in the range 0 to 1.
 */
SWMipmap.prototype.sample = function (s, t, lod) {
	if (lod <= 0) {
		return this.sampleFromLevel(s, t, 0);
	} else if (lod >= this.levels.length - 1) {
		return this.sampleFromLevel(s, t, this.levels.length - 1);
	}
	var rounded = Math.round(lod);
	if (rounded === lod) {
		return this.sampleFromLevel(s, t, rounded);
	}
	var floorLevel = Math.floor(lod);
	var weight = lod - floorLevel;
	return this.sampleFromLevel(s, t, floorLevel) * (1.0 - weight) +
		this.sampleFromLevel(s, t, floorLevel + 1) * weight;
};

/**
 * A collection of brush tip textures to use in drawing.
 * @constructor
 */
var CanvasBrushTextures = function () {
	this.textures = [];
};

/**
 * @param {HTMLCanvasElement|HTMLImageElement|ImageData} imageSource Image containing the brush tip sample in its red
 * channel. Both dimensions of the image must be equal and powers of two.
 */
CanvasBrushTextures.prototype.addTexture = function (imageSource) {
	this.textures.push(new SWMipmap(imageSource));
};

/**
 * @param {number} textureIndex Index of the texture, corresponding to the order in which the textures were added.
 * @return {SWMipmap} The texture.
 */
CanvasBrushTextures.prototype.getTexture = function (textureIndex) {
	return this.textures[textureIndex];
};

/**
 * A collection of brush tip textures to use in drawing.
 * @constructor
 * @param {WebGLRenderingContext} gl The rendering context.
 * @param {Object} glManager The state manager returned by glStateManager() in utilgl.
 */
var GLBrushTextures = function (gl, glManager) {
	this.gl = gl;
	this.glManager = glManager;
	this.textures = [];
};

/**
 * @param {HTMLCanvasElement|HTMLImageElement|ImageData} imageSource Image containing the brush tip sample in its red
 * channel. Both dimensions of the image must be equal and powers of two.
 */
GLBrushTextures.prototype.addTexture = function (imageSource) {
	var tex = this.gl.createTexture();
	this.gl.bindTexture(this.gl.TEXTURE_2D, tex);
	this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, imageSource);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MAG_FILTER, this.gl.LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR_MIPMAP_LINEAR);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
	this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
	this.gl.generateMipmap(this.gl.TEXTURE_2D);
	this.textures.push(tex);
};

/**
 * @param {number} textureIndex Index of the texture, corresponding to the order in which the textures were added.
 * @return {WebGLTexture} The texture.
 */
GLBrushTextures.prototype.getTexture = function (textureIndex) {
	return this.textures[textureIndex];
};
