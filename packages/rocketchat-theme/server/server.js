/* globals WebAppHashing */

const less = Npm.require('less');
const Autoprefixer = Npm.require('less-plugin-autoprefix');
const crypto = Npm.require('crypto');
const logger = new Logger('rocketchat:theme', {
	methods: {
		stop_rendering: {
			type: 'info'
		}
	}
});

WebApp.rawConnectHandlers.use(function(req, res, next) {
	let css;
	let hash;

	const path = req.url.split('?')[0];
	const prefix = __meteor_runtime_config__.ROOT_URL_PATH_PREFIX || '';
	if (path === (`${ prefix }/__cordova/theme.css`) || path === (`${ prefix }/theme.css`)) {
		css = RocketChat.theme.getCss();
		hash = crypto.createHash('sha1').update(css).digest('hex');
		res.setHeader('Content-Type', 'text/css; charset=UTF-8');
		res.setHeader('ETag', `"${ hash }"`);
		res.write(css);
		return res.end();
	} else {
		return next();
	}
});

const calculateClientHash = WebAppHashing.calculateClientHash;

WebAppHashing.calculateClientHash = function(manifest, includeFilter, runtimeConfigOverride) {
	let hash;
	let themeManifestItem;
	const css = RocketChat.theme.getCss();
	if (css.trim() !== '') {
		hash = crypto.createHash('sha1').update(css).digest('hex');
		themeManifestItem = _.find(manifest, function(item) {
			return item.path === 'app/theme.css';
		});
		if (themeManifestItem == null) {
			themeManifestItem = {};
			manifest.push(themeManifestItem);
		}
		themeManifestItem.path = 'app/theme.css';
		themeManifestItem.type = 'css';
		themeManifestItem.cacheable = true;
		themeManifestItem.where = 'client';
		themeManifestItem.url = `/theme.css?${ hash }`;
		themeManifestItem.size = css.length;
		themeManifestItem.hash = hash;
	}
	return calculateClientHash.call(this, manifest, includeFilter, runtimeConfigOverride);
};

RocketChat.theme = new class {
	constructor() {
		this.variables = {};
		this.packageCallbacks = [];
		this.files = ['server/lesshat.less', 'server/colors.less'];
		this.customCSS = '';
		RocketChat.settings.add('css', '');
		RocketChat.settings.addGroup('Layout');
		RocketChat.settings.onload('css', Meteor.bindEnvironment(() => {
			return function(key, value, initialLoad) {
				if (!initialLoad) {
					return Meteor.startup(function() {
						return process.emit('message', {
							refresh: 'client'
						});
					});
				}
			};
		})(this));
		this.compileDelayed = _.debounce(Meteor.bindEnvironment(this.compile.bind(this)), 100);
		Meteor.startup(() => {
			return function() {
				return RocketChat.settings.onAfterInitialLoad(function() {
					return RocketChat.settings.get('*', Meteor.bindEnvironment(function(key, value) {
						let name;
						if (key === 'theme-custom-css' && value != null) {
							this.customCSS = value;
						} else if (/^theme-.+/.test(key) === true) {
							name = key.replace(/^theme-[a-z]+-/, '');
							if (this.variables[name] != null) {
								this.variables[name].value = value;
							}
						} else {
							return;
						}
						return this.compileDelayed();
					}));
				});
			};
		});
	}

	compile() {

		let content = [this.getVariablesAsLess(), ...Object.keys(this.files || []).map((key) => {
			const file = this.files[key];
			return Assets.getText(file);
		}), ...Object.keys(this.packageCallbacks || []).map((key)=>{
			const value = this.packageCallback[key];
			return value();
		}).filter(value => _.isString(value))];

		content.push(this.customCSS);
		content = content.join('\n');
		const options = {
			compress: true,
			plugins: [new Autoprefixer()]
		};
		const start = Date.now();
		return less.render(content, options, function(err, data) {
			logger.stop_rendering(Date.now() - start);
			if (err != null) {
				return console.log(err);
			}
			RocketChat.settings.updateById('css', data.css);
			return Meteor.startup(function() {
				return Meteor.setTimeout(function() {
					return process.emit('message', {
						refresh: 'client'
					});
				}, 200);
			});
		});
	}

	addVariable(type, name, value, section, persist, editor, allowedTypes) {
		let config;
		if (persist == null) {
			persist = true;
		}
		this.variables[name] = {
			type,
			value
		};
		if (persist === true) {
			config = {
				group: 'Layout',
				type,
				editor: editor || type,
				section,
				'public': false,
				allowedTypes
			};
			return RocketChat.settings.add(`theme-${ type }-${ name }`, value, config);
		}
	}

	addPublicColor(name, value, section, editor) {
		if (editor == null) {
			editor = 'color';
		}
		return this.addVariable('color', name, value, section, true, editor, ['color', 'expression']);
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
		return Object.keys(this.variables).map((obj, name) => {
			const variable = this.variables[name];
			return `@${ name }: ${ variable.value };`;
		}).join('\n');
	}

	addPackageAsset(cb) {
		this.packageCallbacks.push(cb);
		return this.compileDelayed();
	}

	getCss() {
		return RocketChat.settings.get('css') || '';
	}

};
