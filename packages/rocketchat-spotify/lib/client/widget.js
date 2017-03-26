Template.registerHelper('replace', function(source, find, replace, option) {
	if (option.hash.regex === true) {
		find = new RegExp(find);
	}
	return source.replace(find, replace);
});

Template.registerHelper('match', (source, regex) => new RegExp(regex).test(source));

Template.oembedBaseWidget.onCreated(function() {
	if (this.data && (this.data.meta && /^(music\.song|music\.album)$/.test(this.data.meta.ogType)) && this.data.parsedUrl && this.data.parsedUrl.host === 'open.spotify.com') {
		return this.data._overrideTemplate = 'oembedSpotifyWidget';
	}
});

