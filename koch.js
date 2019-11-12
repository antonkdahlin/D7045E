var vertexShaderText = `
precision mediump float;

attribute vec2 vertposition;

uniform mat2 rotation;

void main()
{
   gl_Position = vec4(rotation * vertposition, 0.0, 1.0);
}
`;

var fragmentShaderText = `
precision mediump float;

uniform vec4 u_color;

void main(){
    gl_FragColor = u_color;
}
`;



var sq3 = 1.73205080757; 
var angle = 0.0;

var slider = document.getElementById('depth');
var sliderValue = slider.value;
document.getElementById('value').innerHTML = slider.value;

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
    var rotationUniformLocation = gl.getUniformLocation(program, 'rotation');
    var colorUniformLocation = gl.getUniformLocation(program, "u_color");
   

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);

    var size = 2;          // 2 components per iteration
    var type = gl.FLOAT;   // the data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
    var offset = 0;        // start at the beginning of the buffer

    gl.vertexAttribPointer(postitionAttribLocation, size, type, normalize, stride, offset);
    gl.enableVertexAttribArray(postitionAttribLocation);

    var then = 0.0;
    var rotationSpeed = 0.5;

    
    //gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(), gl.STATIC_DRAW);

    var count = updateBuffer(gl);
    var prev = sliderValue;

    requestAnimationFrame(drawScene);
    function drawScene(now) {
        if (sliderValue != prev){
            count = updateBuffer(gl);
            prev = sliderValue;
        }

        now *= 0.001;
        var deltaTime = now - then;
        then = now;
        angle += rotationSpeed * deltaTime;

        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        gl.uniformMatrix2fv(rotationUniformLocation, false, [cos, -sin, sin, cos]);

        gl.clearColor(1.0, 1.0, 0.8, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);

        gl.useProgram(program);
        
        
        
        gl.uniform4f(colorUniformLocation, 1, 0, 0, 1);
        gl.drawArrays(gl.TRIANGLES, 0, count);

        
        gl.uniform4f(colorUniformLocation, 0, 0, 0, 1);
        gl.drawArrays(gl.LINE_LOOP, count, count);
        
        requestAnimationFrame(drawScene);
    }
}

function updateBuffer(gl){
    var res = get_koch(sliderValue);
    var loopVertices = simpleVec(res[0]);
    var triangles = simpleVec(res[1]);

    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(triangles.concat(loopVertices)), gl.STATIC_DRAW);
    return loopVertices.length / 2;
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

function update(){
    sliderValue = slider.value;
    document.getElementById('value').innerHTML = slider.value;
}

function rotate(p, a){
    return new Vector(
        p.x * Math.cos(a) - p.y * Math.sin(a),
        p.x * Math.sin(a) + p.y * Math.cos(a),
    );
}

class Vector {
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
}


//returns [[vertices], [triangles]]
function koch_line(p1,p2,b,i){
    if (i <= 1){
        return [[p1],[]]
    }
    var q = p1.add(p2).div(2.0);
    var a = q.scale(4).sub(b).div(3.0);
    var c = p1.scale(2).add(p2).div(3);
    var d = p2.scale(2).add(p1).div(3);
    var e = p1.scale(2).add(b).div(3);
    var f = p2.scale(2).add(b).div(3);
    
    var l1 = koch_line(p1, c, e, i-1);
    var l2 = koch_line(c, a, d, i-1);
    var l3 = koch_line(a, d, c, i-1);
    var l4 = koch_line(d, p2, f, i-1);
    
    var vertices = l1[0].concat(l2[0], l3[0], l4[0]);
    var triangles = l1[1].concat(l2[1], l3[1], l4[1]);
    triangles.push(c, d, a);

    return ([vertices, triangles]);
}

function third_vec(a, b){
    var tmp = new Vector(
        b.x + a.x - sq3 * (b.y - a.y),
        b.y + a.y + sq3 * (b.x - a.x)
    );
    return tmp.div(2);
}

function get_koch(n){
    var width = 1.4; //d = 1.4 
    //h = sq3*d/2
    //y = 0-h/3 = -sq3*d/6

    var p1 = new Vector(-width/2, -sq3*width/6);
    var p2 = new Vector(width/2, -sq3*width/6);
    var b = third_vec(p1, p2);
    
    var l1 = koch_line(p1, p2, b, n);
    var l2 = koch_line(p2, b, p1, n);
    var l3 = koch_line(b, p1, p2, n);
    
    var vertices = l1[0].concat(l2[0], l3[0]);
    var triangles = l1[1].concat(l2[1], l3[1]);
    triangles.push(p1, p2, b);

    return ([vertices, triangles]);
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
