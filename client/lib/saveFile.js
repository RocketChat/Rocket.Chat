export const saveFile = (content, name = 'download') => {
	const blob = new Blob([content], { type: 'text/plain' });
	const anchor = document.createElement('a');

	anchor.download = name;
	anchor.href = (window.webkitURL || window.URL).createObjectURL(blob);
	anchor.dataset.downloadurl = ['text/plain', anchor.download, anchor.href].join(':');
	anchor.click();
};
