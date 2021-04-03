// mock file
export class MockFile {
	create(name, size, mimeType) {
		name = name || 'mock.txt';
		size = size || 1024;
		mimeType = mimeType || 'plain/txt';

		function range(count) {
			let output = '';
			for (let i = 0; i < count; i++) {
				output += 'a';
			}
			return output;
		}

		const blob = new ArrayBuffer([range(size)], { type: mimeType });
		blob.lastModifiedDate = new Date();
		blob.name = name;

		return blob;
	}
}
