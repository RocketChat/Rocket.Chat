export type Position = [longitude: number, latitude: number];

export type Shape<TType extends string, TCoordinates extends Position | Position[] | Position[][]> = {
	type: TType;
	coordinates: TCoordinates;
};

export type Point = Shape<'Point', Position>;
export type LineString = Shape<'LineString', Position[]>;
export type Polygon = Shape<'Polygon', Position[][]>;
export type Geometry = Point | LineString | Polygon;

export type BoundingBox = [[minLng: number, minLat: number], [maxLng: number, maxLat: number]];

const EARTH_RADIUS_KM = 6371;

export const numberToRadius = (deg: number): number => (deg * Math.PI) / 180;
export const numberToDegree = (rad: number): number => (rad * 180) / Math.PI;

const getSegmentIntersection = (p1: Position, p2: Position, p3: Position, p4: Position): Position | null => {
	const [[x1, y1], [x2, y2], [x3, y3], [x4, y4]] = [p1, p2, p3, p4];
	const denom = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);

	if (denom === 0) return null; // Parallel or collinear

	const ua = ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
	const ub = ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

	if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
		return [x1 + ua * (x2 - x1), y1 + ua * (y2 - y1)];
	}
	return null;
};

export const lineStringsIntersect = (l1: LineString, l2: LineString): Point[] | false => {
	const intersects: Point[] = [];
	const c1 = l1.coordinates;
	const c2 = l2.coordinates;

	for (let i = 0; i < c1.length - 1; i++) {
		for (let j = 0; j < c2.length - 1; j++) {
			const intersection = getSegmentIntersection(c1[i], c1[i + 1], c2[j], c2[j + 1]);
			if (intersection) {
				intersects.push({ type: 'Point', coordinates: intersection });
			}
		}
	}
	return intersects.length > 0 ? intersects : false;
};

export const boundingBoxAroundPolyCoords = (coords: Position[][]): BoundingBox => {
	const outerRing = coords[0];
	if (!outerRing?.length) throw new Error('Polygon has no coordinates');

	return outerRing.reduce(
		([[minLng, minLat], [maxLng, maxLat]], [lng, lat]) => [
			[Math.min(minLng, lng), Math.min(minLat, lat)],
			[Math.max(maxLng, lng), Math.max(maxLat, lat)],
		],
		[
			[Infinity, Infinity],
			[-Infinity, -Infinity],
		],
	);
};

export const pointInBoundingBox = (point: Point, [[minLng, minLat], [maxLng, maxLat]]: BoundingBox): boolean => {
	const [lng, lat] = point.coordinates;
	return lng >= minLng && lng <= maxLng && lat >= minLat && lat <= maxLat;
};

const isPointInRing = ([px, py]: Position, ring: Position[]): boolean => {
	let inside = false;
	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];

		const intersect = yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
		if (intersect) inside = !inside;
	}
	return inside;
};

export const pointInPolygon = (p: Point, poly: Polygon): boolean => {
	if (!pointInBoundingBox(p, boundingBoxAroundPolyCoords(poly.coordinates))) return false;
	return poly.coordinates.some((ring) => isPointInRing(p.coordinates, ring));
};

export const drawCircle = (radiusInMeters: number, centerPoint: Point, steps = 15): Polygon => {
	const [centerLng, centerLat] = centerPoint.coordinates;
	const dist = radiusInMeters / 1000 / EARTH_RADIUS_KM;
	const radCenterLat = numberToRadius(centerLat);
	const radCenterLng = numberToRadius(centerLng);

	const polyCoordinates: Position[] = Array.from({ length: steps }, (_, i) => {
		const brng = (2 * Math.PI * i) / steps;
		const lat = Math.asin(Math.sin(radCenterLat) * Math.cos(dist) + Math.cos(radCenterLat) * Math.sin(dist) * Math.cos(brng));
		const lng =
			radCenterLng +
			Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(radCenterLat), Math.cos(dist) - Math.sin(radCenterLat) * Math.sin(lat));

		return [numberToDegree(lng), numberToDegree(lat)];
	});

	polyCoordinates.push(polyCoordinates[0]); // Close the circle

	return { type: 'Polygon', coordinates: [polyCoordinates] };
};

export const rectangleCentroid = (rectangle: Polygon): Point => {
	const [[xmin, ymin], , [xmax, ymax]] = rectangle.coordinates[0];
	return {
		type: 'Point',
		coordinates: [xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2],
	};
};

export const pointDistance = (pt1: Point, pt2: Point): number => {
	const [lon1, lat1] = pt1.coordinates;
	const [lon2, lat2] = pt2.coordinates;

	const dLat = numberToRadius(lat2 - lat1);
	const dLon = numberToRadius(lon2 - lon1);

	const a =
		Math.pow(Math.sin(dLat / 2), 2) + Math.cos(numberToRadius(lat1)) * Math.cos(numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_KM * c * 1000;
};

export const geometryWithinRadius = (geometry: Geometry, center: Point, radius: number): boolean => {
	let coords: Position[];
	if (geometry.type === 'Point') {
		coords = [geometry.coordinates];
	} else if (geometry.type === 'Polygon') {
		coords = geometry.coordinates[0];
	} else {
		coords = geometry.coordinates;
	}

	return coords.every((coord) => pointDistance({ type: 'Point', coordinates: coord }, center) <= radius);
};

const getPolygonCartesianData = (ring: Position[]) => {
	let areaSize = 0;
	let x = 0;
	let y = 0;

	for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
		const [xi, yi] = ring[i];
		const [xj, yj] = ring[j];

		const f = xi * yj - xj * yi;
		areaSize += f;
		x += (xi + xj) * f;
		y += (yi + yj) * f;
	}

	return { area: areaSize / 2, f: areaSize * 3, x, y };
};

export const area = (polygon: Polygon): number => getPolygonCartesianData(polygon.coordinates[0]).area;

export const centroid = (polygon: Polygon): Point => {
	const { f, x, y } = getPolygonCartesianData(polygon.coordinates[0]);
	return { type: 'Point', coordinates: [x / f, y / f] };
};

export const simplify = (sourcePoints: Point[], kinkMeters = 20): Point[] => {
	if (sourcePoints.length < 3) return sourcePoints;

	const source = sourcePoints.map((p) => ({ lng: p.coordinates[0], lat: p.coordinates[1] }));
	const nSource = source.length;

	let bandSqr = (kinkMeters * 360.0) / (2.0 * Math.PI * 6378137.0);
	bandSqr *= bandSqr;

	const index: number[] = [];
	const sigStart: number[] = [0];
	const sigEnd: number[] = [nSource - 1];
	let nStack = 1;
	const F = (Math.PI / 180.0) * 0.5;

	while (nStack > 0) {
		const start = sigStart[--nStack];
		const end = sigEnd[nStack];

		if (end - start > 1) {
			const s = source[start];
			const e = source[end];

			let x12 = e.lng - s.lng;
			const y12 = e.lat - s.lat;

			if (Math.abs(x12) > 180.0) x12 = 360.0 - Math.abs(x12);
			x12 *= Math.cos(F * (e.lat + s.lat));

			const d12 = x12 * x12 + y12 * y12;
			let maxDevSqr = -1.0;
			let sig = start;

			for (let i = start + 1; i < end; i++) {
				const cur = source[i];

				let x13 = cur.lng - s.lng;
				const y13 = cur.lat - s.lat;

				if (Math.abs(x13) > 180.0) x13 = 360.0 - Math.abs(x13);
				x13 *= Math.cos(F * (cur.lat + s.lat));
				const d13 = x13 * x13 + y13 * y13;

				let x23 = cur.lng - e.lng;
				const y23 = cur.lat - e.lat;

				if (Math.abs(x23) > 180.0) x23 = 360.0 - Math.abs(x23);
				x23 *= Math.cos(F * (cur.lat + e.lat));
				const d23 = x23 * x23 + y23 * y23;

				let devSqr: number;
				if (d13 >= d12 + d23) {
					devSqr = d23;
				} else if (d23 >= d12 + d13) {
					devSqr = d13;
				} else {
					devSqr = Math.pow(x13 * y12 - y13 * x12, 2) / d12;
				}

				if (devSqr > maxDevSqr) {
					sig = i;
					maxDevSqr = devSqr;
				}
			}

			if (maxDevSqr < bandSqr) {
				index.push(start);
			} else {
				sigStart[nStack] = sig;
				sigEnd[nStack++] = end;
				sigStart[nStack] = start;
				sigEnd[nStack++] = sig;
			}
		} else {
			index.push(start);
		}
	}

	index.push(nSource - 1);
	return index.sort((a, b) => a - b).map((i) => sourcePoints[i]);
};

export const destinationPoint = (pt: Point, brng: number, dist: number): Point => {
	const distRad = dist / EARTH_RADIUS_KM;
	const brngRad = numberToRadius(brng);

	const lon1 = numberToRadius(pt.coordinates[0]);
	const lat1 = numberToRadius(pt.coordinates[1]);

	const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distRad) + Math.cos(lat1) * Math.sin(distRad) * Math.cos(brngRad));
	let lon2 = lon1 + Math.atan2(Math.sin(brngRad) * Math.sin(distRad) * Math.cos(lat1), Math.cos(distRad) - Math.sin(lat1) * Math.sin(lat2));

	lon2 = ((lon2 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;

	return {
		type: 'Point',
		coordinates: [numberToDegree(lon2), numberToDegree(lat2)],
	};
};
