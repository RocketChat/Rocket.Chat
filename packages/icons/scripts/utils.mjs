import { glob, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname } from 'path';

import { ESLint } from 'eslint';

export const encodeJson = (data) =>
	JSON.stringify(data, null, 2).replace(/[\u007f-￿]/g, (c) => `\\u${`0000${c.charCodeAt(0).toString(16)}`.slice(-4)}`);

export const writeBinary = (path) => async (buffer) => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, buffer);
	return buffer;
};

export const readSource = (path) => readFile(path, { encoding: 'utf-8' });

export const writeSource = (path) => async (source) => {
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, source, { encoding: 'utf-8' });
	return source;
};

export const readJson = (path) => readSource(path).then(JSON.parse);

export const writeJson = (path) => async (data) => {
	await writeSource(path)(encodeJson(data));
	return data;
};

export const removeFile = (path) => rm(path, { recursive: true, force: true });

export const listFiles = (pattern) => Array.fromAsync(glob(pattern));

export const runEslint = (path) => async (source) => {
	const eslint = new ESLint({ fix: true });
	const results = await eslint.lintText(source, {
		filePath: path,
		warnIgnored: true,
	});

	const formatter = await eslint.loadFormatter('stylish');
	const resultText = await formatter.format(results);

	if (results.some((result) => result.fatalErrorCount > 0)) {
		throw new Error(resultText);
	}

	console.log(resultText);

	const [result] = results;

	return result.output ?? source;
};
