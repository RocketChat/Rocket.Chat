export type Badge = number | string | null | undefined;

const getBadgeText = (badge: NonNullable<Badge>) => {
	if (typeof badge === 'number') {
		badge = Math.abs(badge | 0);

		if (badge > 999) {
			return `${badge > 9999 ? 9 : Math.floor(badge / 1000)}k+`;
		}

		return String(badge);
	}

	return String(badge);
};

const getBadgeStyle = (badge: NonNullable<Badge>) => {
	if (typeof badge === 'number' && badge > 0) {
		return { bgColor: '#ac1b1b', textColor: '#fff', fontFamily: 'sans-serif', fontStyle: 'bold' };
	}

	if (typeof badge === 'string' && badge !== '') {
		return { bgColor: '#3d8a3a', textColor: '#fff', fontFamily: 'sans-serif', fontStyle: 'bold' };
	}

	throw new Error('Invalid badge type');
};

export const drawBadge = (badge: Badge, context: CanvasRenderingContext2D) => {
	if (!badge) {
		return;
	}

	const text = getBadgeText(badge);
	const { fontFamily, fontStyle, bgColor, textColor } = getBadgeStyle(badge);

	let w = 0.6;
	const h = 0.6;

	let x = 0.4;
	const y = 0;

	if (text.length === 2) {
		x -= w * 0.4;
		w *= 1.4;
	} else if (text.length >= 3) {
		x -= w * 0.65;
		w *= 1.65;
	}

	context.beginPath();

	if (text.length > 1) {
		context.moveTo(x + w / 2, y);
		context.lineTo(x + w - h / 2, y);
		context.quadraticCurveTo(x + w, y, x + w, y + h / 2);
		context.lineTo(x + w, y + h - h / 2);
		context.quadraticCurveTo(x + w, y + h, x + w - h / 2, y + h);
		context.lineTo(x + h / 2, y + h);
		context.quadraticCurveTo(x, y + h, x, y + h - h / 2);
		context.lineTo(x, y + h / 2);
		context.quadraticCurveTo(x, y, x + h / 2, y);
	} else {
		context.arc(x + w / 2, y + h / 2, h / 2, 0, 2 * Math.PI);
	}

	context.fillStyle = bgColor;
	context.fill();

	context.closePath();

	context.font = `${fontStyle} ${h * (text.length > 2 ? 0.85 : 1)}px ${fontFamily}`;
	context.textAlign = 'center';
	context.fillStyle = textColor;

	context.beginPath();

	context.stroke();

	if (text.length > 3) {
		context.fillText(text, x + w / 2, y + h - h * 0.2);
	} else {
		context.fillText(text, x + w / 2, y + h - h * 0.15);
	}

	context.closePath();
};
