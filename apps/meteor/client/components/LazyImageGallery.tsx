import type { ImageGalleryComponentProps } from '@rocket.chat/ui-client';
import { Suspense, lazy } from 'react';

// Loaded on demand: the gallery pulls in swiper, which is only needed once an image is opened.
const ImageGallery = lazy(() => import('./ImageGallery').then(({ ImageGallery }) => ({ default: ImageGallery })));

const LazyImageGallery = (props: ImageGalleryComponentProps) => (
	<Suspense fallback={null}>
		<ImageGallery {...props} />
	</Suspense>
);

export default LazyImageGallery;
