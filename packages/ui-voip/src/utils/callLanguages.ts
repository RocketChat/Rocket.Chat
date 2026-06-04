/**
 * Languages selectable per call. Used by the call-language pill in the call
 * header and broadcast over the LK data channel so the agent (and other
 * participants) converge on the same choice. The `label` is the English
 * name that gets dropped verbatim into Gemini's `systemInstruction` to
 * constrain transcription output — keep it human-readable.
 *
 * Default is en-US; en-US must remain the first entry so initial-render
 * fallbacks land on it.
 */
export type CallLanguage = {
	code: string;
	/** Short 2-letter pill label (US, BR, ES, …). Country part of the locale. */
	abbr: string;
	/** Full English name fed to Gemini's systemInstruction; also used in the dropdown. */
	label: string;
};

export const CALL_LANGUAGES: ReadonlyArray<CallLanguage> = [
	{ code: 'en-US', abbr: 'US', label: 'English (US)' },
	{ code: 'pt-BR', abbr: 'BR', label: 'Brazilian Portuguese' },
	{ code: 'es-ES', abbr: 'ES', label: 'Spanish' },
	{ code: 'fr-FR', abbr: 'FR', label: 'French' },
	{ code: 'de-DE', abbr: 'DE', label: 'German' },
	{ code: 'it-IT', abbr: 'IT', label: 'Italian' },
	{ code: 'ja-JP', abbr: 'JP', label: 'Japanese' },
	{ code: 'ko-KR', abbr: 'KR', label: 'Korean' },
	{ code: 'zh-CN', abbr: 'CN', label: 'Chinese (Simplified)' },
	{ code: 'hi-IN', abbr: 'IN', label: 'Hindi' },
];

export const DEFAULT_CALL_LANGUAGE: CallLanguage = CALL_LANGUAGES[0];

export const findCallLanguage = (code: string | undefined): CallLanguage =>
	CALL_LANGUAGES.find((l) => l.code === code) ?? DEFAULT_CALL_LANGUAGE;
