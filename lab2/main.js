var vertexShaderTextAlt = `
precision mediump float;

attribute vec2 vertposition;
attribute vec4 a_color;

varying vec4 v_color;

void main()
{
   gl_Position = vec4(vertposition * 0.9, 0.0, 1.0);
   v_color = a_color;
   gl_PointSize = 4.0;
}
`;

var fragmentShaderTextAlt = `
precision mediump float;

varying vec4 v_color;

void main(){
    gl_FragColor = v_color;
}
`;

var vertexShaderText = `
precision mediump float;

attribute vec2 vertposition;

void main()
{
   gl_Position = vec4(vertposition * 0.9, 0.0, 1.0);
   gl_PointSize = 4.0;
}
`;

var fragmentShaderText = `
precision mediump float;

uniform vec4 fcolor;

void main(){
    gl_FragColor = fcolor;
}
`;

//global source for vertices
var default_vertex = [new Point(-1, -1), new Point(1, -1), new Point(1, 1), new Point(-1, 1), new Point(0, 0)]; // four corners and a center
var vertex_source = [];
document.getElementById('vsoup').addEventListener('change', handleFileSelect, false); 
var updated = false;

function handleFileSelect(evt) {
    var files = evt.target.files; // FileList object

    // files is a FileList of File objects. List some properties.
    var file = files[0];
    var reader = new FileReader();


    reader.onloadend = function(evt) {      
        nums = evt.target.result.split(/\s+/);
        var vertex_count = parseInt(nums[0]);
        var vertices = [];
        for (var i = 1; i <= vertex_count * 2; i += 2){
            vertices.push(new Point(parseFloat(nums[i]), parseFloat(nums[i + 1])));
        }
        vertex_source = vertices;
        updated = true;
        init();
    };

    reader.readAsText(file);
}

function genRandom(){
    var n = document.getElementById("noVertices").value;
    var vertices = [];
    for (var i = 0; i < n; i+=1){
        vertices.push(new Point(Math.random() * 2 - 1, Math.random() * 2 - 1));
    }

    vertex_source = vertices;
    updated = true;
    init();
}


function init() {
    var canvas = document.getElementById("graphics-surface");
    var gl = canvas.getContext('webgl');
    if (!canvas){
        console.log("no gl for you :(");
    }
    var colorScheme = document.getElementById("selectedColorScheme").value;
    console.log(colorScheme);

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);


    var vertexShaderAlt = createShader(gl, gl.VERTEX_SHADER, vertexShaderTextAlt);
    var fragmentShaderAlt = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderTextAlt);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var programAlt = createProgram(gl, vertexShaderAlt, fragmentShaderAlt);

    var postitionLocation = gl.getAttribLocation(program, 'vertposition');
    //var colorLocation = gl.getAttribLocation(program, 'a_color');
    var colorLocation = gl.getUniformLocation(program, 'fcolor');   
    
    {
        let a = new Point(0, 1);
        let b = new Point(0, 0);
        let c = new Point(1,0);
        let p = new Point(.5, -1);
        let triangletest = new Triangle(a,b,c);
        triangletest.barycentric_test(p);
    }
        
    
    var vertices = get_vertices();
    assign_ids(vertices);
    var tree = triangulate(vertices);
    var triangles = tree.get_triangles();
    // const line_data = get_line_data()
    const triangle_indices = get_triangle_indices(triangles); 
    //console.log(triangle_indices);

    //console.log(triangles);

    // for the 4color scheme
    triangles.forEach(triangle => {
        triangle.set_color();
    });

    // gradient scheme
    /**
     * 1. choose 3 vertices, rgb
     * 2. calculate the color of each vertex
     * 3. create color data for triangles
     */
    // vertices
    let red_index = Math.floor(Math.random() * vertices.length);
    let green_index;
    do{
        green_index = Math.floor(Math.random() * vertices.length);
    }
    while (green_index === red_index);

    let blue_index;
    do{
        blue_index = Math.floor(Math.random() * vertices.length);
    }
    while (blue_index === red_index || blue_index === green_index);

    vertices.forEach(vertex => {
        var col = get_barycentric_color(vertex, vertices[red_index], vertices[green_index], vertices[blue_index]);
        
    });

    console.log(`v_len:${vertices.length}, i1:${blue_index}, i2:${green_index}, i3:${blue_index}`);
    // var color_data = getColorData_fromtriangle(triangles);
    var vertex_data = get_vertex_data(vertices);

    const point_indices = get_point_indices(vertices);
    const line_indices = get_line_indices(triangles);

    // console.log("begin");
    // console.log(vertex_data);
    // console.log(triangle_indices);
    // console.log(point_indices);
    // console.log(line_indices);
    // console.log(color_data);
    // console.log("end");


    const vertex_buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertex_data), gl.STATIC_DRAW);


    // var colorBuffer = gl.createBuffer();
    // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(color_data), gl.STATIC_DRAW);


    const triangleIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(triangle_indices), gl.STATIC_DRAW);

    const pointIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(point_indices), gl.STATIC_DRAW);

    const lineIndexBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(line_indices), gl.STATIC_DRAW);
    

    drawScene();

    function drawScene() {
        gl.clearColor(1.0, 1.0, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // position
        
        gl.bindBuffer(gl.ARRAY_BUFFER, vertex_buffer);
        
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, triangleIndexBuffer);

        var size = 2;          // n components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(postitionLocation, size, type, normalize, stride, offset);
        gl.enableVertexAttribArray(postitionLocation);

        // colour
       
        // gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        // var size = 4;          // 4 components per iteration
        // var type = gl.FLOAT;   // the data is 32bit floats
        // var normalize = false; // don't normalize the data
        // var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        // var offset = 0;        // start at the beginning of the buffer
        // gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);
        // gl.enableVertexAttribArray(colorLocation);

        //gl.drawArrays(gl.TRIANGLES, 0, vertex_count);
        for (var i = 0;  i < triangles.length; i += 1){
            gl.uniform4f(colorLocation, triangles[i].color[0], triangles[i].color[1], triangles[i].color[2],1);
            gl.drawElements(gl.TRIANGLES, 3, gl.UNSIGNED_SHORT, i*6);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, pointIndexBuffer);
        gl.uniform4f(colorLocation, 0,0,0,1);
        gl.drawElements(gl.POINTS, point_indices.length, gl.UNSIGNED_SHORT, 0);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, lineIndexBuffer);
        gl.drawElements(gl.LINES, line_indices.length , gl.UNSIGNED_SHORT, 0);

        //gl.drawArrays(gl.LINES, 0, vertex_count);
    }
    // genRandom(3);
    // var triangle_count = setGeometry(gl);
    
    // updated = false;
    // var then = 0.0;
    // requestAnimationFrame(drawScene);
    // function drawScene(now) {
    //     if (updated) {
    //         lines = setGeometry(gl);
    //         count  = vertex_source.length;
    //         updated = false;
    //     }
    //     now *= 0.001;
    //     var deltaTime = now - then;
    //     then = now;
        

        

    //     gl.clearColor(1.0, 1.0, 0.8, 1.0);
    //     gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

    //     gl.useProgram(program);
        
        
    //     gl.drawArrays(gl.TRIANGLES, 0, triangle_count);
        
    //     requestAnimationFrame(drawScene);
    // }
}

/**
 * 
 * @param {Point} vertex 
 * @param {Point} red 
 * @param {Point} green 
 * @param {Point} blue 
 */
function get_barycentric_color(vertex, triangle){

}

function get_line_indices(triangles){
    res = [];
    triangles.forEach(triangle => {
        let a = triangle.a;
        let b = triangle.b;
        let c = triangle.c;
        res.push(a.id, b.id, b.id, c.id, c.id, a.id);
    });
    return res;
}

function get_point_indices(vertices){
    res = [];
    vertices.forEach(vertex => {
        res.push(vertex.id);
    });
    return res;
}

function get_vertex_data(vertices){
    res = [];
    vertices.forEach(vertex => {
        res.push(vertex.x, vertex.y);
    });
    return res;
}

function get_triangle_indices(triangles){
    var res = [];
    triangles.forEach(triangle => {
        res.push(triangle.a.id, triangle.b.id, triangle.c.id);
    });
    return res;
}

function assign_ids(v) {
    var count = 0;
    v.forEach(vertex => {
        vertex.id = count;
        count += 1;
    });
}

function get_vertices(){
    if (vertex_source.length <= 3){
        return default_vertex;
    }else{
        return vertex_source;
    }
}

/**
 * 
 * @param {*} n 
 */
function getColorData(n) {
    var res = [];
    for (let i = 0; i < n/3; i += 1) {
        let col1 = Math.random();
        let col2 = Math.random();
        let col3 = Math.random();
        res.push(col1, col2, col3, 1);
        res.push(col1, col2, col3, 1);
        res.push(col1, col2, col3, 1);
    }
    return res;
}

/**
 * produces list with colordata from triangles [t1.col,t1.col,t1.col,1,t2.col...]
 * @param {*} triangles 
 */
function getColorData_fromtriangle(triangles) {
    var res = [];

    triangles.forEach(triangle => {

        res = res.concat(triangle.color);
        res.push(1);
        res = res.concat(triangle.color);

        res.push(1);
 
        res = res.concat(triangle.color);

        res.push(1);

    });
    return res;
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