import path from 'path';

import filenamify from 'filenamify';

export function fileName(name: string): string {
	return filenamify(name, { replacement: '-' });
}

export function joinPath(base: string, name: string): string {
	return path.join(base, fileName(name));
}
