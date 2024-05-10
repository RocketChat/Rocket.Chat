export interface IProviderMetadata {
	name: string;
	displayName: string;
	settings: {
		apiKey: string;
		apiEndPointUrl: string;
	};
}
export interface IDeepLTranslation {
	detected_source_language: string;
	text: string;
}

export interface IGoogleTranslation {
	translatedText: string;
}

export interface ISupportedLanguage {
	language: string;
	name: string;
}
export interface ISupportedLanguages {
	[language: string]: ISupportedLanguage[];
}

export interface ITranslationResult {
	[language: string]: string;
}
