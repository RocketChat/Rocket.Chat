import path from 'path';
import fs from 'fs';
import UglifyJS from 'uglify-js';

const livechatSource = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocket-livechat.js');
const livechatTarget = path.resolve('packages', 'rocketchat-livechat', 'assets', 'rocketchat-livechat.min.js');

try {
	fs.writeFileSync(livechatTarget, UglifyJS.minify(livechatSource).code);
} catch (e) {
	console.error('Failed to minify livechat source:', e);
}

const livechatDist = path.resolve('..', '..', 'packages', 'livechat', 'dist');
const livechatDir = path.resolve('public', 'livechat');
const livechatAssetsDir = path.resolve('private', 'livechat');

if (fs.existsSync(livechatDist)) {
	fs.rmSync(livechatDir, { recursive: true, force: true });
	fs.mkdirSync(livechatDir, { recursive: true });

	fs.rmSync(livechatAssetsDir, { recursive: true, force: true });
	fs.mkdirSync(livechatAssetsDir, { recursive: true });

	const files = fs.readdirSync(livechatDist);
	for (const file of files) {
		if (file.endsWith('.map')) continue;
		const src = path.join(livechatDist, file);
		const dest = path.join(livechatDir, file);
		fs.cpSync(src, dest, { recursive: true });
	}

	const indexPath = path.join(livechatDir, 'index.html');
	if (fs.existsSync(indexPath)) {
		const content = fs.readFileSync(indexPath, 'utf8').replace('<!DOCTYPE', '<!doctype');
		fs.writeFileSync(indexPath, content, 'utf8');
		fs.writeFileSync(path.join(livechatAssetsDir, 'index.html'), content, 'utf8');
	}
}

