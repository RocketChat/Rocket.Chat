this.showError = (msg) => {
	$('.error').addClass('show').find('span').html(msg);
};

this.hideError = () => {
	$('.error').removeClass('show');
};
