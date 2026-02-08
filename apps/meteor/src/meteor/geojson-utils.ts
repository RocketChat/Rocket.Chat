import { Package } from './package-registry';

// --- Types ---
export type Position = [number, number]; // [Longitude, Latitude]

export type Point = {
	type: 'Point';
	coordinates: Position;
};

export type LineString = {
	type: 'LineString';
	coordinates: Position[];
};

export type Polygon = {
	type: 'Polygon';
	coordinates: Position[][];
};

export type Geometry = Point | LineString | Polygon;

// --- Constants ---
const EARTH_RADIUS_KM = 6371;

// --- Conversions ---

export const numberToRadius = (deg: number): number => (deg * Math.PI) / 180;
export const numberToDegree = (rad: number): number => (rad * 180) / Math.PI;

// --- Intersection Logic ---

// Adapted from http://www.kevlindev.com/gui/math/intersection/Intersection.js
export function lineStringsIntersect(l1: LineString, l2: LineString) {
	const intersects: Point[] = [];
	const c1 = l1.coordinates;
	const c2 = l2.coordinates;

	for (let i = 0; i < c1.length - 1; i++) {
		for (let j = 0; j < c2.length - 1; j++) {
			const a1 = { x: c1[i][1], y: c1[i][0] };
			const a2 = { x: c1[i + 1][1], y: c1[i + 1][0] };
			const b1 = { x: c2[j][1], y: c2[j][0] };
			const b2 = { x: c2[j + 1][1], y: c2[j + 1][0] };

			const uat = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
			const ubt = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
			const uxb = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

			if (uxb !== 0) {
				const ua = uat / uxb;
				const ub = ubt / uxb;

				if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
					intersects.push({
						type: 'Point',
						coordinates: [
							a1.y + ua * (a2.y - a1.y), // Lng
							a1.x + ua * (a2.x - a1.x), // Lat
						],
					});
				}
			}
		}
	}
	return intersects.length > 0 ? intersects : false;
}

// --- Bounding Box ---

export function boundingBoxAroundPolyCoords(coords: Position[][]): [[number, number], [number, number]] {
	// Focusing on the outer ring (index 0)
	const outerRing = coords[0];

	if (!outerRing || outerRing.length === 0) {
		throw new Error('Polygon has no coordinates');
	}

	// Optimized: Find min/max in one pass (O(n)) instead of sorting (O(n log n))
	const bounds = outerRing.reduce(
		(acc, [lng, lat]) => ({
			minLng: Math.min(acc.minLng, lng),
			maxLng: Math.max(acc.maxLng, lng),
			minLat: Math.min(acc.minLat, lat),
			maxLat: Math.max(acc.maxLat, lat),
		}),
		{
			minLng: outerRing[0][0],
			maxLng: outerRing[0][0],
			minLat: outerRing[0][1],
			maxLat: outerRing[0][1],
		},
	);

	return [
		[bounds.minLng, bounds.minLat],
		[bounds.maxLng, bounds.maxLat],
	];
}

export function pointInBoundingBox(point: Point, bounds: [[number, number], [number, number]]): boolean {
	const [lng, lat] = point.coordinates;
	const [[minLng, minLat], [maxLng, maxLat]] = bounds;

	return !(lat < minLat || lat > maxLat || lng < minLng || lng > maxLng);
}

// --- Point in Polygon ---

// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html
function pnpoly(x: number, y: number, coords: Position[]): boolean {
	const vert = [...coords, [0, 0]]; // Add placeholder for loop structure
	let inside = false;

	for (let i = 0, j = vert.length - 2; i < vert.length - 1; j = i++) {
		const [viLng, viLat] = vert[i];
		const [vjLng, vjLat] = vert[j];

		if (viLat > y !== vjLat > y && x < ((vjLng - viLng) * (y - viLat)) / (vjLat - viLat) + viLng) {
			inside = !inside;
		}
	}

	return inside;
}

export function pointInPolygon(p: Point, poly: Polygon): boolean {
	// Support MultiPolygon structure implicitly by wrapping Polygon in array if needed,
	// though the Type suggests strict Polygon.
	// The original code handled coordinates as Position[][] (Polygon) or Position[][][] (MultiPolygonish).
	// Assuming Standard GeoJSON Polygon: coords is Position[][] (LineString[])
	const coords = poly.coordinates;

	// 1. Fast bounding box check
	const insideBox = pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords));
	if (!insideBox) return false;

	// 2. Precise check
	let insidePoly = false;
	for (const ring of coords) {
		if (pnpoly(p.coordinates[0], p.coordinates[1], ring)) {
			insidePoly = true;
			// Note: Logic for holes (inner rings) usually requires checking if point is *inside* outer
			// but *outside* inner. The original code strictly ORs them, which is a common simplified approach.
		}
	}

	return insidePoly;
}

// --- Geometric Shapes ---

export function drawCircle(radiusInMeters: number, centerPoint: Point, steps = 15): Polygon {
	const [centerLng, centerLat] = centerPoint.coordinates;
	const dist = radiusInMeters / 1000 / EARTH_RADIUS_KM;

	const radCenterLat = numberToRadius(centerLat);
	const radCenterLng = numberToRadius(centerLng);

	const polyCoordinates: Position[] = [];

	for (let i = 0; i < steps; i++) {
		const brng = (2 * Math.PI * i) / steps;

		const lat = Math.asin(Math.sin(radCenterLat) * Math.cos(dist) + Math.cos(radCenterLat) * Math.sin(dist) * Math.cos(brng));

		const lng =
			radCenterLng +
			Math.atan2(Math.sin(brng) * Math.sin(dist) * Math.cos(radCenterLat), Math.cos(dist) - Math.sin(radCenterLat) * Math.sin(lat));

		polyCoordinates.push([numberToDegree(lng), numberToDegree(lat)]);
	}

	// Close the polygon
	polyCoordinates.push(polyCoordinates[0]);

	return {
		type: 'Polygon',
		coordinates: [polyCoordinates],
	};
}

export function rectangleCentroid(rectangle: Polygon): Point {
	const bbox = rectangle.coordinates[0];
	const xmin = bbox[0][0];
	const ymin = bbox[0][1];
	const xmax = bbox[2][0]; // Assuming index 2 is opposite corner in a rectangle
	const ymax = bbox[2][1];

	return {
		type: 'Point',
		coordinates: [xmin + (xmax - xmin) / 2, ymin + (ymax - ymin) / 2],
	};
}

// --- Measurements ---

// From http://www.movable-type.co.uk/scripts/latlong.html
export function pointDistance(pt1: Point, pt2: Point): number {
	const [lon1, lat1] = pt1.coordinates;
	const [lon2, lat2] = pt2.coordinates;

	const dLat = numberToRadius(lat2 - lat1);
	const dLon = numberToRadius(lon2 - lon1);

	const a =
		Math.pow(Math.sin(dLat / 2), 2) + Math.cos(numberToRadius(lat1)) * Math.cos(numberToRadius(lat2)) * Math.pow(Math.sin(dLon / 2), 2);

	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_KM * c * 1000; // returns meters
}

export function geometryWithinRadius(geometry: Geometry, center: Point, radius: number): boolean {
	if (geometry.type === 'Point') {
		return pointDistance(geometry, center) <= radius;
	}
	if (geometry.type === 'LineString' || geometry.type === 'Polygon') {
		let coordinates: Position[];

		if (geometry.type === 'Polygon') {
			// Check the exterior ring
			coordinates = geometry.coordinates[0];
		} else {
			coordinates = geometry.coordinates;
		}

		for (const coord of coordinates) {
			const point: Point = { type: 'Point', coordinates: coord };
			if (pointDistance(point, center) > radius) {
				return false;
			}
		}
	}
	return true;
}

export function area(polygon: Polygon): number {
	let areaSize = 0;
	// TODO: handle polygon holes at coordinates[1..n]
	const points = polygon.coordinates[0];

	// Close loop: j is previous vertex, i is current
	let j = points.length - 1;

	for (let i = 0; i < points.length; i++) {
		const p1 = { x: points[i][1], y: points[i][0] };
		const p2 = { x: points[j][1], y: points[j][0] };

		areaSize += p1.x * p2.y;
		areaSize -= p1.y * p2.x;

		j = i;
	}

	return areaSize / 2;
}

// Adapted from http://paulbourke.net/geometry/polyarea/javascript.txt
export function centroid(polygon: Polygon): Point {
	let x = 0;
	let y = 0;
	let f;
	const points = polygon.coordinates[0];
	let j = points.length - 1;

	for (let i = 0; i < points.length; i++) {
		const p1 = { x: points[i][1], y: points[i][0] };
		const p2 = { x: points[j][1], y: points[j][0] };

		f = p1.x * p2.y - p2.x * p1.y;
		x += (p1.x + p2.x) * f;
		y += (p1.y + p2.y) * f;

		j = i;
	}

	f = area(polygon) * 6;
	return {
		type: 'Point',
		coordinates: [y / f, x / f],
	};
}

// --- Simplification (Douglas-Peucker) ---

export function simplify(sourcePoints: Point[], kinkMeters = 20): Point[] {
	/* sourcePoints: array of GeoJSON Points */
	/* kinkMeters: kinks above this depth kept */

	if (sourcePoints.length < 3) return sourcePoints;

	// Map to internal format for processing
	const source = sourcePoints.map((o) => ({
		lng: o.coordinates[0],
		lat: o.coordinates[1],
	}));

	const nSource = source.length;
	let bandSqr = (kinkMeters * 360.0) / (2.0 * Math.PI * 6378137.0); // Now in degrees
	bandSqr *= bandSqr;

	const index: number[] = []; // indices of source points to keep
	const sigStart: number[] = [0];
	const sigEnd: number[] = [nSource - 1];
	let nStack = 1;

	// Use average lat to reduce lng distortion
	const F = (Math.PI / 180.0) * 0.5;

	while (nStack > 0) {
		const start = sigStart[nStack - 1];
		const end = sigEnd[nStack - 1];
		nStack--;

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

				let devSqr;
				if (d13 >= d12 + d23) devSqr = d23;
				else if (d23 >= d12 + d13) devSqr = d13;
				else devSqr = ((x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12)) / d12;

				if (devSqr > maxDevSqr) {
					sig = i;
					maxDevSqr = devSqr;
				}
			}

			if (maxDevSqr < bandSqr) {
				index.push(start);
			} else {
				// Push two sub-sections on stack
				nStack++;
				sigStart[nStack - 1] = sig;
				sigEnd[nStack - 1] = end;
				nStack++;
				sigStart[nStack - 1] = start;
				sigEnd[nStack - 1] = sig;
			}
		} else {
			index.push(start);
		}
	}

	index.push(nSource - 1);

	// The algorithm finds indices out of order due to stack processing,
	// so we sort them to reconstruct the path correctly.
	index.sort((a, b) => a - b);

	return index.map((i) => sourcePoints[i]);
}

// http://www.movable-type.co.uk/scripts/latlong.html#destPoint
export function destinationPoint(pt: Point, brng: number, dist: number): Point {
	const distRad = dist / EARTH_RADIUS_KM; // convert dist to angular distance in radians
	const brngRad = numberToRadius(brng);

	const lat1 = numberToRadius(pt.coordinates[1]); // Fix: Latitude is index 1
	const lon1 = numberToRadius(pt.coordinates[0]); // Fix: Longitude is index 0

	const lat2 = Math.asin(Math.sin(lat1) * Math.cos(distRad) + Math.cos(lat1) * Math.sin(distRad) * Math.cos(brngRad));

	let lon2 = lon1 + Math.atan2(Math.sin(brngRad) * Math.sin(distRad) * Math.cos(lat1), Math.cos(distRad) - Math.sin(lat1) * Math.sin(lat2));

	// normalise to -180..+180º
	lon2 = ((lon2 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI;

	return {
		type: 'Point',
		coordinates: [numberToDegree(lon2), numberToDegree(lat2)],
	};
}

export const GeoJSON = {
	lineStringsIntersect,
	boundingBoxAroundPolyCoords,
	pointInBoundingBox,
	pointInPolygon,
	numberToRadius,
	numberToDegree,
	drawCircle,
	rectangleCentroid,
	pointDistance,
	geometryWithinRadius,
	area,
	centroid,
	simplify,
	destinationPoint,
};

// Legacy Registry Support
Package['geojson-utils'] = { GeoJSON };
