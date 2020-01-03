import './lazyloadImage';

const map = new WeakMap();

const featureExists = !!window.IntersectionObserver;
const loadImage = (el) => {
	const instance = map.get(el);

	map.delete(el);

	if (!instance) {
		return instance.loaded.set(true);
	}
	const img = new Image();
	const src = el.getAttribute('data-src');
	img.onload = () => {
		el.className = el.className.replace('lazy-img', '');
		el.src = src;
		el.removeAttribute('data-src');
	};
	img.src = src;
};

const observer = featureExists && new IntersectionObserver(
	(entries, observer) => entries.forEach((entry) => {
		if (typeof entry.isVisible === 'undefined') {
			entry.isVisible = true;
		}

		if (entry.isIntersecting && entry.isVisible) {
			observer.unobserve(entry.target);
			return loadImage(entry.target);
		}
	})
	,
	{
		threshold: [1.0],
		// 🆕 Track the actual visibility of the element
		trackVisibility: true,
		// 🆕 Set a minimum delay between notifications
		delay: 100,
	},
);

export const addImage = (instance) => {
	const el = instance.firstNode;
	map.set(el, instance);
	if (featureExists) {
		return observer.observe(el);
	}
	loadImage(el);
};
