import { afterEach, beforeEach, describe, it } from 'node:test';

import { mockAppRoot } from '@rocket.chat/mock-providers';
import { render } from '@testing-library/react';
import { expect } from 'expect';
import { fn } from 'jest-mock';
import type { FunctionLike } from 'jest-mock';
import proxyquire from 'proxyquire';

const handleOpenCall = fn<FunctionLike>();

const { default: ConferencePage } = proxyquire.noCallThru().load<typeof import('./ConferencePage')>('./ConferencePage', {
	'../room/contextualBar/VideoConference/hooks/useVideoConfOpenCall': {
		useVideoConfOpenCall: () => handleOpenCall,
	},
});

const renderAt = (search: string) => {
	window.history.replaceState({}, '', `/conference${search}`);

	return render(<ConferencePage />, { wrapper: mockAppRoot().withJohnDoe().build() });
};

describe('ConferencePage', () => {
	beforeEach(() => {
		handleOpenCall.mockClear();
	});

	afterEach(() => {
		window.history.replaceState({}, '', '/');
	});

	// The address comes from whoever wrote the link, and this page opens it.
	it('opens the call the link names', () => {
		renderAt('?callUrl=https%3A%2F%2Fmeet.example%2Froom-1');

		expect(handleOpenCall).toHaveBeenCalledWith(expect.stringContaining('https://meet.example/room-1'));
	});

	[
		['javascript:alert(1)', 'a script'],
		['data:text/html,<script>alert(1)</script>', 'a document'],
		['vbscript:msgbox(1)', 'a script'],
		['/admin/settings', 'a page of our own'],
		['//evil.example/x', 'a protocol-relative address'],
	].forEach(([candidate]) => {
		it(`opens nothing for ${candidate}, being %s rather than a call`, () => {
			renderAt(`?callUrl=${encodeURIComponent(candidate)}`);

			expect(handleOpenCall).not.toHaveBeenCalled();
		});
	});
});
