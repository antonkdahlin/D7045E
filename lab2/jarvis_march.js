var vertexShaderText = `
precision mediump float;

attribute vec2 vertposition;

void main()
{
   gl_Position = vec4(vertposition, 0.0, 1.0);
   gl_PointSize = 1.0;
}
`;

var fragmentShaderText = `
precision mediump float;

void main(){
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
}
`;
/*
40
32
27
25
21
30
*/



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
}

class Vector {
    /**
     * 
     * @param {number} x 
     * @param {number} y 
     */
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    add(v){
        return new Vector(v.x + this.x, v.y + this.y);
    }
    scale(f){
        return new Vector(this.x * f, this.y * f);
    }
    sub(v){
        return this.add(v.scale(-1.0));
    }
    div(f){
        return this.scale(1/f);
    }
    dotproduct(vec) {
        return (this.x * vec.x + this.y * vec.y);
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
    var  det_pa_pb = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
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


function init() {
    var canvas = document.getElementById("graphics-surface");
    var gl = canvas.getContext('webgl');
    if (!canvas){
        console.log("no gl for you :(");
    }

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var postitionAttribLocation = gl.getAttribLocation(program, 'vertposition');
   

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer

    gl.vertexAttribPointer(postitionAttribLocation, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(postitionAttribLocation);


    var count = 10;
    var lines = setGeometry(gl, count);

    console.log("number of lines: " + lines);


    gl.clearColor(1.0, 1.0, 0.8, 1.0);
    gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    gl.useProgram(program);
    
    gl.drawArrays(gl.POINTS, 0, count);
    gl.drawArrays(gl.LINE_LOOP, count, lines);


    
        
    
}

function setGeometry(gl, count){
    var vertices = [];
 
    for (var i = 0; i < count; i+=1){
        vertices.push(new Point(Math.random() * 2 - 1, Math.random() * 2 - 1));
    }

    var hull = jarvis_march(vertices);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(simpleVec(vertices).concat(simpleVec(hull))), gl.STATIC_DRAW);
    return hull.length;
}

function createShader(gl, type, src){
    var shader = gl.createShader(type);

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success){
        return shader;
        
    }else{
        console.error("error compiling vertex shader", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
}

function createProgram(gl, vertexShader, fragmentShader){
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success){
        return program;
    } else {
        console.error("error compiling program", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
}

function simpleVec(lst){
    var res = [];
    for (var i = 0; i < lst.length; i += 1){
        res.push(lst[i].x, lst[i].y);
    }
    return res;
}

function printVert(lst){
    var s = "";
    for (var i = 0; i < lst.length; i+= 1){
        s+= "(" + lst[i].x + ", " + lst[i].y + "),";
    }
    return s;
}