var vertexShaderText = `
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

var fragmentShaderText = `
precision mediump float;

varying vec4 v_color;

void main(){
    gl_FragColor = v_color;
}
`;

//global source for vertices
var default_vertex = [new Point(-1, -1), new Point(1, -1), new Point(1, 1), new Point(-1, 1), new Point(0, 0)];
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

    var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderText);
    var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderText);

    var program = createProgram(gl, vertexShader, fragmentShader);

    var postitionLocation = gl.getAttribLocation(program, 'vertposition');
    var colorLocation = gl.getAttribLocation(program, 'a_color');
   
    
    var positionBuffer = gl.createBuffer();
    var tree;
    if (vertex_source.length == 0){
        tree = triangulate(default_vertex);
    }else{
        tree = triangulate(vertex_source);
    }
    var triangles = tree.get_triangles();
    var data = tree.get_triangles_as_simple_vec();
    console.log(triangles);
    triangles.forEach(triangle => {
        triangle.set_color();
    });

    //console.log(data);

    var vertex_count = data.length / 2;
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    var colorBuffer = gl.createBuffer();
    //var data = getColorData(vertex_count);
    var data = getColorData_fromtriangle(triangles);

    console.log(data);

    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(data), gl.STATIC_DRAW);

    drawScene();

    function drawScene() {
        gl.clearColor(1.0, 1.0, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);

        // position
        gl.enableVertexAttribArray(postitionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

        var size = 2;          // 2 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(postitionLocation, size, type, normalize, stride, offset);

        // colour
        gl.enableVertexAttribArray(colorLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);

        var size = 4;          // 4 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(colorLocation, size, type, normalize, stride, offset);

        gl.drawArrays(gl.TRIANGLES, 0, vertex_count);
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