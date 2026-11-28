export const MIN_URL_EXPIRY_TIME_SPAN_SECONDS = 5;
export const URL_EXPIRY_FALLBACK_SECONDS = 900;

export const getUrlExpiryTimeSpanWithFallback = (configuredValue: number): number => {
	return configuredValue >= MIN_URL_EXPIRY_TIME_SPAN_SECONDS ? configuredValue : URL_EXPIRY_FALLBACK_SECONDS;
};
