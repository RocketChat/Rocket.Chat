Template.slider.onRendered(function() {
	const params = this.data;

	const rangeSlider = function() {

		const range = $(`#${ params.id }`);
		const labelValue = $(`#${ params.id }_value`);

		labelValue.html(params.value);

		range.on('input', function() {
			labelValue.html(this.value);
		});
	};

	rangeSlider();
});
