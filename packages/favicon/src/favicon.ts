import type { Badge } from './badge';
import { drawBadge } from './badge';

export class FaviconProcessor {
	private static readonly DEFAULT_FAVICON_SIZE: [number, number] = [32, 32];

	private canvas: HTMLCanvasElement | null = null;

	private context: CanvasRenderingContext2D | null = null;

	private img: HTMLImageElement | null = null;

	private favicon: HTMLLinkElement;

	private initPromise: Promise<void> | null = null;

	constructor(private faviconElement: HTMLLinkElement) {
		this.favicon = faviconElement;
	}

	init(): Promise<void> {
		if (this.initPromise) {
			return this.initPromise;
		}

		this.initPromise = (async () => {
			const { url, fallbackUrl } = this.getFaviconURLs();

			this.setupCanvas();

			try {
				await this.setupImgFromUrl(url);
			} catch {
				await this.setupImgFromUrl(fallbackUrl);
			}
		})();

		return this.initPromise;
	}

	private setupCanvas(width = 32, height = 32): void {
		const canvas = document.createElement('canvas');
		canvas.width = width;
		canvas.height = height;

		const context = canvas.getContext('2d');

		if (!context) {
			throw new Error('Failed to create canvas context');
		}

		this.canvas = canvas;
		this.context = context;
	}

	private async setupImgFromUrl(url: string | undefined): Promise<void> {
		this.img = await this.fetchFaviconImage(url);

		this.drawFavicon(); // draw once to test for tainting, not rendering yet

		if (this.isCanvasTainted()) {
			throw new Error('FaviconProcessor: Failed to create canvas for image (tainted)');
		}
	}

	private async fetchFaviconImage(url: string | undefined): Promise<HTMLImageElement> {
		const img = new Image();

		if (url) {
			img.crossOrigin = 'anonymous';
			img.src = url;
		} else {
			img.src = '';
			img.width = 32;
			img.height = 32;
		}

		return new Promise<HTMLImageElement>((resolve, reject) => {
			img.onload = () => {
				resolve(img);
			};
			img.onerror = () => {
				reject(new Error('FaviconProcessor: Failed to load image'));
			};
		});
	}

	private drawFavicon(badge?: Badge, width?: number, height?: number): void {
		if (!this.canvas || !this.context || !this.img) {
			throw new Error('FaviconProcessor: not initialized');
		}

		const [imgWidth, imgHeight] = this.getSize();

		this.canvas.width = width ?? imgWidth;
		this.canvas.height = height ?? imgHeight;
		this.context.scale(this.canvas.width, this.canvas.height);

		this.context.clearRect(0, 0, 1, 1);
		this.context.drawImage(this.img, 0, 0, 1, 1);

		drawBadge(badge, this.context);

		this.context.setTransform(1, 0, 0, 1, 0, 0);
	}

	private getFaviconURLs(): { url: string | undefined; fallbackUrl: string | undefined } {
		const url = this.faviconElement.getAttribute('href') ?? undefined;
		const fallbackUrl = this.faviconElement.getAttribute('data-href-fallback') ?? undefined;
		return { url, fallbackUrl };
	}

	private isCanvasTainted(): boolean {
		if (!this.canvas) {
			throw new Error('FaviconProcessor: not initialized');
		}

		try {
			this.canvas.toDataURL('image/png');
			return false;
		} catch {
			return true;
		}
	}

	getSize(): [number, number] {
		const sizes = this.faviconElement.getAttribute('sizes');

		if (!sizes || sizes === 'any') {
			return FaviconProcessor.DEFAULT_FAVICON_SIZE;
		}

		const token = sizes.split(/\s+/).find((candidate) => /^\d+\s*x\s*\d+$/i.test(candidate));

		if (!token) {
			return FaviconProcessor.DEFAULT_FAVICON_SIZE;
		}

		const [widthStr, heightStr] = token.split(/x/i).map((part) => part.trim());
		const width = Number(widthStr);
		const height = Number(heightStr);

		if (!Number.isFinite(width) || !Number.isFinite(height)) {
			return FaviconProcessor.DEFAULT_FAVICON_SIZE;
		}

		return [width, height];
	}

	toDataURL(badge: Badge, width?: number, height?: number): string {
		if (!this.canvas || !this.context) {
			throw new Error('FaviconProcessor: not initialized');
		}

		if (this.isCanvasTainted()) {
			throw new Error('FaviconProcessor: Cannot render favicon, canvas is tainted');
		}

		this.drawFavicon(badge, width, height);
		return this.canvas.toDataURL('image/png');
	}

	render(badge: Badge, width?: number, height?: number): void {
		if (this.isCanvasTainted()) {
			throw new Error('FaviconProcessor: Cannot render favicon, canvas is tainted');
		}

		const dataUrl = this.toDataURL(badge, width, height);
		this.favicon.setAttribute('href', dataUrl);
	}

	getCanvas(): HTMLCanvasElement | null {
		return this.canvas;
	}

	getContext(): CanvasRenderingContext2D | null {
		return this.context;
	}

	getFavicon(): HTMLLinkElement {
		return this.favicon;
	}

	getImage(): HTMLImageElement | null {
		return this.img;
	}
}
