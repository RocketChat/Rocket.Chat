import type { PluginOption } from 'vite';

const __dirname = new URL('.', import.meta.url).pathname;

export default function nginxPlugin(): PluginOption {
	return {
		name: 'nginx:config',
		apply: 'build',
		async generateBundle() {
			const fileName = 'nginx.conf';
			const code = await this.fs.readFile(`${__dirname}/${fileName}`, { encoding: 'utf8' });
			this.emitFile({
				type: 'prebuilt-chunk',
				fileName,
				code,
			});
		},
	};
}
