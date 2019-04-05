import _ from 'underscore';
import less from 'less';
import Autoprefixer from 'less-plugin-autoprefix';
import crypto from 'crypto';

import { WebApp } from 'meteor/webapp';
import { Meteor } from 'meteor/meteor';
import { Inject } from 'meteor/meteorhacks:inject-initial';

import { settings } from '../../settings';
import { Logger } from '../../logger';
import { getURL } from '../../utils';

const logger = new Logger('rocketchat:theme', {
	methods: {
		stop_rendering: {
			type: 'info',
		},
	},
});

let currentHash = '';
let currentSize = 0;

export const theme = new class {
	constructor() {
		this.variables = {};
		this.packageCallbacks = [];
		this.files = ['server/colors.less'];
		this.customCSS = '';
		settings.add('css', '');
		settings.addGroup('Layout');
		settings.onload('css', Meteor.bindEnvironment((key, value, initialLoad) => {
			if (!initialLoad) {
				Meteor.startup(function() {
					process.emit('message', {
						refresh: 'client',
					});
				});
			}
		}));
		this.compileDelayed = _.debounce(Meteor.bindEnvironment(this.compile.bind(this)), 100);
		Meteor.startup(() => {
			settings.onAfterInitialLoad(() => {
				settings.get(/^theme-./, Meteor.bindEnvironment((key, value) => {
					if (key === 'theme-custom-css' && value != null) {
						this.customCSS = value;
					} else {
						const name = key.replace(/^theme-[a-z]+-/, '');
						if (this.variables[name] != null) {
							this.variables[name].value = value;
						}
					}

					this.compileDelayed();
				}));
			});
		});
	}

	compile() {
		let content = [this.getVariablesAsLess()];

		content.push(...this.files.map((name) => Assets.getText(name)));

		content.push(...this.packageCallbacks.map((name) => name()));

		content.push(this.customCSS);
		content = content.join('\n');
		const options = {
			compress: true,
			plugins: [new Autoprefixer()],
		};
		const start = Date.now();
		return less.render(content, options, function(err, data) {
			logger.stop_rendering(Date.now() - start);
			if (err != null) {
				return console.log(err);
			}
			settings.updateById('css', data.css);

			currentHash = crypto.createHash('sha1').update(data.css).digest('hex');
			currentSize = data.css.length;
			const themePath = `/theme.css?${ currentHash }`;
			Inject.rawHead('css-theme', `<link rel="stylesheet" type="text/css" href="${ getURL(themePath) }">`);

			return Meteor.startup(function() {
				return Meteor.setTimeout(function() {
					return process.emit('message', {
						refresh: 'client',
					});
				}, 200);
			});
		});
	}

	addColor(name, value, section, properties) {
		const config = {
			group: 'Colors',
			type: 'color',
			editor: 'color',
			public: true,
			properties,
			section,
		};

		return settings.add(`theme-color-${ name }`, value, config);
	}

	addVariable(type, name, value, section, persist = true, editor, allowedTypes, property) {
		this.variables[name] = {
			type,
			value,
		};
		if (persist) {
			const config = {
				group: 'Layout',
				type,
				editor: editor || type,
				section,
				public: true,
				allowedTypes,
				property,
			};
			return settings.add(`theme-${ type }-${ name }`, value, config);
		}

	}

	addPublicColor(name, value, section, editor = 'color', property) {
		return this.addVariable('color', name, value, section, true, editor, ['color', 'expression'], property);
	}

	addPublicFont(name, value) {
		return this.addVariable('font', name, value, 'Fonts', true);
	}

	getVariablesAsObject() {
		return Object.keys(this.variables).reduce((obj, name) => {
			obj[name] = this.variables[name].value;
			return obj;
		}, {});
	}

	getVariablesAsLess() {
		return Object.keys(this.variables).map((name) => {
			const variable = this.variables[name];
			return `@${ name }: ${ variable.value };`;
		}).join('\n');
	}

	addPackageAsset(cb) {
		this.packageCallbacks.push(cb);
		return this.compileDelayed();
	}

	getCss() {
		return settings.get('css') || '';
	}
};

WebApp.rawConnectHandlers.use(function(req, res, next) {
	const path = req.url.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	if (path !== `${ prefix }/theme.css`) {
		return next();
	}

	res.setHeader('Content-Type', 'text/css; charset=UTF-8');
	res.setHeader('Content-Length', currentSize);
	res.setHeader('ETag', `"${ currentHash }"`);
	res.write(theme.getCss());
	res.end();
});
