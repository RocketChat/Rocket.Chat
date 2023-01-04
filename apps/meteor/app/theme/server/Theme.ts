import { performance } from 'perf_hooks';

import { Meteor } from 'meteor/meteor';
import AutoPrefixerLessPlugin from 'less-plugin-autoprefixer';
import { Settings } from '@rocket.chat/models';
import type { ISetting, ISettingColor } from '@rocket.chat/core-typings';

import { withDebouncing } from '../../../lib/utils/highOrderFunctions';
import { settingsRegistry, settings } from '../../settings/server';
import type { Logger } from '../../logger/server';

export class Theme {
	private variables: Record<
		string,
		{
			type: 'font' | 'color';
			value: unknown;
			editor?: ISettingColor['editor'];
		}
	> = {};

	private packageCallbacks: (() => string)[] = [];

	private customCSS = '';

	private compileDelayed: () => void = withDebouncing({ wait: 100 })(Meteor.bindEnvironment(this.compile.bind(this)));

	private logger: Logger;

	public constructor({ logger }: { logger: Logger }) {
		this.logger = logger;
		this.watchSettings();
	}

	private watchSettings() {
		settingsRegistry.add('css', '');
		settingsRegistry.addGroup('Layout');

		settings.watchByRegex(/^theme-./, (key, value) => {
			if (key === 'theme-custom-css' && !!value) {
				this.customCSS = String(value);
			} else {
				const name = key.replace(/^theme-[a-z]+-/, '');
				if (this.variables[name]) {
					this.variables[name].value = value;
				}
			}

			this.compileDelayed();
		});
	}

	private compile() {
		const content = [...this.packageCallbacks.map((name) => name()), this.customCSS].join('\n');

		const options: Less.Options = {
			compress: true,
			plugins: [new AutoPrefixerLessPlugin()],
		};

		const start = performance.now();

		return less.render(content, options, (err, data) => {
			this.logger.info({ stop_rendering: performance.now() - start });

			if (err) {
				this.logger.error(err);
				return;
			}

			Settings.updateValueById('css', data?.css);

			Meteor.startup(() => {
				Meteor.setTimeout(() => {
					process.emit('message', { refresh: 'client' });
				}, 200);
			});
		});
	}

	public addVariable(type: 'font', name: string, value: ISetting['value'], section: ISetting['section'], persist?: boolean): void;

	public addVariable(
		type: 'color',
		name: string,
		value: ISettingColor['value'],
		section: ISettingColor['section'],
		persist: boolean,
		editor: ISettingColor['editor'],
	): void;

	public addVariable(
		type: 'font' | 'color',
		name: string,
		value: ISetting['value'],
		section: ISetting['section'],
		persist = true,
		editor?: ISettingColor['editor'],
	) {
		this.variables[name] = {
			type,
			value,
			editor,
		};

		if (!persist) {
			return;
		}

		// TODO: this is a hack to make the type checker happy
		const config: Partial<ISetting> & { allowedTypes?: ['color', 'expression'] } = {
			group: 'Layout',
			type,
			section,
			public: true,
			...(type === 'color' && {
				editor,
				allowedTypes: ['color', 'expression'],
			}),
		};

		settingsRegistry.add(`theme-${type}-${name}`, value, config);
	}

	public getCss() {
		return settings.get('css') || '';
	}
}
