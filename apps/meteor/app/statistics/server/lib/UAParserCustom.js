import UAParser from 'ua-parser-js';

const mergeDeep = (target, source) => {
	if (!(typeof target === 'object' && typeof source === 'object')) {
		return target;
	}

	for (const key in source) {
		if (source[key] === null && (target[key] === undefined || target[key] === null)) {
			target[key] = null;
		} else if (source[key] instanceof Array) {
			if (!target[key]) {
				target[key] = [];
			}
			target[key] = target[key].concat(source[key]);
		} else if (typeof source[key] === 'object') {
			if (!target[key]) {
				target[key] = {};
			}
			mergeDeep(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}

	return target;
};

export const UAParserMobile = {
	appName: 'RC Mobile',
	device: 'mobile-app',
	uaSeparator: ';',
	props: {
		os: {
			list: ['name', 'version'],
		},
		app: {
			list: ['version', 'bundle'],
			get: (prop, value) => {
				if (prop === 'bundle') {
					return value.replace(/([()])/g, '');
				}

				if (prop === 'version') {
					return value.replace(/^v/g, '');
				}

				return value;
			},
		},
	},

	isMobileApp(uaString) {
		if (!uaString || typeof uaString !== 'string') {
			return false;
		}

		const splitUA = uaString.split(this.uaSeparator);
		return splitUA && splitUA[0] && splitUA[0].trim() === this.appName;
	},

	/**
	 *
	 * @param {string} uaString
	 * @returns { device: { type: '' }, app: { name: '', version: '' } }
	 */
	uaObject(uaString) {
		if (!this.isMobileApp(uaString)) {
			return {};
		}

		const splitUA = uaString.split(this.uaSeparator);

		let obj = {
			device: {
				type: this.device,
			},
			app: {
				name: splitUA[0],
			},
		};

		splitUA.shift(); // remove first element
		if (splitUA.length === 0) {
			return obj;
		}

		splitUA.forEach((element, index) => {
			const splitProps = element.trim().split(' ');
			const key = Object.keys(this.props)[index];
			if (!key) {
				return;
			}

			const props = this.props[key];
			if (!props.list || !Array.isArray(props.list) || props.list.length === 0) {
				return;
			}

			const subProps = {};
			splitProps.forEach((value, idx) => {
				if (props.list.length > idx) {
					const propName = props.list[idx];
					subProps[propName] = props.get ? props.get(propName, value) : value;
				}
			});

			const prop = {};
			prop[key] = subProps;
			obj = mergeDeep(obj, prop);
		});

		return obj;
	},
};

export const UAParserDesktop = {
	device: 'desktop-app',

	isDesktopApp(uaString) {
		if (!uaString || typeof uaString !== 'string') {
			return false;
		}

		return uaString.includes(' Electron/');
	},

	/**
	 *
	 * @param {string} uaString
	 * @returns { device: { type: '' }, os: '' || {}, app: { name: '', version: '' } }
	 */
	uaObject(uaString) {
		if (!this.isDesktopApp(uaString)) {
			return {};
		}

		const ua = new UAParser(uaString);
		const uaParsed = ua.getResult();

		const [, name, version] = uaString.match(/(Rocket\.Chat)\/(\d+(\.\d+)+)/) || [];

		return {
			device: {
				type: this.device,
			},
			os: uaParsed.os,
			app: {
				name,
				version,
			},
		};
	},
};
