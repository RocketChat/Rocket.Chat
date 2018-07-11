export const Analytics = {
	ChartData: {
		Total_conversations(date) {
			return RocketChat.models.Rooms.getTotalConversationsBetweenDate('l', date);
		},

		First_response_time(date) {
			let frt = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.response && metrics.response.ft) {
					frt += metrics.response.ft;
					count++;
				}
			});

			const avgFrt = (count) ? frt/count : 0;
			return Math.round(avgFrt*100)/100;
		},

		Avg_response_time(date) {
			let art = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.response && metrics.response.avg) {
					art += metrics.response.avg;
					count++;
				}
			});

			const avgArt = (count) ? art/count : 0;

			return Math.round(avgArt*100)/100;
		},

		Avg_reaction_time(date) {
			let arnt = 0;
			let count = 0;
			RocketChat.models.Rooms.getAnalyticsMetricsBetweenDate('l', date).forEach(({metrics}) => {
				if (metrics && metrics.reaction && metrics.reaction.ft) {
					arnt += metrics.reaction.ft;
					count++;
				}
			});

			const avgArnt = (count) ? arnt/count : 0;

			return Math.round(avgArnt*100)/100;
		}
	},

	OverviewData: {}
};
