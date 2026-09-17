let segmenter;

// MediaPipe checks this only to select an Apple touch-device readPixels workaround. Workers have no document.
self.document ??= {};

const message = (value, transfer) => self.postMessage(value, transfer ?? []);

self.addEventListener('message', async ({ data }) => {
	try {
		if (data.type === 'init') {
			const { FilesetResolver, ImageSegmenter } = await import('./vision_bundle.mjs');
			const files = await FilesetResolver.forVisionTasks(data.wasmUrl);
			segmenter = await ImageSegmenter.createFromOptions(files, {
				baseOptions: { modelAssetPath: data.modelUrl, delegate: 'GPU' },
				canvas: new OffscreenCanvas(data.width, data.height),
				runningMode: 'VIDEO',
				outputCategoryMask: false,
				outputConfidenceMasks: true,
			});
			message({ type: 'ready', labels: segmenter.getLabels() });
			return;
		}

		if (data.type === 'close') {
			segmenter?.close();
			segmenter = undefined;
			self.close();
			return;
		}

		if (data.type !== 'segment' || !segmenter) {
			return;
		}

		const startedAt = performance.now();
		segmenter.segmentForVideo(data.frame, data.timestamp, (result) => {
			try {
				const mask = result.confidenceMasks?.[data.personIndex];
				if (!mask) {
					throw new Error('the segmentation model returned no person confidence mask');
				}
				const values = new Float32Array(mask.getAsFloat32Array());
				message({ type: 'mask', values, width: mask.width, height: mask.height, durationMs: performance.now() - startedAt }, [
					values.buffer,
				]);
			} finally {
				result.close();
				data.frame.close();
			}
		});
	} catch (error) {
		data.frame?.close();
		message({ type: 'error', message: error instanceof Error ? error.message : String(error) });
	}
});
