import type { Badge } from './badge';
import { FaviconProcessor } from './favicon';

describe('FaviconProcessor', () => {
	let linkElement: HTMLLinkElement;
	let processor: FaviconProcessor;

	const createMockImage = (): {
		onload: () => void;
		onerror: (e: string) => void;
		src: string;
		crossOrigin: string;
		width: number;
		height: number;
	} => ({
		onload: () => undefined,
		onerror: () => undefined,
		src: '',
		crossOrigin: '',
		width: 32,
		height: 32,
	});

	const mockImage = createMockImage();

	const createMockContext = () => ({
		scale: jest.fn(),
		clearRect: jest.fn(),
		drawImage: jest.fn(),
		setTransform: jest.fn(),
		beginPath: jest.fn(),
		moveTo: jest.fn(),
		lineTo: jest.fn(),
		quadraticCurveTo: jest.fn(),
		arc: jest.fn(),
		fill: jest.fn(),
		closePath: jest.fn(),
		stroke: jest.fn(),
		fillText: jest.fn(),
		toDataURL: jest.fn().mockReturnValue('data:image/png;base64,sometestdata'),
		canvas: {
			toDataURL: jest.fn().mockReturnValue('data:image/png;base64,sometestdata'),
		},
	});

	const createMockCanvas = () => ({
		getContext: jest.fn().mockImplementation(() => createMockContext()),
		toDataURL: jest.fn().mockReturnValue('data:image/png;base64,sometestdata'),
	});

	beforeEach(() => {
		linkElement = document.createElement('link');
		linkElement.rel = 'icon';
		linkElement.href = 'http://localhost/favicon.ico';
		linkElement.dataset.hrefFallback = 'http://localhost/fallback.ico';
		document.head.appendChild(linkElement);

		processor = new FaviconProcessor(linkElement);

		jest.spyOn(window, 'Image').mockImplementation(() => mockImage as any);
		jest.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
			if (tagName === 'canvas') {
				return createMockCanvas() as any;
			}

			return document.createElement(tagName);
		});
	});

	afterEach(() => {
		document.head.innerHTML = '';
		jest.restoreAllMocks();
	});

	it('should be instantiable', () => {
		expect(new FaviconProcessor(linkElement)).toBeInstanceOf(FaviconProcessor);
	});

	describe('init', () => {
		it('should initialize and load the favicon', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			expect(processor.getImage()).not.toBeNull();
			expect(processor.getCanvas()).not.toBeNull();
			expect(processor.getContext()).not.toBeNull();
		});

		it('should return the same promise if called multiple times', async () => {
			const promise1 = processor.init();
			const promise2 = processor.init();

			expect(promise1).toBe(promise2);

			mockImage.onload();

			return promise1;
		});

		it('should try fallback url if main fails', async () => {
			const promise = processor.init();

			mockImage.onerror('Failed to load');

			await new Promise(process.nextTick);

			mockImage.onload();

			await promise;

			expect(processor.getImage()?.src).toBe('http://localhost/fallback.ico');
		});
	});

	describe('getSize', () => {
		it('should return default size if sizes attribute is not present', () => {
			expect(processor.getSize()).toEqual([32, 32]);
		});

		it('should return default size if sizes attribute is "any"', () => {
			linkElement.setAttribute('sizes', 'any');
			expect(processor.getSize()).toEqual([32, 32]);
		});

		it('should parse a single size', () => {
			linkElement.setAttribute('sizes', '16x16');
			expect(processor.getSize()).toEqual([16, 16]);
		});

		it('should parse the first valid size from a list', () => {
			linkElement.setAttribute('sizes', '16x 32x32');
			expect(processor.getSize()).toEqual([32, 32]);
		});

		it('should return default size for invalid size format', () => {
			linkElement.setAttribute('sizes', 'invalid');
			expect(processor.getSize()).toEqual([32, 32]);
		});
	});

	describe('toDataURL', () => {
		const badge: Badge = '1';

		it('should throw if not initialized', async () => {
			expect(() => processor.toDataURL(badge)).toThrow();
		});

		it('should return a data URL after initialization', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			const dataUrl = processor.toDataURL(badge);
			expect(dataUrl).toMatch(/^data:image\/png;base64,/);
		});

		it('should throw if canvas is tainted', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			jest.spyOn(processor.getCanvas() as HTMLCanvasElement, 'toDataURL').mockImplementation(() => {
				throw new Error('tainted');
			});

			expect(() => processor.toDataURL(badge)).toThrow();
		});
	});

	describe('render', () => {
		const badge: Badge = '1';

		it('should throw if not initialized', () => {
			expect(() => processor.render(badge)).toThrow();
		});

		it('should set the favicon href attribute', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			processor.render(badge);
			expect(linkElement.href).toMatch(/^data:image\/png;base64,/);
		});

		it('should not set href if canvas is tainted', async () => {
			const originalHref = linkElement.href;

			const promise = processor.init();
			mockImage.onload();
			await promise;

			jest.spyOn(processor.getCanvas() as HTMLCanvasElement, 'toDataURL').mockImplementation(() => {
				throw new Error('tainted');
			});

			expect(() => processor.render(badge)).toThrow();
			expect(linkElement.href).toBe(originalHref);
		});

		it('should render with specific width and height', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			const width = 48;
			const height = 48;

			processor.render(badge, width, height);

			const canvas = processor.getCanvas();
			expect(canvas?.width).toBe(width);
			expect(canvas?.height).toBe(height);
		});
	});

	describe('getters', () => {
		it('should return the favicon element', () => {
			expect(processor.getFavicon()).toBe(linkElement);
		});

		it('should return null for canvas, context, and image before init', () => {
			expect(processor.getCanvas()).toBeNull();
			expect(processor.getContext()).toBeNull();
			expect(processor.getImage()).toBeNull();
		});

		it('should return instances after init', async () => {
			const promise = processor.init();
			mockImage.onload();
			await promise;

			expect(processor.getCanvas()).not.toBeNull();
			expect(processor.getContext()).not.toBeNull();
			expect(processor.getImage()).not.toBeNull();
		});
	});
});
