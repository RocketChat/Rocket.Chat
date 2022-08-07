declare module 'meteor/rocketchat:tap-i18n' {
	import type { Tracker } from 'meteor/tracker';
	import type i18next from 'i18next';

	namespace TAPi18n {
		function __(
			s: string | undefined,
			options?: {
				lng?: string;
			} & {
				[replacements: string]: boolean | number | string | string[];
			} & (
					| {
							postProcess: 'sprintf';
							sprintf: (boolean | number | string)[];
					  }
					| Record<string, any>
				),
			lang?: string,
		): string;
		function getLanguages(): {
			[language: string]: {
				name: string;
				en: string;
			};
		};
		function setLanguage(language: string): void;

		const _language_changed_tracker: Tracker.Dependency;

		const _loaded_lang_session_key: string;

		const conf: {
			i18n_files_route: string;
		};
	}

	export const TAPi18next: typeof i18next;
}
