/* globals popover */

let templateInstance;		// current template instance/context
let chartContext;			// stores context of current chart, used to clean when redrawing


function updateAnalyticsChart() {
	Meteor.call('livechat:getAnalyticsChartData', {daterange: templateInstance.daterange.get(), chartOptions: templateInstance.chartOptions.get()}, function(error, result) {
		if (error) {
			return handleError(error);
		}

		RocketChat.Livechat.Analytics.drawLineChart(document.getElementById('lc-analytics-chart'), chartContext, result.chartLabel, result.dataLabels, result.dataPoints);
	});
}

function updateAnalyticsOverview() {
	Meteor.call('livechat:getAnalyticsOverviewData', {daterange: templateInstance.daterange.get(), analyticsOptions: templateInstance.analyticsOptions.get()}, (error, result) => {
		if (error) {
			return handleError(error);
		}

		templateInstance.analyticsOverviewData.set(RocketChat.Livechat.Analytics.chunkArray(result, 3));
	});
}

Template.livechatAnalytics.helpers({
	analyticsOverviewData() {
		return templateInstance.analyticsOverviewData.get();
	},
	analyticsAllOptions() {
		return RocketChat.Livechat.Analytics.getAnalyticsAllOptions();
	},
	analyticsOptions() {
		return templateInstance.analyticsOptions.get();
	},
	daterange() {
		return templateInstance.daterange.get();
	},
	selected(value) {
		if (value === templateInstance.analyticsOptions.get().value || value === templateInstance.chartOptions.get().value) { return 'selected'; }
		return false;
	}
});


Template.livechatAnalytics.onCreated(function() {
	templateInstance = Template.instance();

	this.analyticsOverviewData = new ReactiveVar();
	this.daterange = new ReactiveVar({});
	this.analyticsOptions = new ReactiveVar(RocketChat.Livechat.Analytics.getAnalyticsAllOptions()[0]);		// default selected first
	this.chartOptions = new ReactiveVar(RocketChat.Livechat.Analytics.getAnalyticsAllOptions()[0].chartOptions[0]);		// default selected first

	this.autorun(() => {
		RocketChat.Livechat.Analytics.setDateRange(templateInstance.daterange);
	});
});

Template.livechatAnalytics.onRendered(() => {
	Tracker.autorun(() => {
		if (templateInstance.analyticsOptions.get()) {
			templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions[0]);
		}
		if (templateInstance.daterange.get() && templateInstance.analyticsOptions.get()) {
			updateAnalyticsOverview();
		}

	});

	Tracker.autorun(() => {
		if (templateInstance.daterange.get() && templateInstance.chartOptions.get()) {
			updateAnalyticsChart();
		}
	});
});

Template.livechatAnalytics.events({
	'click .lc-date-picker-btn'(e) {
		e.preventDefault();
		const options = [];
		const config = {
			template: 'livechatAnalyticsDaterange',
			currentTarget: e.currentTarget,
			data: {
				options,
				daterange: templateInstance.daterange
			},
			offsetVertical: e.currentTarget.clientHeight + 10
		};
		popover.open(config);
	},
	'click .lc-daterange-prev'(e) {
		e.preventDefault();

		RocketChat.Livechat.Analytics.updateDateRange(templateInstance.daterange, -1);
	},
	'click .lc-daterange-next'(e) {
		e.preventDefault();

		RocketChat.Livechat.Analytics.updateDateRange(templateInstance.daterange, 1);
	},
	'change #lc-analytics-options'({currentTarget}) {
		templateInstance.analyticsOptions.set(RocketChat.Livechat.Analytics.getAnalyticsAllOptions().filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);
	},
	'change #lc-analytics-chart-options'({currentTarget}) {
		templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions.filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);
	}
});
