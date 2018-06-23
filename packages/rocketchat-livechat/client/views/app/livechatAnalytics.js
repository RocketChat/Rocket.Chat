/* globals popover */

import moment from 'moment';
import Chart from 'chart.js/src/chart.js';

Template.livechatAnalytics.onRendered(function() {
	this.$('.lc-daterange').datepicker({
		autoclose: true,
		todayHighlight: true,
		format: moment.localeData().longDateFormat('L').toLowerCase()
	});
});

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

function drawLineChart(chart, chartLabel, dataLabels, dataPoints) {
	new Chart(chart, {
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

// function fetchUpdatedViewOptions() {
//
// }

// Main function that provides complete analytics and reports
// function buildAnalytics() {
// 	const viewOptions = fetchUpdatedViewOptions();
// }

Template.livechatAnalytics.onRendered(function() {
	const ctx = document.getElementById('lc-analytics-chart');
	const chartLabel = '# of Votes';
	const dataLabels = ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'];
	const dataPoints = [12, 19, 3, 5, 2, 3, 8, 2, 6, 11, 0];
	drawLineChart(ctx, chartLabel, dataLabels, dataPoints);
});

Template.livechatAnalytics.events({
	'click .lc-date-picker-btn'(e) {
		e.preventDefault();
		//alert('pick date');
		const options = [];
		const config = {
			template: 'daterange',
			currentTarget: e.currentTarget,
			data: {
				options
			},
			offsetVertical: e.currentTarget.clientHeight + 10
		};
		popover.open(config);
	},
	'click .lc-daterange-prev'(e) {
		e.preventDefault();
		const currentRange = document.getElementsByClassName('lc-date-picker-btn')[0].value;
		console.log(currentRange);
	},
	'click .lc-daterange-next'(e) {
		e.preventDefault();
		const currentRange = document.getElementsByClassName('lc-date-picker-btn')[0].value;
		console.log(currentRange);
	}
});
