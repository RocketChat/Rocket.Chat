import type { IUpload, IUser } from '@rocket.chat/core-typings';
import { Users } from '@rocket.chat/models';

const isString = (value: unknown): value is string => typeof value === 'string';

const stripUrlOrigin = (href?: string): string | undefined => {
	if (!href) {
		return href;
	}

	const value = href.trim();
	if (!/^https?:\/\//i.test(value) && !value.startsWith('//')) {
		return value;
	}

	try {
		const parsed = new URL(value.startsWith('//') ? `http:${value}` : value);
		const relative = `${parsed.pathname}${parsed.search}${parsed.hash}`;
		return relative || '/';
	} catch {
		return undefined;
	}
};

export async function addUserToFileObj(files: IUpload[]): Promise<(IUpload & { user?: Pick<IUser, '_id' | 'name' | 'username'> })[]> {
	const uids = files.map(({ userId }) => userId).filter(isString);

	const users = await Users.findByIds(uids, { projection: { name: 1, username: 1 } }).toArray();

	return files.map((file) => {
		const user = users.find(({ _id: userId }) => file.userId && userId === file.userId);

		const sanitizedUrl = stripUrlOrigin(file.url);
		const sanitizedPath = stripUrlOrigin(file.path);
		const normalizedPath = sanitizedPath ?? sanitizedUrl;
		const normalizedUrl = sanitizedUrl ?? sanitizedPath;

		return {
			...file,
			user,
			path: normalizedPath ?? undefined,
			url: normalizedUrl ?? undefined,
			...(user && { user }),
		};
	});
}
