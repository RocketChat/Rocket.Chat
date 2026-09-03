import path from 'path';
import fs from 'fs';
import UglifyJS from 'uglify-js';

const livechatSource = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js');
const livechatTarget = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js');

try {
	const sourceCode = fs.readFileSync(livechatSource, 'utf8');
	const result = UglifyJS.minify(sourceCode, { fromString: true });
	if (result.error) {
		throw result.error;
	}
	fs.writeFileSync(livechatTarget, result.code);
} catch (e) {
	console.error('Failed to minify livechat source:', e);
	throw e;
}

const livechatDist = path.resolve('..', '..', 'packages', 'livechat', 'dist');
const livechatDir = path.resolve('public', 'livechat');
const livechatAssetsDir = path.resolve('private', 'livechat');

fs.rmSync(livechatDir, { recursive: true, force: true });
fs.mkdirSync(livechatDir, { recursive: true });
fs.rmSync(livechatAssetsDir, { recursive: true, force: true });
fs.mkdirSync(livechatAssetsDir, { recursive: true });

if (!fs.existsSync(livechatDist)) {
	throw new Error(`[rocketchat:livechat] Livechat widget dist not found at ${livechatDist}. Please build @rocket.chat/livechat first (e.g. "yarn build").`);
}

const files = fs.readdirSync(livechatDist);
const excludeMaps = (src) => !src.endsWith('.map');
for (const file of files) {
	if (file.endsWith('.map')) continue;
	const src = path.join(livechatDist, file);
	const dest = path.join(livechatDir, file);
	fs.cpSync(src, dest, { recursive: true, filter: excludeMaps });
}

const indexPath = path.join(livechatDir, 'index.html');
if (!fs.existsSync(indexPath)) {
	throw new Error(`[rocketchat:livechat] Livechat entrypoint not found at ${indexPath}.`);
}

const content = fs.readFileSync(indexPath, 'utf8').replace('<!DOCTYPE', '<!doctype');
fs.writeFileSync(indexPath, content, 'utf8');
fs.writeFileSync(path.join(livechatAssetsDir, 'index.html'), content, 'utf8');

