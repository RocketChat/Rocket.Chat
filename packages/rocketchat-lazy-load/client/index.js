import _ from 'underscore';
import './lazyloadImage';
export const fixCordova = function(url) {
	if (url && url.indexOf('data:image') === 0) {
		return url;
	}
	if (Meteor.isCordova && (url && url[0] === '/')) {
		url = Meteor.absoluteUrl().replace(/\/$/, '') + url;
		const query = `rc_uid=${ Meteor.userId() }&rc_token=${ Meteor._localStorage.getItem(
			'Meteor.loginToken'
		) }`;
		if (url.indexOf('?') === -1) {
			url = `${ url }?${ query }`;
		} else {
			url = `${ url }&${ query }`;
		}
	}
	if (Meteor.settings['public'].sandstorm || url.match(/^(https?:)?\/\//i)) {
		return url;
	} else if (navigator.userAgent.indexOf('Electron') > -1) {
		return __meteor_runtime_config__.ROOT_URL_PATH_PREFIX + url;
	} else {
		return Meteor.absoluteUrl().replace(/\/$/, '') + url;
	}
};

const loadImage = instance => {

	const img = new Image();
	const src = instance.firstNode.getAttribute('data-src');
	instance.firstNode.className = instance.firstNode.className.replace('lazy-img', '');
	img.onload = function() {
		instance.loaded.set(true);
		instance.firstNode.removeAttribute('data-src');
	};
	img.src = fixCordova(src);
};

const isVisible = (instance) => {
	requestAnimationFrame(() => {
		const rect = instance.firstNode.getBoundingClientRect();
		if (rect.top >= -100 && rect.left >= 0 && rect.top <= (window.innerHeight || document.documentElement.clientHeight)) {
			return loadImage(instance);
		}
	});

};

window.addEventListener('resize', window.lazyloadtick);

export const lazyloadtick = _.debounce(() => {
	[...document.querySelectorAll('.lazy-img[data-src]')].forEach(el =>
		isVisible(Blaze.getView(el)._templateInstance)
	);
}, 500);

window.lazyloadtick = lazyloadtick;

export const addImage = instance => isVisible(instance);
