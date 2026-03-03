export type Position = [number, number];

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

// adapted from http://www.kevlindev.com/gui/math/intersection/Intersection.js
export function lineStringsIntersect(l1: LineString, l2: LineString): Point[] | false {
    const intersects: Point[] = [];
    for (let i = 0; i <= l1.coordinates.length - 2; ++i) {
        for (let j = 0; j <= l2.coordinates.length - 2; ++j) {
            const a1 = {
                x: l1.coordinates[i][1],
                y: l1.coordinates[i][0]
            };
            const a2 = {
                x: l1.coordinates[i + 1][1],
                y: l1.coordinates[i + 1][0]
            };
            const b1 = {
                x: l2.coordinates[j][1],
                y: l2.coordinates[j][0]
            };
            const b2 = {
                x: l2.coordinates[j + 1][1],
                y: l2.coordinates[j + 1][0]
            };
            const ua_t = (b2.x - b1.x) * (a1.y - b1.y) - (b2.y - b1.y) * (a1.x - b1.x);
            const ub_t = (a2.x - a1.x) * (a1.y - b1.y) - (a2.y - a1.y) * (a1.x - b1.x);
            const u_b = (b2.y - b1.y) * (a2.x - a1.x) - (b2.x - b1.x) * (a2.y - a1.y);

            if (u_b !== 0) {
                const ua = ua_t / u_b;
                const ub = ub_t / u_b;
                if (0 <= ua && ua <= 1 && 0 <= ub && ub <= 1) {
                    intersects.push({
                        type: 'Point',
                        coordinates: [a1.x + ua * (a2.x - a1.x), a1.y + ua * (a2.y - a1.y)]
                    });
                }
            }
        }
    }
    if (intersects.length === 0) return false;
    return intersects;
}

function boundingBoxAroundPolyCoords(coords: Position[][]): [Position, Position] {
    let xAll: number[] = [];
    let yAll: number[] = [];

    for (let i = 0; i < coords[0].length; i++) {
        xAll.push(coords[0][i][1]);
        yAll.push(coords[0][i][0]);
    }

    xAll = xAll.sort((a, b) => a - b);
    yAll = yAll.sort((a, b) => a - b);

    return [
        [xAll[0], yAll[0]],
        [xAll[xAll.length - 1], yAll[yAll.length - 1]]
    ];
}

export function pointInBoundingBox(point: Point, bounds: [Position, Position]): boolean {
    return !(
        point.coordinates[1] < bounds[0][0] ||
        point.coordinates[1] > bounds[1][0] ||
        point.coordinates[0] < bounds[0][1] ||
        point.coordinates[0] > bounds[1][1]
    );
}

// Point in Polygon
// http://www.ecse.rpi.edu/Homepages/wrf/Research/Short_Notes/pnpoly.html#Listing the Vertices
function pnpoly(x: number, y: number, coords: Position[]): boolean {
    const vert: Position[] = [[0, 0]];

    for (let i = 0; i < coords.length; i++) {
        vert.push(coords[i]);
    }
    vert.push([0, 0]);

    let inside = false;
    for (let i = 0, j = vert.length - 1; i < vert.length; j = i++) {
        if (
            (vert[i][0] > y) !== (vert[j][0] > y) &&
            x < ((vert[j][1] - vert[i][1]) * (y - vert[i][0])) / (vert[j][0] - vert[i][0]) + vert[i][1]
        ) {
            inside = !inside;
        }
    }

    return inside;
}

export function pointInPolygon(p: Point, poly: Polygon): boolean {
    const coords = poly.coordinates;

    let insideBox = false;
    for (let i = 0; i < coords.length; i++) {
        if (pointInBoundingBox(p, boundingBoxAroundPolyCoords(coords))) {
            insideBox = true;
        }
    }
    if (!insideBox) return false;

    let insidePoly = false;
    for (let i = 0; i < coords.length; i++) {
        if (pnpoly(p.coordinates[1], p.coordinates[0], coords[i])) {
            insidePoly = true;
        }
    }

    return insidePoly;
}

export function numberToRadius(number: number): number {
    return (number * Math.PI) / 180;
}

export function numberToDegree(number: number): number {
    return (number * 180) / Math.PI;
}

export function drawCircle(radiusInMeters: number, centerPoint: Point, steps: number = 15): Polygon {
    const center = [centerPoint.coordinates[1], centerPoint.coordinates[0]];
    const dist = radiusInMeters / 1000 / 6371;
    const radCenter = [numberToRadius(center[0]), numberToRadius(center[1])];

    // Initialize as an empty array rather than the legacy `[[center[0], center[1]]]` 
    // which erroneously started the polygon at the center point.
    const poly: Position[] = [];

    for (let i = 0; i < steps; i++) {
        const brng = (2 * Math.PI * i) / steps;
        const lat = Math.asin(
            Math.sin(radCenter[0]) * Math.cos(dist) +
            Math.cos(radCenter[0]) * Math.sin(dist) * Math.cos(brng)
        );
        const lng =
            radCenter[1] +
            Math.atan2(
                Math.sin(brng) * Math.sin(dist) * Math.cos(radCenter[0]),
                Math.cos(dist) - Math.sin(radCenter[0]) * Math.sin(lat)
            );
        poly.push([numberToDegree(lng), numberToDegree(lat)]);
    }

    // A valid GeoJSON Polygon must have a closed LinearRing (min 4 positions).
    // We append the first point to the end to close the geometry.
    if (poly.length > 0) {
        poly.push([...poly[0]]);
    }

    return {
        type: 'Polygon',
        coordinates: [poly]
    };
}

// assumes rectangle starts at lower left point
export function rectangleCentroid(rectangle: Polygon): Point {
    const bbox = rectangle.coordinates[0];
    const xmin = bbox[0][0],
        ymin = bbox[0][1],
        xmax = bbox[2][0],
        ymax = bbox[2][1];
    const xwidth = xmax - xmin;
    const ywidth = ymax - ymin;
    return {
        type: 'Point',
        coordinates: [xmin + xwidth / 2, ymin + ywidth / 2]
    };
}

// from http://www.movable-type.co.uk/scripts/latlong.html
export function pointDistance(pt1: Point, pt2: Point): number {
    const lon1 = pt1.coordinates[0],
        lat1 = pt1.coordinates[1],
        lon2 = pt2.coordinates[0],
        lat2 = pt2.coordinates[1],
        dLat = numberToRadius(lat2 - lat1),
        dLon = numberToRadius(lon2 - lon1),
        a =
            Math.pow(Math.sin(dLat / 2), 2) +
            Math.cos(numberToRadius(lat1)) *
            Math.cos(numberToRadius(lat2)) *
            Math.pow(Math.sin(dLon / 2), 2),
        c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    // Earth radius is 6371 km
    return 6371 * c * 1000; // returns meters
}

export function geometryWithinRadius(geometry: Geometry, center: Point, radius: number): boolean {
    if (geometry.type === 'Point') {
        return pointDistance(geometry, center) <= radius;
    } else if (geometry.type === 'LineString' || geometry.type === 'Polygon') {
        let coordinates: Position[];
        if (geometry.type === 'Polygon') {
            coordinates = geometry.coordinates[0];
        } else {
            coordinates = geometry.coordinates;
        }
        for (const coord of coordinates) {
            if (pointDistance({ type: 'Point', coordinates: coord }, center) > radius) {
                return false;
            }
        }
    }
    return true;
}

export function area(polygon: Polygon): number {
    let polyArea = 0;
    const points = polygon.coordinates[0];
    let j = points.length - 1;

    for (let i = 0; i < points.length; j = i++) {
        const p1 = { x: points[i][1], y: points[i][0] };
        const p2 = { x: points[j][1], y: points[j][0] };
        polyArea += p1.x * p2.y;
        polyArea -= p1.y * p2.x;
    }

    polyArea /= 2;
    return polyArea;
}

export function centroid(polygon: Polygon): Point {
    let f, x = 0, y = 0;
    const points = polygon.coordinates[0];
    let j = points.length - 1;

    for (let i = 0; i < points.length; j = i++) {
        const p1 = { x: points[i][1], y: points[i][0] };
        const p2 = { x: points[j][1], y: points[j][0] };
        f = p1.x * p2.y - p2.x * p1.y;
        x += (p1.x + p2.x) * f;
        y += (p1.y + p2.y) * f;
    }

    f = area(polygon) * 6;
    return {
        type: 'Point',
        coordinates: [y / f, x / f]
    };
}

export function simplify(sourcePoints: Point[], kink: number = 20): Point[] {
    const mappedSource = sourcePoints.map((o) => ({
        lng: o.coordinates[0],
        lat: o.coordinates[1]
    }));

    let n_source, n_stack, n_dest, start, end, i, sig;
    let dev_sqr, max_dev_sqr;
    let x12, y12, d12, x13, y13, d13, x23, y23, d23;
    const F = (Math.PI / 180.0) * 0.5;
    const index: number[] = [];
    const sig_start: number[] = [];
    const sig_end: number[] = [];

    if (mappedSource.length < 3) return sourcePoints;

    n_source = mappedSource.length;
    let band_sqr = (kink * 360.0) / (2.0 * Math.PI * 6378137.0);
    band_sqr *= band_sqr;
    n_dest = 0;
    sig_start[0] = 0;
    sig_end[0] = n_source - 1;
    n_stack = 1;

    while (n_stack > 0) {
        start = sig_start[n_stack - 1];
        end = sig_end[n_stack - 1];
        n_stack--;

        if (end - start > 1) {
            x12 = mappedSource[end].lng - mappedSource[start].lng;
            y12 = mappedSource[end].lat - mappedSource[start].lat;
            if (Math.abs(x12) > 180.0) x12 = 360.0 - Math.abs(x12);
            x12 *= Math.cos(F * (mappedSource[end].lat + mappedSource[start].lat));
            d12 = x12 * x12 + y12 * y12;

            for (i = start + 1, sig = start, max_dev_sqr = -1.0; i < end; i++) {
                x13 = mappedSource[i].lng - mappedSource[start].lng;
                y13 = mappedSource[i].lat - mappedSource[start].lat;
                if (Math.abs(x13) > 180.0) x13 = 360.0 - Math.abs(x13);
                x13 *= Math.cos(F * (mappedSource[i].lat + mappedSource[start].lat));
                d13 = x13 * x13 + y13 * y13;

                x23 = mappedSource[i].lng - mappedSource[end].lng;
                y23 = mappedSource[i].lat - mappedSource[end].lat;
                if (Math.abs(x23) > 180.0) x23 = 360.0 - Math.abs(x23);
                x23 *= Math.cos(F * (mappedSource[i].lat + mappedSource[end].lat));
                d23 = x23 * x23 + y23 * y23;

                if (d13 >= d12 + d23) dev_sqr = d23;
                else if (d23 >= d12 + d13) dev_sqr = d13;
                else dev_sqr = ((x13 * y12 - y13 * x12) * (x13 * y12 - y13 * x12)) / d12;

                if (dev_sqr > max_dev_sqr) {
                    sig = i;
                    max_dev_sqr = dev_sqr;
                }
            }

            if (max_dev_sqr < band_sqr) {
                index[n_dest] = start;
                n_dest++;
            } else {
                n_stack++;
                sig_start[n_stack - 1] = sig;
                sig_end[n_stack - 1] = end;
                n_stack++;
                sig_start[n_stack - 1] = start;
                sig_end[n_stack - 1] = sig;
            }
        } else {
            index[n_dest] = start;
            n_dest++;
        }
    }

    index[n_dest] = n_source - 1;
    n_dest++;

    const r: { lng: number; lat: number }[] = [];
    for (let i = 0; i < n_dest; i++) {
        r.push(mappedSource[index[i]]);
    }

    return r.map((o) => ({
        type: 'Point',
        coordinates: [o.lng, o.lat]
    }));
}

// http://www.movable-type.co.uk/scripts/latlong.html#destPoint
export function destinationPoint(pt: Point, brng: number, dist: number): Point {
    dist = dist / 6371; // convert dist to angular distance in radians
    brng = numberToRadius(brng);

    const lat1 = numberToRadius(pt.coordinates[0]);
    const lon1 = numberToRadius(pt.coordinates[1]);

    const lat2 = Math.asin(
        Math.sin(lat1) * Math.cos(dist) +
        Math.cos(lat1) * Math.sin(dist) * Math.cos(brng)
    );
    let lon2 =
        lon1 +
        Math.atan2(
            Math.sin(brng) * Math.sin(dist) * Math.cos(lat1),
            Math.cos(dist) - Math.sin(lat1) * Math.sin(lat2)
        );
    lon2 = ((lon2 + 3 * Math.PI) % (2 * Math.PI)) - Math.PI; // normalise to -180..+180º

    return {
        type: 'Point',
        coordinates: [numberToDegree(lat2), numberToDegree(lon2)]
    };
}