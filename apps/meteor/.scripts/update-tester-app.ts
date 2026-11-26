import { writeFile } from 'node:fs/promises';

const repo = 'https://raw.githubusercontent.com/RocketChat/Apps.RocketChat.Tester/master';
const output = 'tests/data/apps/app-packages/appsrocketchattester.zip';

async function fetchOk(url: string): Promise<Response> {
	const res = await fetch(url);
	if (!res.ok) {
		throw new Error(`${url}: ${res.status} ${res.statusText}`);
	}
	return res;
}

async function main(): Promise<void> {
	const { version } = (await (await fetchOk(`${repo}/app.json`)).json()) as { version: string };
	const zip = await fetchOk(`${repo}/dist/appsrocketchattester_${version}.zip`);
	await writeFile(output, Buffer.from(await zip.arrayBuffer()));
	console.log(`Saved Apps.RocketChat.Tester ${version} to ${output}`);
}

void main().catch((err) => {
	console.error(err);
	process.exit(1);
});
