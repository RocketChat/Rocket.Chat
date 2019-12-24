export const downloadJsonAsAFile = (jsonData, name = 'jsonfile') => {
	const filename = `${ name }.json`;
	const contentType = 'application/json;charset=utf-8;';
	if (window.navigator && window.navigator.msSaveOrOpenBlob) {
		const blob = new Blob([decodeURIComponent(encodeURI(JSON.stringify(jsonData)))], { type: contentType });
		return navigator.msSaveOrOpenBlob(blob, filename);
	}
	const aElement = document.createElement('a');
	aElement.download = filename;
	aElement.href = `data:${ contentType },${ encodeURIComponent(JSON.stringify(jsonData)) }`;
	aElement.target = '_blank';
	document.body.appendChild(aElement);
	aElement.click();
	document.body.removeChild(aElement);
};
