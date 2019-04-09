import { mergeDeep } from '../../../utils/lib/mergeDeep';

const UAParserMobile = {
	appName: 'RC Mobile',
	device: 'mobile',
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

export { UAParserMobile };
