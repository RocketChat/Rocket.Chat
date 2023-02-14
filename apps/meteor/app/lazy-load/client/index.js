import './lazyloadImage';

const map = new WeakMap();

const featureExists = !!window.IntersectionObserver;
const loadImage = (el) => {
	const instance = map.get(el);

	map.delete(el);

	if (!instance) {
		return;
	}

	const img = new Image();
	const src = el.getAttribute('data-src');
	img.onload = () => {
		el.className = el.className.replace('lazy-img', '');
		el.src = src;
		el.removeAttribute('data-src');
		instance.loaded.set(true);
	};
	img.src = src;
};

const observer =
	featureExists &&
	new IntersectionObserver(
		(entries, observer) =>
			entries.forEach((entry) => {
				if (entry.isIntersecting) {
					observer.unobserve(entry.target);
					return loadImage(entry.target);
				}
			}),
		{
			threshold: [0],
			trackVisibility: true,
			delay: 230,
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
