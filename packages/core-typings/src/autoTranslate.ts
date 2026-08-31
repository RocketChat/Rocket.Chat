export interface IProviderMetadata {
	name: string;
	displayName: string;
	settings: {
		apiKey: string;
		apiEndPointUrl: string;
	};
}

export interface ISupportedLanguage {
	language: string;
	name: string;
}

export interface ITranslationResult {
	[language: string]: string;
}
