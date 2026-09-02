export type WithTranslations<T> = T & {
	i18n?: {
		key: string;
		ns?: string;
		args?: { [key: string]: string | number };
	};
};
