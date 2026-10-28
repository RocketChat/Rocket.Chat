export const STATUS_TEXT_MAX_LENGTH = 120;

export function normalizeStatusText(text: string): string {
	return text.trim().substring(0, STATUS_TEXT_MAX_LENGTH);
}
