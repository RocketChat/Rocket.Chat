import { expect } from 'chai';
import { describe, it } from 'mocha';

import { MIN_URL_EXPIRY_TIME_SPAN_SECONDS, URL_EXPIRY_FALLBACK_SECONDS, getUrlExpiryTimeSpanWithFallback } from './urlExpiry';

describe('getUrlExpiryTimeSpanWithFallback', () => {
	it('uses fallback when configured value is below minimum', () => {
		expect(getUrlExpiryTimeSpanWithFallback(0)).to.equal(URL_EXPIRY_FALLBACK_SECONDS);
		expect(getUrlExpiryTimeSpanWithFallback(3)).to.equal(URL_EXPIRY_FALLBACK_SECONDS);
	});

	it('uses configured value when at or above minimum', () => {
		expect(getUrlExpiryTimeSpanWithFallback(MIN_URL_EXPIRY_TIME_SPAN_SECONDS)).to.equal(MIN_URL_EXPIRY_TIME_SPAN_SECONDS);
		expect(getUrlExpiryTimeSpanWithFallback(300)).to.equal(300);
	});
});
