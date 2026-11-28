type ObserverSizeProperty = 'contentBoxSize' | 'borderBoxSize';

export const extractSizeFromObserver = (entry: ResizeObserverEntry, sizeProperty: ObserverSizeProperty): ResizeObserverSize => {
	// In case we're dealing with Safari, 'contentBoxSize'
	// && 'borderBoxSize' do not exist up to this point.
	// 'contentRect' does exist though, and per definition, it's
	// height and width are equivalent to 'contentBoxSize'
	if (!entry[sizeProperty]) {
		if (sizeProperty === 'contentBoxSize') {
			return {
				inlineSize: entry.contentRect.width,
				blockSize: entry.contentRect.height,
			};
		}

		return {
			inlineSize: Math.round(entry.target.getBoundingClientRect().width),
			blockSize: Math.round(entry.target.getBoundingClientRect().height),
		};
	}

	// entry[sizeProperty] has to be assigned to a const so
	// that TS inference works properly.
	const entrySizeProperty = entry[sizeProperty];

	// Some browsers (FF) do not return the property as an
	// array, hence this check.
	const size = Array.isArray(entrySizeProperty) ? entrySizeProperty[0] : entrySizeProperty;

	return {
		blockSize: size.blockSize,
		inlineSize: size.inlineSize,
	};
};

export const extractContentBoxSizeFromObserver = (entry: ResizeObserverEntry): ResizeObserverSize =>
	extractSizeFromObserver(entry, 'contentBoxSize');

export const extractBorderBoxSizeFromObserver = (entry: ResizeObserverEntry): ResizeObserverSize =>
	extractSizeFromObserver(entry, 'borderBoxSize');
