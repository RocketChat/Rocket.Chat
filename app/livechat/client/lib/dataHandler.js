import moment from 'moment';

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateResponseTimings = (dbCursor) => {
	let art = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.response && metrics.response.avg) {
			art += metrics.response.avg;
			count++;
		}
		if (metrics && metrics.response && metrics.response.ft) {
			longest = Math.max(longest, metrics.response.ft);
		}
	});

	const avgArt = count ? art / count : 0;

	return {
		avg: Math.round(avgArt * 100) / 100,
		longest,
	};
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateReactionTimings = (dbCursor) => {
	let arnt = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.reaction && metrics.reaction.ft) {
			arnt += metrics.reaction.ft;
			longest = Math.max(longest, metrics.reaction.ft);
			count++;
		}
	});

	const avgArnt = count ? arnt / count : 0;

	return {
		avg: Math.round(avgArnt * 100) / 100,
		longest,
	};
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
const calculateDurationData = (dbCursor) => {
	let total = 0;
	let longest = 0;
	let count = 0;

	dbCursor.forEach(({ metrics }) => {
		if (metrics && metrics.chatDuration) {
			total += metrics.chatDuration;
			longest = Math.max(longest, metrics.chatDuration);
			count++;
		}
	});

	const avgCD = count ? total / count : 0;

	return {
		avg: Math.round(avgCD * 100) / 100,
		longest,
	};
};

/**
 * return readable time format from seconds
 * @param  {Double} sec seconds
 * @return {String}     Readable string format
 */
const secondsToHHMMSS = (sec) => {
	sec = parseFloat(sec);

	let hours = Math.floor(sec / 3600);
	let minutes = Math.floor((sec - (hours * 3600)) / 60);
	let seconds = Math.round(sec - (hours * 3600) - (minutes * 60));

	if (hours < 10) { hours = `0${ hours }`; }
	if (minutes < 10) { minutes = `0${ minutes }`; }
	if (seconds < 10) { seconds = `0${ seconds }`; }

	if (hours > 0) {
		return `${ hours }:${ minutes }:${ seconds }`;
	}
	if (minutes > 0) {
		return `${ minutes }:${ seconds }`;
	}
	return sec;
};


/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
export const getTimingsChartData = (dbCursor) => {
	const data = {};

	data.reaction = calculateReactionTimings(dbCursor);
	data.response = calculateResponseTimings(dbCursor);
	data.chatDuration = calculateDurationData(dbCursor);

	return data;
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Object}
 */
export const getAgentStatusData = (dbCursor) => {
	const data = {
		offline: 0,
		available: 0,
		away: 0,
		busy: 0,
	};

	dbCursor.forEach((doc) => {
		if (doc.status === 'offline' || doc.status === 'away' || doc.status === 'busy') {
			data[doc.status]++;
		} else if (doc.status === 'online' && doc.statusLivechat === 'available') {
			data[doc.statusLivechat]++;
		} else {
			data.offline++;
		}
	});

	return data;
};

/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Array(Object)}
 */
export const getConversationsOverviewData = (dbCursor) => {
	let total = 0;
	let totalMessages = 0;

	dbCursor.forEach(function(doc) {
		total++;
		if (doc.msgs) {
			totalMessages += doc.msgs;
		}
	});

	return [{
		title: 'Total_conversations',
		value: total || 0,
	}, {
		title: 'Total_messages',
		value: totalMessages || 0,
	}];
};


/**
 *
 * @param  {Object} dbCursor cursor to minimongo result
 * @return {Array(Object)}
 */
export const getTimingsOverviewData = (dbCursor) => {
	let total = 0;
	let totalResponseTime = 0;
	let totalReactionTime = 0;

	dbCursor.forEach(function(doc) {
		total++;
		if (doc.metrics && doc.metrics.response) {
			totalResponseTime += doc.metrics.response.avg;
			totalReactionTime += doc.metrics.reaction.ft;
		}
	});

	return [{
		title: 'Avg_reaction_time',
		value: total ? secondsToHHMMSS((totalReactionTime / total).toFixed(2)) : '-',
	}, {
		title: 'Avg_response_time',
		value: total ? secondsToHHMMSS((totalResponseTime / total).toFixed(2)) : '-',
	}];
};

const convertTimeAvg = (duration) => {
	let hours = Number(duration.get('h'));
	let minutes = Number(duration.get('m'));
	let seconds = Number(duration.get('s'));

	if (hours.toString().length === 1) {
		hours = `0${ hours }`;
	}
	if (minutes.toString().length === 1) {
		minutes = `0${ minutes }`;
	}
	if (seconds.toString().length === 1) {
		seconds = `0${ seconds }`;
	}
	return `${ hours }:${ minutes }:${ seconds }`;
};

const getKeyHavingMaxValue = (map, def) => {
	let maxValue = 0;
	let maxKey = def;	// default

	map.forEach((value, key) => {
		if (value > maxValue) {
			maxValue = value;
			maxKey = key;
		}
	});

	return maxKey;
};

export const getSessionOverviewData = (dbCursor) => {
	let totalOnline = 0;
	let totalCompletedChat = 0;
	let timeDuration = 0;
	const busiestTimeCount = new Map();
	const mostCountryVisitors = new Map();
	dbCursor.forEach(function(data) {
		if (data.status === 'online') {
			totalOnline++;
		}

		if (data.offlineTime) {
			totalCompletedChat++;
			const offlineTime = moment(data.offlineTime);
			timeDuration += offlineTime.diff(data.createdAt);
		}

		if (data.chatStartTime) {
			const dayHour = moment(data.chatStartTime).format('H');
			busiestTimeCount.set(dayHour, busiestTimeCount.has(dayHour) ? busiestTimeCount.get(dayHour) + 1 : 1);
		}

		if (data.location) {
			const { countryName, city } = data.location;
			mostCountryVisitors.set(`${ countryName }, ${ city }`, mostCountryVisitors.has(`${ countryName }, ${ city }`) ? mostCountryVisitors.get(`${ countryName }, ${ city }`) + 1 : 1);
		}
	});

	const avg = parseFloat(timeDuration / totalCompletedChat).toFixed(2);
	const avgTimeDuration = moment.duration(Number(avg));
	const MaxVisitorsFrom = getKeyHavingMaxValue(mostCountryVisitors, '-');
	const busiestHour = getKeyHavingMaxValue(busiestTimeCount, -1);
	return [{
		title: 'Online_Visitors',
		value: totalOnline,
	}, {
		title: 'Avg_time_on_site',
		value: isNaN(avgTimeDuration) ? '-' : convertTimeAvg(avgTimeDuration),
	}, {
		title: 'Busiest_time',
		value: busiestHour > 0 ? `${ moment(busiestHour, ['H']).format('hA') }-${ moment((parseInt(busiestHour) + 1) % 24, ['H']).format('hA') }` : '-',
	}, {
		title: 'Most_visitors_from',
		value: MaxVisitorsFrom,
	}];
};
