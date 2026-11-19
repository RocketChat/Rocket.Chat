import type { BackgroundTransformer } from '@livekit/track-processors';

type SegmentationMask = { width: number; height: number; getAsWebGLTexture(): WebGLTexture };

type InitOptions = Parameters<BackgroundTransformer['init']>[0];

/** Which confidence mask to read, and whether it scores the person rather than the background the compositor expects. */
const CONFIDENCE_MASK = { index: 0, scoresPerson: true };

/** How much of the previous mask each frame keeps: higher steadies the edges but makes them trail movement. */
const MASK_SMOOTHING = 0.5;

const vertexShader = `#version 300 es
void main() {
	vec2 corner = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
	gl_Position = vec4(corner * 2.0 - 1.0, 0.0, 1.0);
}`;

const fragmentShader = `#version 300 es
precision highp float;
uniform sampler2D u_raw;
uniform sampler2D u_previous;
uniform float u_smoothing;
out vec4 fragColor;
void main() {
	ivec2 texel = ivec2(gl_FragCoord.xy);
	float raw = ${CONFIDENCE_MASK.scoresPerson ? '1.0 - ' : ''}texelFetch(u_raw, texel, 0).r;
	fragColor = vec4(mix(raw, texelFetch(u_previous, texel, 0).r, u_smoothing), 0.0, 0.0, 1.0);
}`;

const compile = (gl: WebGL2RenderingContext, type: number, source: string) => {
	const shader = gl.createShader(type);
	if (!shader) {
		throw new Error('Could not create the mask smoothing shader');
	}
	gl.shaderSource(shader, source);
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
		const log = gl.getShaderInfoLog(shader);
		gl.deleteShader(shader);
		throw new Error(`Could not compile the mask smoothing shader: ${log}`);
	}
	return shader;
};

/** Averages each confidence mask with the ones before it, at the mask's own resolution, scoring the background. */
class MaskSmoother {
	private readonly program: WebGLProgram;

	private readonly vertexArray: WebGLVertexArrayObject;

	private readonly smoothingLocation: WebGLUniformLocation | null;

	private textures: WebGLTexture[] = [];

	private framebuffers: WebGLFramebuffer[] = [];

	private width = 0;

	private height = 0;

	private latest = 0;

	private primed = false;

	constructor(private readonly gl: WebGL2RenderingContext) {
		const program = gl.createProgram();
		const vertexArray = gl.createVertexArray();
		if (!program || !vertexArray) {
			throw new Error('Could not create the mask smoothing program');
		}
		const shaders = [compile(gl, gl.VERTEX_SHADER, vertexShader), compile(gl, gl.FRAGMENT_SHADER, fragmentShader)];
		shaders.forEach((shader) => gl.attachShader(program, shader));
		gl.linkProgram(program);
		shaders.forEach((shader) => gl.deleteShader(shader));
		if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
			throw new Error(`Could not link the mask smoothing program: ${gl.getProgramInfoLog(program)}`);
		}
		gl.useProgram(program);
		gl.uniform1i(gl.getUniformLocation(program, 'u_raw'), 0);
		gl.uniform1i(gl.getUniformLocation(program, 'u_previous'), 1);

		this.program = program;
		this.vertexArray = vertexArray;
		this.smoothingLocation = gl.getUniformLocation(program, 'u_smoothing');
	}

	smooth(mask: SegmentationMask): WebGLTexture {
		const { gl } = this;
		if (mask.width !== this.width || mask.height !== this.height) {
			this.resize(mask.width, mask.height);
		}
		const target = 1 - this.latest;

		gl.bindFramebuffer(gl.FRAMEBUFFER, this.framebuffers[target]);
		gl.viewport(0, 0, this.width, this.height);
		gl.useProgram(this.program);
		gl.bindVertexArray(this.vertexArray);
		gl.activeTexture(gl.TEXTURE0);
		gl.bindTexture(gl.TEXTURE_2D, mask.getAsWebGLTexture());
		gl.activeTexture(gl.TEXTURE1);
		gl.bindTexture(gl.TEXTURE_2D, this.textures[this.latest]);
		// The first mask after a reset has nothing to average with.
		gl.uniform1f(this.smoothingLocation, this.primed ? MASK_SMOOTHING : 0);
		gl.drawArrays(gl.TRIANGLES, 0, 3);
		gl.bindVertexArray(null);
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);

		this.latest = target;
		this.primed = true;
		return this.textures[target];
	}

	release() {
		this.releaseTargets();
		this.gl.deleteProgram(this.program);
		this.gl.deleteVertexArray(this.vertexArray);
	}

	private resize(width: number, height: number) {
		const { gl } = this;
		this.releaseTargets();
		for (let i = 0; i < 2; i++) {
			const texture = gl.createTexture();
			const framebuffer = gl.createFramebuffer();
			if (!texture || !framebuffer) {
				throw new Error('Could not create the mask smoothing buffers');
			}
			gl.bindTexture(gl.TEXTURE_2D, texture);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.R8, width, height, 0, gl.RED, gl.UNSIGNED_BYTE, null);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
			gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
			gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
			this.textures.push(texture);
			this.framebuffers.push(framebuffer);
		}
		gl.bindFramebuffer(gl.FRAMEBUFFER, null);
		this.width = width;
		this.height = height;
		this.latest = 0;
		this.primed = false;
	}

	private releaseTargets() {
		this.textures.forEach((texture) => this.gl.deleteTexture(texture));
		this.framebuffers.forEach((framebuffer) => this.gl.deleteFramebuffer(framebuffer));
		this.textures = [];
		this.framebuffers = [];
		this.width = 0;
		this.height = 0;
	}
}

/** The library's transformer, compositing on confidence masks smoothed over time to soften and steady the edges. */
export const withSmoothedMask = (Base: typeof BackgroundTransformer): typeof BackgroundTransformer =>
	class SmoothedMaskTransformer extends Base {
		#smoother: MaskSmoother | undefined;

		/** Set when the smoothing pass cannot run here; masks then go through as the segmenter made them, unsmoothed and uninverted. */
		#unsmoothable = false;

		constructor(...args: ConstructorParameters<typeof BackgroundTransformer>) {
			super(...args);
			// `updateMask` is private only in the library's types; it runs while each segmentation result is open.
			Object.assign(this, { updateMask: async () => this.#updateMask() });
		}

		override async init(options: InitOptions) {
			this.#smoother = undefined;
			await super.init(options);
			// The library asks for a binary category mask; confidence keeps the edges soft once scaled up.
			await this.imageSegmenter?.setOptions({ outputCategoryMask: false, outputConfidenceMasks: true });
		}

		override async restart(options: InitOptions) {
			this.#release();
			await super.restart(options);
		}

		// The library loses the WebGL context on destroy, so the smoother's resources go first.
		override async destroy(...args: Parameters<BackgroundTransformer['destroy']>) {
			this.#release();
			await super.destroy(...args);
		}

		#updateMask() {
			const mask = this.segmentationResults?.confidenceMasks?.[CONFIDENCE_MASK.index];
			if (!mask || !this.gl) {
				return;
			}
			this.gl.updateMask(this.#smooth(mask) ?? mask.getAsWebGLTexture());
		}

		#smooth(mask: SegmentationMask) {
			if (this.#unsmoothable) {
				return undefined;
			}
			try {
				const gl = this.canvas?.getContext('webgl2');
				if (!gl) {
					return undefined;
				}
				this.#smoother ??= new MaskSmoother(gl);
				return this.#smoother.smooth(mask);
			} catch (err) {
				this.#unsmoothable = true;
				this.#release();
				console.error('Background effect mask smoothing is unavailable', err);
				return undefined;
			}
		}

		#release() {
			this.#smoother?.release();
			this.#smoother = undefined;
		}
	};
