/**
 * WebGL2 compositor for background blur.
 *
 * The mask is refined against the camera image before it is used, and the background is blurred as premultiplied
 * colour plus a separate coverage weight. Dividing the blurred colour by that weight in the final pass prevents the
 * subject's colours from bleeding into the background — the halo produced by blurring the complete camera frame.
 */

const VERTEX_SHADER = `#version 300 es
layout(location = 0) in vec2 a_position;
out vec2 v_uv;

void main() {
	v_uv = a_position * 0.5 + 0.5;
	gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const MATTE_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outputColor;

uniform sampler2D u_video;
uniform sampler2D u_mask;
uniform vec2 u_maskTexel;

float maskValue(vec2 uv) {
	// DOM image sources and typed arrays have opposite row origins in WebGL. Flip in the shader so a new CPU-side
	// copy of the complete mask is not needed every time MediaPipe produces one.
	return texture(u_mask, vec2(uv.x, 1.0 - uv.y)).r;
}

void main() {
	vec3 centre = texture(u_video, v_uv).rgb;
	float alpha = 0.0;
	float totalWeight = 0.0;

	// Joint bilateral upsampling: nearby mask samples count only when the corresponding camera pixels have a similar
	// colour. The low-resolution semantic answer therefore snaps to the full-resolution edge of hair and shoulders.
	for (int y = -1; y <= 1; y++) {
		for (int x = -1; x <= 1; x++) {
			vec2 offset = vec2(float(x), float(y));
			vec2 sampleUv = clamp(v_uv + offset * u_maskTexel, vec2(0.0), vec2(1.0));
			vec3 guide = texture(u_video, sampleUv).rgb;
			vec3 difference = guide - centre;
			float spatialWeight = (x == 0 ? 2.0 : 1.0) * (y == 0 ? 2.0 : 1.0);
			float rangeWeight = exp(-dot(difference, difference) * 24.0);
			float weight = spatialWeight * rangeWeight;

			alpha += maskValue(sampleUv) * weight;
			totalWeight += weight;
		}
	}

	float refinedAlpha = alpha / max(totalWeight, 0.0001);
	outputColor = vec4(refinedAlpha, refinedAlpha, refinedAlpha, 1.0);
}
`;

const DOWNSAMPLE_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outputColor;

uniform sampler2D u_video;
uniform sampler2D u_matte;
uniform vec2 u_footprint;

void main() {
	vec4 weightedBackground = vec4(0.0);

	// Four bilinear samples cover the source footprint of this reduced-resolution pixel. This is the small portion of
	// the mip pyramid the blur actually needs, without rebuilding every full-frame mip level for every camera frame.
	for (int y = 0; y < 2; y++) {
		for (int x = 0; x < 2; x++) {
			vec2 quarter = (vec2(float(x), float(y)) - 0.5) * 0.5;
			vec2 sampleUv = clamp(v_uv + quarter * u_footprint, vec2(0.0), vec2(1.0));
			float background = 1.0 - texture(u_matte, sampleUv).r;
			weightedBackground += vec4(texture(u_video, sampleUv).rgb * background, background);
		}
	}

	outputColor = weightedBackground * 0.25;
}
`;

const BLUR_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outputColor;

uniform sampler2D u_source;
uniform vec2 u_direction;

vec4 sampleValue(vec2 uv) {
	return texture(u_source, clamp(uv, vec2(0.0), vec2(1.0)));
}

void main() {
	// Linear filtering lets these five reads cover nine consecutive texels exactly. Repeating this compact box filter
	// converges on a Gaussian without ever leaving unsampled gaps that turn high-contrast objects into visible echoes.
	vec4 colour = sampleValue(v_uv);
	colour += sampleValue(v_uv + u_direction * 1.5) * 2.0;
	colour += sampleValue(v_uv - u_direction * 1.5) * 2.0;
	colour += sampleValue(v_uv + u_direction * 3.5) * 2.0;
	colour += sampleValue(v_uv - u_direction * 3.5) * 2.0;
	outputColor = colour / 9.0;
}
`;

const COMPOSITE_SHADER = `#version 300 es
precision highp float;

in vec2 v_uv;
out vec4 outputColor;

uniform sampler2D u_video;
uniform sampler2D u_matte;
uniform sampler2D u_background;
uniform sampler2D u_backgroundImage;
uniform vec2 u_backgroundImageScale;
uniform bool u_effect;
uniform bool u_image;

void main() {
	vec3 foreground = texture(u_video, v_uv).rgb;
	if (!u_effect) {
		outputColor = vec4(foreground, 1.0);
		return;
	}

	float person = texture(u_matte, v_uv).r;
	if (u_image) {
		vec2 imageUv = (v_uv - 0.5) * u_backgroundImageScale + 0.5;
		vec3 imageBackground = texture(u_backgroundImage, imageUv).rgb;
		outputColor = vec4(mix(imageBackground, foreground, person), 1.0);
		return;
	}

	vec4 weightedBackground = texture(u_background, v_uv);
	vec3 background = weightedBackground.a > 0.002
		? clamp(weightedBackground.rgb / weightedBackground.a, vec3(0.0), vec3(1.0))
		: foreground;

	outputColor = vec4(mix(background, foreground, person), 1.0);
}
`;

const BOX_BLUR_SIGMA = Math.sqrt((9 ** 2 - 1) / 12);
const MAX_BLUR_PASSES = 8;

/**
 * Keeps the blur on consecutive texels and varies only how many passes and what working resolution are used. The
 * standard deviation of repeated box filters composes as sqrt(passes), so this preserves a consistent visual radius
 * without scaling a sparse kernel into visibly shifted copies of the room.
 */
export const backgroundBlurPlan = (radius: number, qualityReduction: 0 | 1 | 2 = 0): { scale: number; passes: number } => {
	const safeRadius = Math.max(1, radius);
	let scale = 2;
	if (safeRadius > 60) {
		scale = 2 ** Math.max(3, Math.ceil(Math.log2(safeRadius / 15)));
	} else if (safeRadius > 30) {
		scale = 4;
	}
	// Under sustained frame pressure, trade only background working resolution for throughput. The foreground and
	// final composite remain full resolution; recomputing the pass count keeps the apparent blur radius stable.
	scale = Math.min(16, scale * 2 ** qualityReduction);
	const passes = Math.min(MAX_BLUR_PASSES, Math.max(1, Math.ceil((safeRadius / (2 * scale * BOX_BLUR_SIGMA)) ** 2)));

	return { scale, passes };
};

/** The semantic matte is already low-frequency; refining it above this density spends fragments without adding edges. */
export const backgroundMatteScale = (height: number, qualityReduction: 0 | 1 | 2 = 0): number =>
	Math.min(4, (height >= 540 ? 2 : 1) * 2 ** qualityReduction);

/** Texture-coordinate scale for CSS-like `cover`: fill the frame and crop the image centrally. */
export const backgroundImageCoverScale = (
	frameWidth: number,
	frameHeight: number,
	imageWidth: number,
	imageHeight: number,
): { x: number; y: number } => {
	const frameAspect = frameWidth / frameHeight;
	const imageAspect = imageWidth / imageHeight;
	return imageAspect > frameAspect ? { x: frameAspect / imageAspect, y: 1 } : { x: 1, y: imageAspect / frameAspect };
};

type TextureTarget = {
	texture: WebGLTexture;
	framebuffer: WebGLFramebuffer;
	width: number;
	height: number;
};

const createShader = (gl: WebGL2RenderingContext, type: number, source: string): WebGLShader => {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error('background blur could not create a WebGL shader');
	}

	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const message = gl.getShaderInfoLog(shader) || 'unknown shader error';
		gl.deleteShader(shader);
		throw new Error(`background blur shader failed: ${message}`);
	}

	return shader;
};

const createProgram = (gl: WebGL2RenderingContext, fragmentSource: string): WebGLProgram => {
	const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
	const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
	const program = gl.createProgram();
	if (!program) {
		throw new Error('background blur could not create a WebGL program');
	}

	gl.attachShader(program, vertex);
	gl.attachShader(program, fragment);
	gl.linkProgram(program);
	gl.deleteShader(vertex);
	gl.deleteShader(fragment);

	if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
		const message = gl.getProgramInfoLog(program) || 'unknown program error';
		gl.deleteProgram(program);
		throw new Error(`background blur program failed: ${message}`);
	}

	return program;
};

/** Keeps camera frames and masks on GPU for refinement, blur and final compositing. */
export class BackgroundBlurRenderer {
	private readonly gl: WebGL2RenderingContext;

	private readonly matteProgram: WebGLProgram;

	private readonly downsampleProgram: WebGLProgram;

	private readonly blurProgram: WebGLProgram;

	private readonly compositeProgram: WebGLProgram;

	private readonly vertexArray: WebGLVertexArrayObject;

	private readonly vertexBuffer: WebGLBuffer;

	private readonly videoTexture: WebGLTexture;

	private readonly maskTexture: WebGLTexture;

	private readonly backgroundImageTexture: WebGLTexture;

	private readonly matte: TextureTarget;

	private readonly downsampledBackground: TextureTarget;

	private readonly blurHorizontal: TextureTarget;

	private readonly blurVertical: TextureTarget;

	private videoWidth = 1;

	private videoHeight = 1;

	private maskWidth = 1;

	private maskHeight = 1;

	private backgroundImageWidth = 1;

	private backgroundImageHeight = 1;

	private hasBackgroundImage = false;

	private readonly uniforms = new Map<WebGLProgram, Map<string, WebGLUniformLocation>>();

	constructor(private readonly canvas: HTMLCanvasElement) {
		const gl = canvas.getContext('webgl2', {
			alpha: false,
			antialias: false,
			depth: false,
			stencil: false,
			preserveDrawingBuffer: false,
			powerPreference: 'high-performance',
		});
		if (!gl) {
			throw new Error('background blur needs WebGL2');
		}
		this.gl = gl;

		this.matteProgram = createProgram(gl, MATTE_SHADER);
		this.downsampleProgram = createProgram(gl, DOWNSAMPLE_SHADER);
		this.blurProgram = createProgram(gl, BLUR_SHADER);
		this.compositeProgram = createProgram(gl, COMPOSITE_SHADER);

		const vertexArray = gl.createVertexArray();
		const vertexBuffer = gl.createBuffer();
		if (!vertexArray || !vertexBuffer) {
			throw new Error('background blur could not create its WebGL geometry');
		}
		this.vertexArray = vertexArray;
		this.vertexBuffer = vertexBuffer;
		gl.bindVertexArray(vertexArray);
		gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuffer);
		gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
		gl.enableVertexAttribArray(0);
		gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

		this.videoTexture = this.createTexture(gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
		this.maskTexture = this.createTexture(gl.R8, gl.RED, gl.UNSIGNED_BYTE, new Uint8Array([255]));
		this.backgroundImageTexture = this.createTexture(gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([0, 0, 0, 255]));
		this.matte = this.createTarget();
		this.downsampledBackground = this.createTarget();
		this.blurHorizontal = this.createTarget();
		this.blurVertical = this.createTarget();
	}

	resize(width: number, height: number): void {
		if (this.canvas.width === width && this.canvas.height === height) {
			return;
		}

		this.canvas.width = width;
		this.canvas.height = height;
	}

	uploadMask(values: Uint8Array, width: number, height: number): void {
		const { gl } = this;

		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.maskTexture);
		gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
		if (this.maskWidth !== width || this.maskHeight !== height) {
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, values);
			this.maskWidth = width;
			this.maskHeight = height;
		} else {
			gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, width, height, gl.RED, gl.UNSIGNED_BYTE, values);
		}
	}

	/** Upload once when selected; camera frames continue changing but the replacement background does not. */
	setBackgroundImage(image?: ImageBitmap): void {
		this.hasBackgroundImage = Boolean(image);
		if (!image) {
			return;
		}

		const { gl } = this;
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.backgroundImageTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
		this.backgroundImageWidth = image.width;
		this.backgroundImageHeight = image.height;
	}

	render(source: HTMLVideoElement, radius: number, qualityReduction: 0 | 1 | 2 = 0): void {
		const { gl } = this;
		const width = source.videoWidth;
		const height = source.videoHeight;
		if (!width || !height) {
			return;
		}

		// The output canvas is deliberately not resized here. Immediately after a camera restart the reused video
		// element can expose one frame at its previous dimensions; resizing the canvas for that transient frame breaks
		// the newly captured output track. The source texture is independent from that output size and normalized
		// sampling scales it into the canvas selected by the processor.
		gl.bindVertexArray(this.vertexArray);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, this.videoTexture);
		gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
		if (this.videoWidth !== width || this.videoHeight !== height) {
			// Allocate from the video object itself. Chromium can report the new track settings before the reused video
			// element has discarded its last old-size frame; a separate null allocation followed by texSubImage2D then
			// overflows and permanently blackens the WebGL output.
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, source);
			this.videoWidth = width;
			this.videoHeight = height;
		} else {
			gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, 0, gl.RGBA, gl.UNSIGNED_BYTE, source);
		}

		const effect = radius > 0 || this.hasBackgroundImage;
		if (effect) {
			this.resizeMatteTarget(this.canvas.width, this.canvas.height, backgroundMatteScale(this.canvas.height, qualityReduction));
			this.renderMatte();
		}
		if (radius > 0 && !this.hasBackgroundImage) {
			const plan = backgroundBlurPlan(radius, qualityReduction);
			this.resizeBlurTargets(this.canvas.width, this.canvas.height, plan.scale);
			this.renderDownsample();
			this.renderBlur(plan);
		}
		this.renderComposite(effect, this.hasBackgroundImage);
		// Submit the composite before the processor asks its manual canvas-capture track for the corresponding frame.
		gl.flush();
	}

	destroy(): void {
		const { gl } = this;
		[this.matteProgram, this.downsampleProgram, this.blurProgram, this.compositeProgram].forEach((program) => gl.deleteProgram(program));
		[
			this.videoTexture,
			this.maskTexture,
			this.backgroundImageTexture,
			this.matte.texture,
			this.downsampledBackground.texture,
			this.blurHorizontal.texture,
			this.blurVertical.texture,
		].forEach((texture) => gl.deleteTexture(texture));
		[
			this.matte.framebuffer,
			this.downsampledBackground.framebuffer,
			this.blurHorizontal.framebuffer,
			this.blurVertical.framebuffer,
		].forEach((framebuffer) => gl.deleteFramebuffer(framebuffer));
		gl.deleteBuffer(this.vertexBuffer);
		gl.deleteVertexArray(this.vertexArray);
	}

	private createTexture(internalFormat: number, format: number, type: number, value?: ArrayBufferView): WebGLTexture {
		const { gl } = this;
		const texture = gl.createTexture();
		if (!texture) {
			throw new Error('background blur could not create a WebGL texture');
		}

		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
		gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
		gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 1, 1, 0, format, type, value ?? null);
		return texture;
	}

	private createTarget(): TextureTarget {
		const { gl } = this;
		const texture = this.createTexture(gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE);
		const framebuffer = gl.createFramebuffer();
		if (!framebuffer) {
			throw new Error('background blur could not create a WebGL framebuffer');
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
		gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
		return { texture, framebuffer, width: 1, height: 1 };
	}

	private resizeTexture(texture: WebGLTexture, width: number, height: number): void {
		const { gl } = this;
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
	}

	private resizeTarget(target: TextureTarget, width: number, height: number): void {
		if (target.width === width && target.height === height) {
			return;
		}
		this.resizeTexture(target.texture, width, height);
		target.width = width;
		target.height = height;
	}

	private resizeBlurTargets(width: number, height: number, scale: number): void {
		const blurWidth = Math.max(1, Math.ceil(width / scale));
		const blurHeight = Math.max(1, Math.ceil(height / scale));
		this.resizeTarget(this.downsampledBackground, blurWidth, blurHeight);
		this.resizeTarget(this.blurHorizontal, blurWidth, blurHeight);
		this.resizeTarget(this.blurVertical, blurWidth, blurHeight);
	}

	private resizeMatteTarget(width: number, height: number, scale: number): void {
		this.resizeTarget(this.matte, Math.max(1, Math.ceil(width / scale)), Math.max(1, Math.ceil(height / scale)));
	}

	private bindTexture(texture: WebGLTexture, unit: number, location: WebGLUniformLocation): void {
		const { gl } = this;
		gl.activeTexture(gl.TEXTURE0 + unit);
		gl.bindTexture(gl.TEXTURE_2D, texture);
		gl.uniform1i(location, unit);
	}

	private uniform(program: WebGLProgram, name: string): WebGLUniformLocation {
		let programUniforms = this.uniforms.get(program);
		if (!programUniforms) {
			programUniforms = new Map();
			this.uniforms.set(program, programUniforms);
		}

		const cached = programUniforms.get(name);
		if (cached) {
			return cached;
		}

		const location = this.gl.getUniformLocation(program, name);
		if (!location) {
			throw new Error(`background blur shader has no ${name} uniform`);
		}
		programUniforms.set(name, location);
		return location;
	}

	private draw(program: WebGLProgram, target: TextureTarget | undefined): void {
		const { gl } = this;
		gl.bindFramebuffer(gl.FRAMEBUFFER, target?.framebuffer ?? null);
		gl.viewport(0, 0, target?.width ?? this.canvas.width, target?.height ?? this.canvas.height);
		gl.useProgram(program);
		gl.drawArrays(gl.TRIANGLES, 0, 6);
	}

	private renderMatte(): void {
		const { gl, matteProgram } = this;
		gl.useProgram(matteProgram);
		this.bindTexture(this.videoTexture, 0, this.uniform(matteProgram, 'u_video'));
		this.bindTexture(this.maskTexture, 1, this.uniform(matteProgram, 'u_mask'));
		gl.uniform2f(this.uniform(matteProgram, 'u_maskTexel'), 1 / this.maskWidth, 1 / this.maskHeight);
		this.draw(matteProgram, this.matte);
	}

	private renderDownsample(): void {
		const { gl, downsampleProgram } = this;
		gl.useProgram(downsampleProgram);
		this.bindTexture(this.videoTexture, 0, this.uniform(downsampleProgram, 'u_video'));
		this.bindTexture(this.matte.texture, 1, this.uniform(downsampleProgram, 'u_matte'));
		gl.uniform2f(
			this.uniform(downsampleProgram, 'u_footprint'),
			1 / this.downsampledBackground.width,
			1 / this.downsampledBackground.height,
		);
		this.draw(downsampleProgram, this.downsampledBackground);
	}

	private renderBlur({ passes }: ReturnType<typeof backgroundBlurPlan>): void {
		let source = this.downsampledBackground.texture;

		for (let pass = 0; pass < passes; pass++) {
			this.renderBlurPass(source, this.blurHorizontal, 1, 0);
			this.renderBlurPass(this.blurHorizontal.texture, this.blurVertical, 0, 1);
			source = this.blurVertical.texture;
		}
	}

	private renderBlurPass(source: WebGLTexture, target: TextureTarget, directionX: number, directionY: number): void {
		const { gl, blurProgram } = this;
		gl.useProgram(blurProgram);
		this.bindTexture(source, 0, this.uniform(blurProgram, 'u_source'));
		gl.uniform2f(this.uniform(blurProgram, 'u_direction'), directionX / target.width, directionY / target.height);
		this.draw(blurProgram, target);
	}

	private renderComposite(effect: boolean, image: boolean): void {
		const { gl, compositeProgram } = this;
		gl.useProgram(compositeProgram);
		this.bindTexture(this.videoTexture, 0, this.uniform(compositeProgram, 'u_video'));
		this.bindTexture(this.matte.texture, 1, this.uniform(compositeProgram, 'u_matte'));
		this.bindTexture(this.blurVertical.texture, 2, this.uniform(compositeProgram, 'u_background'));
		this.bindTexture(this.backgroundImageTexture, 3, this.uniform(compositeProgram, 'u_backgroundImage'));
		const scale = backgroundImageCoverScale(this.canvas.width, this.canvas.height, this.backgroundImageWidth, this.backgroundImageHeight);
		gl.uniform2f(this.uniform(compositeProgram, 'u_backgroundImageScale'), scale.x, scale.y);
		gl.uniform1i(this.uniform(compositeProgram, 'u_effect'), effect ? 1 : 0);
		gl.uniform1i(this.uniform(compositeProgram, 'u_image'), image ? 1 : 0);
		this.draw(compositeProgram, undefined);
	}
}
