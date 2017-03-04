/**
 * Generic helper for all containers displaying results
 * Might serve as superclass
 */
class redlinkResultContainerHelpers {
	visibleResults() {
		const instance = Template.instance();
		const results = instance.data.results;
		const stepping = instance.data.stepping;
		const totalLength = results.length;

		let offset = instance.state.get('currentOffset');
		if(offset >= totalLength){
			//start over immediately
			offset = 0;
			offset = instance.state.set('currentOffset', 0);
		}
		let lastElement = totalLength - 1;
		if (stepping) {
			lastElement = offset + stepping;
		}
		return results.slice(offset, lastElement);
	}

	visiblePage() {
		const instance = Template.instance();
		const results = instance.data.results;
		const totalLength = results.length;
		const offset = instance.state.get('currentOffset');
		const stepping = instance.data.stepping;

		return Math.ceil((offset/(totalLength))*(totalLength/stepping)) + 1
	}

	totalPages() {
		const instance = Template.instance();
		const results = instance.data.results;
		const stepping = instance.data.stepping;

		return Math.ceil(results.length/stepping)
	}

	resultsCount(){
		const instance = Template.instance();
		const results = instance.data.results;
		if (results) return results.length;
	}

	needsNavigation(){
		const instance = Template.instance();
		const results = instance.data.results;
		const stepping = instance.data.stepping;

		return (stepping < results.length);
	}
}

//----------------------------------- Slider ---------------------------------------

Template.redlinkResultContainer_Slider.helpers(new redlinkResultContainerHelpers());

Template.redlinkResultContainer_Slider.events({

	'click .js-next-result': function (event, instance) {
		const currentOffset = instance.state.get('currentOffset');
		if (currentOffset < instance.data.results.length - 1) {
			instance.state.set('currentOffset', currentOffset + instance.data.stepping);
		} else {
			instance.state.set('currentOffset', 0);
		}
	},

	'click .js-previous-result': function (event, instance) {
		const currentOffset = instance.state.get('currentOffset');
		if (currentOffset > 0) {
			if (currentOffset >= instance.data.stepping) {
				instance.state.set('currentOffset', currentOffset - instance.data.stepping);
			} else {
				instance.state.set('currentOffset', 0);
			}
		} else {
			instance.state.set('currentOffset', instance.data.results.length - 1);
		}
	}
});

Template.redlinkResultContainer_Slider.onCreated(function () {
	const instance = this;
	this.state = new ReactiveDict();

	this.state.setDefault({
		currentOffset: 0
	});
});
