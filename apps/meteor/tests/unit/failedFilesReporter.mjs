// Lists the files with a failing test, one per line
export default async function* failedFiles(source) {
	const files = new Set();
	for await (const { type, data } of source) {
		if (type === 'test:fail' && data.file) {
			files.add(data.file);
		}
	}
	yield [...files].join('\n');
}
