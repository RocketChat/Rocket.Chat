Template.registerHelper('escapeCssUrl', url => {
	return url.replace(/(['"])/g, '\\$1');
});
