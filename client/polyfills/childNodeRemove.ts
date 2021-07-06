(function (arr): void {
	arr.forEach((item) => {
		if (item.hasOwnProperty('remove')) {
			return;
		}

		Object.defineProperty(item, 'remove', {
			configurable: true,
			enumerable: true,
			writable: true,
			value: function remove() {
				this.parentNode.removeChild(this);
			},
		});
	});
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);
