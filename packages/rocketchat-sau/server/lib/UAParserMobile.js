const mergeDeep = ((target, source) => {
	if (!(typeof target === 'object' && typeof source === 'object')) {
		return target;
	}

	for (const key in source) {
		if (source[key] === null && (target[key] === undefined || target[key] === null)) {
			target[key] = null;
		} else if (source[key] instanceof Array) {
			if (!target[key]) { target[key] = []; }
			target[key] = target[key].concat(source[key]);
		} else if (typeof source[key] === 'object') {
			if (!target[key]) { target[key] = {}; }
			mergeDeep(target[key], source[key]);
		} else {
			target[key] = source[key];
		}
	}

	return target;
});

const UAParserMobile = {
	appName: 'RC Mobile',
	device: 'mobile',
	uaSeparator: ';',
	props: {
		os: ['name', 'version'],
		app: ['version', 'bundle']
	},

	isMobileApp(uaString) {
		if (!uaString || typeof uaString !== 'string') {
			return false;
		}

		const splitUA = uaString.split(this.uaSeparator);
		return splitUA && splitUA[0] && splitUA[0].trim() === this.appName;
	},

	uaObject(uaString) {
		if (!this.isMobileApp(uaString)) {
			return {};
		}

		const splitUA = uaString.split(this.uaSeparator);

		let obj = {
			device: {
				type: this.device
			},
			app: {
				name: splitUA[0]
			}
		};

		splitUA.shift(); //remove first element
		if (splitUA.length === 0) {
			return;
		}

		splitUA.forEach((element, index) => {
			const splitProps = element.trim().split(' ');
			const key = Object.keys(this.props)[index];
			if (!key) {
				return;
			}

			const props = this.props[key];
			if (!Array.isArray(props) || props.length === 0) {
				return;
			}

			const subProps = {};
			splitProps.forEach((value, idx) => {
				if (props.length > idx) {
					const propName = props[idx];
					subProps[propName] = value;
				}
			});

			const prop = {};
			prop[key] = subProps;
			obj = mergeDeep(obj, prop);
		});

		return obj;
	}
};

export { UAParserMobile };
