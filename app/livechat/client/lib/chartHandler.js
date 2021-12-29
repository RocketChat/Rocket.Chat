import { TAPi18n } from 'meteor/rocketchat:tap-i18n';

const lineChartConfiguration = ({ legends = false, anim = false, smallTicks = false, displayColors = false, tooltipCallbacks = {} }) => {
	const config = {
		layout: {
			padding: {
				top: 10,
				bottom: 0,
			},
		},
		legend: {
			display: false,
		},
		title: {
			display: false,
		},
		tooltips: {
			enabled: true,
			mode: 'point',
			displayColors,
			...tooltipCallbacks,
		},
		scales: {
			xAxes: [
				{
					scaleLabel: {
						display: false,
					},
					gridLines: {
						display: true,
						color: 'rgba(0, 0, 0, 0.03)',
					},
				},
			],
			yAxes: [
				{
					scaleLabel: {
						display: false,
					},
					gridLines: {
						display: true,
						color: 'rgba(0, 0, 0, 0.03)',
					},
					ticks: {
						beginAtZero: true,
					},
				},
			],
		},
		hover: {
			animationDuration: 0, // duration of animations when hovering an item
		},
		responsive: true,
		maintainAspectRatio: false,
		responsiveAnimationDuration: 0, // animation duration after a resize
	};

	if (!anim) {
		config.animation = {
			duration: 0, // general animation time
		};
	}

	if (legends) {
		config.legend = {
			display: true,
			labels: {
				boxWidth: 20,
				fontSize: 8,
			},
		};
	}

	if (smallTicks) {
		config.scales.xAxes[0].ticks = {
			fontSize: 8,
		};

		config.scales.yAxes[0].ticks = {
			beginAtZero: true,
			fontSize: 8,
		};
	}

	return config;
};

const doughnutChartConfiguration = (title, tooltipCallbacks = {}) => ({
	layout: {
		padding: {
			top: 0,
			bottom: 0,
		},
	},
	legend: {
		display: true,
		position: 'right',
		labels: {
			boxWidth: 20,
			fontSize: 8,
		},
	},
	title: {
		display: 'true',
		text: title,
	},
	tooltips: {
		enabled: true,
		mode: 'point',
		displayColors: false, // hide color box
		...tooltipCallbacks,
	},
	// animation: {
	// 	duration: 0 // general animation time
	// },
	hover: {
		animationDuration: 0, // duration of animations when hovering an item
	},
	responsive: true,
	maintainAspectRatio: false,
	responsiveAnimationDuration: 0, // animation duration after a resize
});

/**
 *
 * @param {Object} chart - chart element
 * @param {Object} chartContext - Context of chart
 * @param {Array(String)} chartLabel
 * @param {Array(String)} dataLabels
 * @param {Array(Array(Double))} dataPoints
 */
export const drawLineChart = async (chart, chartContext, chartLabels, dataLabels, dataSets, options = {}) => {
	if (!chart) {
		console.log('No chart element');
		return;
	}
	if (chartContext) {
		chartContext.destroy();
	}
	const colors = ['#2de0a5', '#ffd21f', '#f5455c', '#cbced1'];

	const datasets = [];

	chartLabels.forEach(function (chartLabel, index) {
		datasets.push({
			label: TAPi18n.__(chartLabel), // chart label
			data: dataSets[index], // data points corresponding to data labels, x-axis points
			backgroundColor: [colors[index]],
			borderColor: [colors[index]],
			borderWidth: 3,
			fill: false,
		});
	});
	const chartImport = await import('chart.js');
	const Chart = chartImport.default;
	return new Chart(chart, {
		type: 'line',
		data: {
			labels: dataLabels, // data labels, y-axis points
			datasets,
		},
		options: lineChartConfiguration(options),
	});
};

/**
 *
 * @param {Object} chart - chart element
 * @param {Object} chartContext - Context of chart
 * @param {Array(String)} dataLabels
 * @param {Array(Double)} dataPoints
 */
export const drawDoughnutChart = async (chart, title, chartContext, dataLabels, dataPoints) => {
	if (!chart) {
		return;
	}
	if (chartContext) {
		chartContext.destroy();
	}
	const chartImport = await import('chart.js');
	const Chart = chartImport.default;
	return new Chart(chart, {
		type: 'doughnut',
		data: {
			labels: dataLabels, // data labels, y-axis points
			datasets: [
				{
					data: dataPoints, // data points corresponding to data labels, x-axis points
					backgroundColor: ['#2de0a5', '#cbced1', '#f5455c', '#ffd21f'],
					borderWidth: 0,
				},
			],
		},
		options: doughnutChartConfiguration(title),
	});
};

/**
 * Update chart
 * @param  {Object} chart [Chart context]
 * @param  {String} label [chart label]
 * @param  {Array(Double)} data  [updated data]
 */
export const updateChart = async (c, label, data) => {
	const chart = await c;
	if (chart.data.labels.indexOf(label) === -1) {
		// insert data
		chart.data.labels.push(label);
		chart.data.datasets.forEach((dataset, idx) => {
			dataset.data.push(data[idx]);
		});
	} else {
		// update data
		const index = chart.data.labels.indexOf(label);
		chart.data.datasets.forEach((dataset, idx) => {
			dataset.data[index] = data[idx];
		});
	}

	chart.update();
};
