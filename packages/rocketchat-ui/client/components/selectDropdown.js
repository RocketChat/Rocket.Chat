Template.selectDropdown.events({
	'focus input'(e, i) {
		i.open.set(true);
		console.log('asdasd');
	}, 'blur input'(e, i) {
		setTimeout(()=>{
			i.open.set(false);

		}, 100);
		console.log('asdasd');
	}
});
Template.selectDropdown.helpers({
	open() {
		return Template.instance().open.get();
	}
});
Template.selectDropdown.onCreated(function() {
	this.open = new ReactiveVar(false);
});
