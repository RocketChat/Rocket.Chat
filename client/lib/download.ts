export const download = (href: string, filename: string): void => {
	const anchorElement = document.createElement('a');
	anchorElement.download = filename;
	anchorElement.href = href;
	anchorElement.target = '_blank';
	document.body.appendChild(anchorElement);
	anchorElement.click();
	document.body.removeChild(anchorElement);
};

export const downloadAs = ({ data, ...options }: { data: BlobPart[] } & BlobPropertyBag, filename: string): void => {
	const blob = new Blob(data, options);

	if (navigator.msSaveOrOpenBlob) {
		navigator.msSaveOrOpenBlob(blob);
		return;
	}

	const URL = window.webkitURL ?? window.URL;
	const blobUrl = URL.createObjectURL(blob);

	download(blobUrl, filename);

	URL.revokeObjectURL(blobUrl);
};

export const downloadJsonAs = (jsonObject: unknown, basename: string): void => {
	downloadAs(
		{
			data: [decodeURIComponent(encodeURI(JSON.stringify(jsonObject, null, 2)))],
			type: 'application/json;charset=utf-8',
		},
		`${basename}.json`,
	);
};

export const downloadCsvAs = (csvData: readonly (readonly unknown[])[], basename: string): void => {
	const escapeCell = (cell: unknown): string => `"${String(cell).replace(/"/g, '""')}"`;
	const content = csvData.reduce((content, row) => `${content + row.map(escapeCell).join(';')}\n`, '');

	downloadAs(
		{
			data: [decodeURIComponent(encodeURI(content))],
			type: 'text/csv;charset=utf-8',
			endings: 'native',
		},
		`${basename}.csv`,
	);
};
