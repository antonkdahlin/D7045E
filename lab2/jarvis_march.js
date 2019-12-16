


/**
 * A 2d vertex
 * @typedef Point
 * @property {number} x - x coord
 * @property {number} y - y coord
 */

 /**
 * A 2d vector
 * @typedef Vector
 * @property {number} x
 * @property {number} y
 */

class Point {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y){
        this.x = x;
        this.y = y;
    }

    as_simple_vec(){
        return [this.x, this.y];
    }

    /**
     * Det of (ab ap)
     * returns pos if p is left of line ab, 0 if on line otherwise neg
     * 
     * @param {Point} a 
     * @param {Point} b 
     * @param {Point} p 
     * 
     * @returns {number} 
     */
    static det(a,b,p) {
        return (b.x-a.x)*(p.y-a.y)-(b.y-a.y)*(p.x-a.x);
    }

    static distance_squared(a, b = new Point(0,0)){
        return Math.pow(a.x-b.x, 2) + Math.pow(a.y-b.y, 2);
    }
}



/**
 * Assumes all points are unique
 * Assumes no three lines are on the same line
 * @param {Point[]} vertices - set of points to compute the hull of
 * @return {Point[]} vertices that define the hull
 */
function jarvis_march(vertices){
    if (vertices.length < 3){
        throw vertices.length + " vertices is not enough for computing convex hull"
    }else if (vertices.length == 3) {
        return vertices;
    }
    var pointOnHull = leftmost(vertices);
    var hull = [];
    var i = 0;
    do {
        hull.push(pointOnHull);
        var endPoint = vertices[0];
        for (var j = 1; j < vertices.length; j+=1) {
            if ((endPoint === pointOnHull) || (pseudo_angle(hull[i], endPoint, vertices[j]) < 0)){
                endPoint = vertices[j];
            }
        }
        i+=1;
        pointOnHull = endPoint;
    } while (pointOnHull !== hull[0]);
    return hull;
}
//                    1  2  x
function pseudo_angle(a, b, p) {
    //(x−x1)(y2−y1)−(y−y1)(x2−x1)
    var det_pa_pb = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
    return det_pa_pb;
}

/**
 * 
 * @param {Point[]} v
 * @return {Point}
 */
function leftmost(v){
    if (v.length == 0){
        throw "no leftmost vertex in empty list"
    }
    var record = v[0];
    for (var i = 1; i < v.length; i+=1){
        if (v[i].x < record.x) {
            record = v[i];
        }
    }
    return record;
}


