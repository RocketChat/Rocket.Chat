import { MESSAGES_NS, TYPES_NS, parseEwsDateTime, parseEwsResponse } from './parseResponse';

describe('parseEwsDateTime', () => {
	it('parses the EWS UTC format', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00Z')?.toISOString()).toBe('2026-08-21T10:00:00.000Z');
	});

	it('respects an explicit offset when one is present', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00+02:00')?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	it('takes an offset written without a colon, which Exchange also sends', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00+0200')?.toISOString()).toBe('2026-08-21T08:00:00.000Z');
	});

	/**
	 * a host already on UTC cannot tell the two readings apart. The suite pins `TZ=UTC`, so this documents
	 * the contract and catches the regression for whoever runs the file without that wrapper.
	 */
	it('reads a value with no zone as UTC, which is what the request asked for', () => {
		expect(parseEwsDateTime('2026-08-21T10:00:00')?.toISOString()).toBe('2026-08-21T10:00:00.000Z');
	});

	it.each([
		['junk', 'nonsense'],
		['an empty string', ''],
		['nothing at all', undefined],
	])('returns undefined rather than epoch for %s', (_case, value) => {
		expect(parseEwsDateTime(value)).toBeUndefined();
	});
});

describe('parseEwsResponse on a batched response', () => {
	const batch = (...messages: string[]) =>
		`<s:Envelope xmlns:s="http://schemas.xmlsoap.org/soap/envelope/" xmlns:m="${MESSAGES_NS}" xmlns:t="${TYPES_NS}">` +
		`<s:Body><m:GetItemResponse><m:ResponseMessages>${messages.join('')}</m:ResponseMessages></m:GetItemResponse></s:Body>` +
		'</s:Envelope>';

	const itemNotFound =
		'<m:GetItemResponseMessage ResponseClass="Error"><m:MessageText>The specified object was not found in the store.</m:MessageText>' +
		'<m:ResponseCode>ErrorItemNotFound</m:ResponseCode></m:GetItemResponseMessage>';

	const serverBusy = (backOffMs?: number) => {
		const messageXml =
			backOffMs === undefined ? '' : `<m:MessageXml><t:Value Name="BackOffMilliseconds">${backOffMs}</t:Value></m:MessageXml>`;

		return (
			'<m:GetItemResponseMessage ResponseClass="Error"><m:MessageText>The server cannot service this request right now.</m:MessageText>' +
			`<m:ResponseCode>ErrorServerBusy</m:ResponseCode>${messageXml}</m:GetItemResponseMessage>`
		);
	};

	const errorFrom = (xml: string): unknown => {
		try {
			parseEwsResponse(xml);
		} catch (err) {
			return err;
		}
		throw new Error('expected the response to be rejected');
	};

	it('reports the message that failed, not the first one in the batch', () => {
		expect(errorFrom(batch(itemNotFound, serverBusy(2000)))).toMatchObject({
			code: 'rate-limited',
			detail: 'The server cannot service this request right now.',
			retryAfterMs: 2000,
		});
	});

	it('takes the back-off only from the message that failed', () => {
		expect(errorFrom(batch(serverBusy(), serverBusy(300000)))).toMatchObject({ code: 'rate-limited', retryAfterMs: undefined });
	});

	const internalError = (innerCode: string, backOffMs?: number) => {
		const backOff = backOffMs === undefined ? '' : `<t:Value Name="BackOffMilliseconds">${backOffMs}</t:Value>`;

		return (
			'<m:GetItemResponseMessage ResponseClass="Error"><m:MessageText>An internal server error occurred.</m:MessageText>' +
			'<m:ResponseCode>ErrorInternalServerError</m:ResponseCode>' +
			`<m:MessageXml><t:Value Name="InnerErrorResponseCode">${innerCode}</t:Value>${backOff}</m:MessageXml></m:GetItemResponseMessage>`
		);
	};

	it('treats an internal error wrapping ErrorServerBusy as throttling', () => {
		expect(errorFrom(batch(internalError('ErrorServerBusy', 2000)))).toMatchObject({ code: 'rate-limited', retryAfterMs: 2000 });
	});

	it('leaves an internal error wrapping anything else as unexpected', () => {
		expect(errorFrom(batch(internalError('ErrorQuotaExceeded')))).toMatchObject({ code: 'unexpected-response' });
	});
});
