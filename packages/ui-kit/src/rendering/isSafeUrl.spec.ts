import { isSafeUrl } from './isSafeUrl';

it.each(['https://rocket.chat', 'http://localhost:3000/path?q=1', 'mailto:someone@rocket.chat', 'tel:+5511999999999', '/admin/apps'])(
	'accepts %s',
	(url) => {
		expect(isSafeUrl(url)).toBe(true);
	},
);

it.each([
	'javascript:alert(1)',
	'JaVaScRiPt:alert(1)',
	' javascript:alert(1)',
	'\tjavascript:alert(1)',
	'data:text/html,<script>alert(1)</script>',
	'vbscript:msgbox(1)',
	'//evil.example',
	'/\\evil.example',
	'rocket.chat',
	'',
])('rejects %j', (url) => {
	expect(isSafeUrl(url)).toBe(false);
});
