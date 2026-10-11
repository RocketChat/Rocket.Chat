import { glob, mkdir, readFile, rm, writeFile } from 'fs/promises';
import { dirname } from 'path';

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
