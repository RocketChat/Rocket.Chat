// Serves a Storybook static build on a random local port for the verification scripts.
import { createReadStream, existsSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve, sep } from 'node:path';

const MIME = {
	'.html': 'text/html',
	'.js': 'text/javascript',
	'.css': 'text/css',
	'.json': 'application/json',
	'.woff2': 'font/woff2',
	'.svg': 'image/svg+xml',
};

export const serve = (dir) =>
	new Promise((ok) => {
		const root = resolve(dir);
		const server = createServer((req, res) => {
			const path = resolve(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
			if (path !== root && !path.startsWith(root + sep)) return res.writeHead(403).end();
			const file = existsSync(path) && statSync(path).isDirectory() ? join(path, 'index.html') : path;
			if (!existsSync(file)) return res.writeHead(404).end();
			res.writeHead(200, { 'content-type': MIME[extname(file)] ?? 'application/octet-stream' });
			createReadStream(file).pipe(res);
		});
		server.listen(0, '127.0.0.1', () => ok({ url: `http://127.0.0.1:${server.address().port}`, close: () => server.close() }));
	});
