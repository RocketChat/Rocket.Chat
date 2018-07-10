/* globals popover */

import moment from 'moment';
import Chart from 'chart.js/src/chart.js';

let templateInstance;		// current template instance/context
let chartContext;			// stores context of current chart, used to clean when redrawing

const chartConfiguration = {
	layout: {
		padding: {
			top: 10
		}
	},
	legend: {
		display: false
	},
	title: {
		display: false
	},
	tooltips: {
		enabled: true,
		mode: 'point',
		displayColors: false			// hide color box
	},
	scales: {
		xAxes: [{
			scaleLabel:{
				display: false
			},
			gridLines: {
				display: true,
				color: 'rgba(0, 0, 0, 0.03)'
			}
		}],
		yAxes: [{
			scaleLabel:{
				display: false
			},
			gridLines: {
				display: true,
				color: 'rgba(0, 0, 0, 0.03)'
			},
			ticks: {
				beginAtZero: true
			}
		}]
	},
	animation: {
		duration: 0 // general animation time
	},
	hover: {
		animationDuration: 0 // duration of animations when hovering an item
	},
	responsive: true,
	responsiveAnimationDuration: 0 // animation duration after a resize
};

// analytics all options and their associated chart/overview options
const analyticsAllOptions = [{
	name: 'Conversations',
	value: 'conversations',
	chartOptions: [{
		name: 'Total_conversations',
		value: 'total-conversations'
	}],
	analyticsOverviewOptions: [[{
		title: 'Total_conversations'
	}, {
		title: 'Open_conversations'
	}], [{
		title: 'Total_messages'
	}, {
		title: 'Busiest_day'
	}], [{
		title: 'Conversations_per_day'
	}, {
		title: 'Busiest_time'
	}]]
}, {
	name: 'Productivity',
	value: 'productivity',
	chartOptions: [{
		name: 'First_response_time',
		value: 'first-response-time'
	}, {
		name: 'Avg_response_time',
		value: 'avg-response-time'
	}, {
		name: 'Avg_reaction_time',
		value: 'avg-reaction-time'
	}],
	analyticsOverviewOptions: [[{
		title: 'Avg_response_time'
	}], [{
		title: 'First_response_time'
	}], [{
		title: 'Avg_reaction_time'
	}]]
}];

function drawLineChart(chartLabel, dataLabels, dataPoints) {
	const chart = document.getElementById('lc-analytics-chart');

	if (chartContext) {
		chartContext.destroy();
	}

	chartContext = new Chart(chart, {
		type: 'line',
		data: {
			labels: dataLabels,		// data labels, y-axis points
			datasets: [{
				label: chartLabel,	// chart label
				data: dataPoints,		// data points corresponding to data labels, x-axis points
				backgroundColor: [
					'rgba(255, 99, 132, 0.2)'
				],
				borderColor: [
					'rgba(255,99,132,1)'
				],
				borderWidth: 2,
				fill: false
			}]
		},
		options: chartConfiguration
	});
}

function updateAnalyticsChart() {
	Meteor.call('livechat:getAnalyticsChartData', {daterange: templateInstance.daterange.get(), chartOptions: templateInstance.chartOptions.get()}, function(error, result) {
		if (error) {
			return handleError(error);
		}

		drawLineChart(result.chartLabel, result.dataLabels, result.dataPoints);
	});
}

function updateAnalyticsOverview() {
	Meteor.call('livechat:getAnalyticsOverviewData', {daterange: templateInstance.daterange.get(), analyticsOptions: templateInstance.analyticsOptions.get()}, (error, result) => {
		if (error) {
			return handleError(error);
		}

		templateInstance.analyticsOverviewData.set(result);
	});
}

function setDateRange(value, from, to) {
	if (value && from && to) {
		templateInstance.daterange.set({value, from, to});
	} else {
		templateInstance.daterange.set({
			value: 'this-week',
			from: moment().startOf('week').format('MMM D YYYY'),
			to: moment().endOf('week').format('MMM D YYYY')
		});
	}
}

function updateDateRange(order) {
	const currentDaterange = templateInstance.daterange.get();

	switch (currentDaterange.value) {
		case 'this-week':
		case 'prev-week':
			if (order === 1) {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).add(1, 'weeks').startOf('week').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).add(1, 'weeks').endOf('week').format('MMM D YYYY'));
			} else {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).subtract(1, 'weeks').startOf('week').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).subtract(1, 'weeks').endOf('week').format('MMM D YYYY'));
			}
			break;
		case 'this-month':
		case 'prev-month':
			if (order === 1) {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).add(1, 'months').startOf('month').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).add(1, 'months').endOf('month').format('MMM D YYYY'));
			} else {
				setDateRange(currentDaterange.value,
					moment(new Date(currentDaterange.from)).subtract(1, 'months').startOf('month').format('MMM D YYYY'),
					moment(new Date(currentDaterange.to)).subtract(1, 'months').endOf('month').format('MMM D YYYY'));
			}
			break;
		case 'custom':
			handleError({details: {errorTitle: 'Navigation_didnot_work'}, error: 'You_have_selected_custom_dates'});
	}
}

Template.livechatAnalytics.helpers({
	analyticsOverviewData() {
		return templateInstance.analyticsOverviewData.get();
	},
	analyticsAllOptions() {
		return analyticsAllOptions;
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
	this.analyticsOptions = new ReactiveVar(analyticsAllOptions[0]);		// default selected first
	this.chartOptions = new ReactiveVar(analyticsAllOptions[0].chartOptions[0]);		// default selected first

	this.autorun(() => {
		setDateRange();
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

		updateDateRange(-1);
	},
	'click .lc-daterange-next'(e) {
		e.preventDefault();

		updateDateRange(1);
	},
	'change #lc-analytics-options'({currentTarget}) {
		templateInstance.analyticsOptions.set(analyticsAllOptions.filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);
	},
	'change #lc-analytics-chart-options'({currentTarget}) {
		templateInstance.chartOptions.set(templateInstance.analyticsOptions.get().chartOptions.filter(function(obj) {
			return obj.value === currentTarget.value;
		})[0]);
	}
});
