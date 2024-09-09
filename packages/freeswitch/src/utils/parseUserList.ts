import type { StringMap } from 'esl';

export function parseUserList(commandResponse: StringMap): Record<string, string>[] {
	const { _body: text } = commandResponse;

	if (!text || typeof text !== 'string') {
		throw new Error('Invalid response from FreeSwitch server.');
	}

	const lines = text.split('\n');
	const columnsLine = lines.shift();
	if (!columnsLine) {
		throw new Error('Invalid response from FreeSwitch server.');
	}

	const columns = columnsLine.split('|');

	const users = new Map<string, Record<string, string | string[]>>();

	for (const line of lines) {
		const values = line.split('|');
		if (!values.length || !values[0]) {
			continue;
		}
		const user = Object.fromEntries(
			values.map((value, index) => {
				return [(columns.length > index && columns[index]) || `column${index}`, value];
			}),
		);

		if (!user.userid || user.userid === '+OK') {
			continue;
		}

		const { group, ...newUserData } = user;

		const existingUser = users.get(user.userid);
		const groups = (existingUser?.groups || []) as string[];

		if (group && !groups.includes(group)) {
			groups.push(group);
		}

		users.set(user.userid, {
			...(users.get(user.userid) || newUserData),
			groups,
		});
	}

	return [...users.values()].map((user) => ({
		...user,
		groups: (user.groups as string[]).join('|'),
	}));
}
