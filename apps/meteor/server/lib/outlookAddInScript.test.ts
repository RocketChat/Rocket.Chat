import { describe, it } from 'node:test';

import { expect } from 'chai';

import { buildOutlookAddInScript, sendOutlookAddInScript } from './outlookAddInScript';

const evaluate = (script: string): Record<string, string> => new Function(`${script}\nreturn STRINGS;`)() as Record<string, string>;

describe('buildOutlookAddInScript', () => {
	it('should declare the strings ahead of the code, leaving the code untouched', () => {
		const script = buildOutlookAddInScript('console.log(STRINGS.confirm);', { confirm: 'Add meeting' });

		expect(script).to.equal('\'use strict\';\nconst STRINGS = {"confirm":"Add meeting"};\nconsole.log(STRINGS.confirm);');
	});

	// The values are whatever an admin typed; none of it may end up running as code.
	it('should keep any text an admin types a plain string', () => {
		const strings = { intro: '"; alert(1); "', error: '</script><script>alert(1)</script>', added: 'line\u2028break' };

		const script = buildOutlookAddInScript('', strings);

		expect(script).to.not.include('</script>');
		expect(evaluate(script)).to.deep.equal(strings);
	});
});

describe('sendOutlookAddInScript', () => {
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

		sendOutlookAddInScript(req as any, res as any, script);

		return { ...res, headers };
	};

	it('should send the script with a tag, asking the browser to check before reusing it', () => {
		const { status, body, headers } = respond('script');

		expect(status).to.equal(200);
		expect(body).to.equal('script');
		expect(headers['Cache-Control']).to.equal('no-cache');
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
