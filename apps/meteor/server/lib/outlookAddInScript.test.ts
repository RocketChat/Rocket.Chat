import { describe, it } from 'node:test';

import { expect } from 'chai';

import { buildOutlookAddInScript, sendOutlookAddInFile } from './outlookAddInScript';

describe('buildOutlookAddInScript', () => {
	const run = (script: string): unknown => new Function(`return ${script}`)();

	it('should hand the strings to the library and run it strictly', () => {
		const script = buildOutlookAddInScript('return { confirm: STRINGS.confirm, strict: this === undefined };', { confirm: 'Add meeting' });

		expect(run(script)).to.deep.equal({ confirm: 'Add meeting', strict: true });
	});

	// The behavior script is the workspace's to write; the library must not take any name it might want.
	it('should leak nothing it declares into the page', () => {
		const script = buildOutlookAddInScript('const API = 1; var helper = 2;', {});

		new Function(script)();

		expect(globalThis).to.not.have.property('helper');
		expect(globalThis).to.not.have.property('STRINGS');
	});

	// The values are whatever an admin typed; none of it may end up running as code.
	it('should keep any text an admin types a plain string', () => {
		const strings = { intro: '"; alert(1); "', error: '</script><script>alert(1)</script>', added: 'line\u2028break' };

		const script = buildOutlookAddInScript('return STRINGS;', strings);

		expect(script).to.not.include('</script>');
		expect(run(script)).to.deep.equal(strings);
	});
});

describe('sendOutlookAddInFile', () => {
	const respond = (script: string, ifNoneMatch?: string) => {
		const headers: Record<string, string> = {};
		const res = {
			status: 0,
			body: undefined as string | undefined,
			setHeader: (name: string, value: string) => {
				headers[name] = value;
			},
			writeHead(status: number) {
				this.status = status;
			},
			end(body?: string) {
				this.body = body;
			},
		};
		const req = { headers: ifNoneMatch ? { 'if-none-match': ifNoneMatch } : {} };

		sendOutlookAddInFile(req as any, res as any, script, 'application/javascript');

		return { ...res, headers };
	};

	it('should send the script with a tag, asking the browser to check before reusing it', () => {
		const { status, body, headers } = respond('script');

		expect(status).to.equal(200);
		expect(body).to.equal('script');
		expect(headers['Cache-Control']).to.equal('no-cache');
		expect(headers['Content-Type']).to.equal('application/javascript; charset=utf-8');
		expect(headers.ETag).to.match(/^".+"$/);
	});

	it('should answer an unchanged script with a bare 304', () => {
		const { headers } = respond('script');

		const { status, body } = respond('script', headers.ETag);

		expect(status).to.equal(304);
		expect(body).to.be.undefined;
	});

	// A changed setting changes the script, so the tag the browser holds no longer matches.
	it('should send the whole script again once it changed', () => {
		const { headers } = respond('const STRINGS = {"confirm":"Add meeting"};');

		const { status, body } = respond('const STRINGS = {"confirm":"Book it"};', headers.ETag);

		expect(status).to.equal(200);
		expect(body).to.equal('const STRINGS = {"confirm":"Book it"};');
	});
});
