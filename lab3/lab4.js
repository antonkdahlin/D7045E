
class Color {
    constructor (r, g, b, a = 1) {
        this._red = r;
        this._green = g;
        this._blue = b;
        this._alpha = a;
    }

    get red() {
        return this._red;
    }

    get green() {
        return this._green;
    }

    get blue() {
        return this._blue;
    }

    get alpha() {
        return this._alpha;
    }

    asVec () {
        return [this._red, this._green, this._blue, this._alpha];
    }
}

const ShaderType = {
    VERTEX: "vertexshader",
    FRAGMENT: "fragmentshader"
}

class GraphicsNode {
    constructor (mesh, material, transform) {
        this.mesh = mesh;
        this.material = material;
        this.transform = transform;
    }

    draw(gl){
        

        
        this.mesh.bind_vao(gl);

        this.material.applyMaterial(gl);

        console.log(`drawing ${this.mesh.element_count} elements`);
        gl.drawElements(gl.TRIANGLES, this.mesh.element_count , gl.UNSIGNED_SHORT, 0);
    }
}

class Mesh {
    // constructor (vertexBufferObject, indexBufferObject, vertexArrayObject) {
    //     this.vertexBufferObject = vertexBufferObject;
    //     this.indexBufferObject = indexBufferObject;
    //     this.vertexArrayObject = vertexArrayObject;
    // }

    constructor (gl, attribLocation, vertices, indices) {
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ibo = gl.createBuffer();

        this._element_count = indices.length;
        // console.log(`constructing mesh of len ${indices.length}`)

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        console.log('buffering vertices');
        console.log(vertices);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        

        

        console.log('buffering indices');
        console.log(indices);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        // Tell the attribute how to get data out of positionBuffer (ARRAY_BUFFER)
        var size = 3;          // 3 components per iteration
        var type = gl.FLOAT;   // the data is 32bit floats
        var normalize = false; // don't normalize the data
        var stride = 0;        // 0 = move forward size * sizeof(type) each iteration to get the next position
        var offset = 0;        // start at the beginning of the buffer
        gl.vertexAttribPointer(attribLocation, size, type, normalize, stride, offset);

        // Turn on the attribute
        gl.enableVertexAttribArray(attribLocation);

        // this.vertexBufferObject = vbo;
        // this.indexBufferObject = ibo;
    }

    bind_vao(gl){
        gl.bindVertexArray(this.vao);
    }

    get element_count() {
        return this._element_count;
    }
}

class Shader {

    /**
     * 
     * @param {*} gl 
     * @param {String} src 
     * @param {ShaderType} type 
     */
    constructor (gl, src, type) {
        let shader;
        if (type === ShaderType.FRAGMENT) {
            shader = gl.createShader(gl.FRAGMENT_SHADER);
        }else if (type === ShaderType.VERTEX) {
            shader = gl.createShader(gl.VERTEX_SHADER);
        }

        gl.shaderSource(shader, src);
        gl.compileShader(shader);

        var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
        if (success){
            this._shader = shader;
            this._type = type;
        }else{
            console.error("error compiling vertex shader", gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
        }
    }

    get type() {
        return this._type;
    }

    get shader() {
        return this._shader;
    }
}



class ShaderProgram {
    /**
     * 
     * @param {Shader[]} shaders 
     */
    constructor (gl, shaders) {
        let program = gl.createProgram();

        shaders.forEach(shader => {
            gl.attachShader(program, shader.shader);
        });
        gl.linkProgram(program);

        var success = gl.getProgramParameter(program, gl.LINK_STATUS);
        if (success){
            this._program = program;
        } else {
            console.error("error compiling program", gl.getProgramInfoLog(program));
            gl.deleteProgram(program);
        }
    }

    get program () {
        return this._program;
    }
}

class Material {
    /**
     * 
     * @param {ShaderProgram} shaderProgram 
     */
    constructor (shaderProgram) {
        this._shaderProgram = shaderProgram;
    }

    get shaderProgram(){
        return this._shaderProgram;
    }
}

class SimpleMaterial extends Material {
    constructor (gl, color, shaderProgram) {
        super(shaderProgram);
        this._color = color;
        this.colorLocation = gl.getUniformLocation(shaderProgram.program, 'u_color');
    }

    get color(){
        return this._color;
    }

    applyMaterial (gl) {
        console.log("using program");
        gl.useProgram(this.shaderProgram.program);
        
        console.log(`setting color uniform to ${this.color.asVec()}`);
        gl.uniform4fv(this.colorLocation, this.color.asVec());
    }
}


function init() {
    console.log("initialised");
    var canvas = document.getElementById("graphics-surface");
    var gl = canvas.getContext("webgl2");
    if (!canvas){
        console.log("no gl for you :(");
    }

   

    const v_shader = new Shader(gl, vertexShader, ShaderType.VERTEX);
    const f_shader = new Shader(gl, fragmentShader, ShaderType.FRAGMENT);

    const shaderProgram = new ShaderProgram(gl, [v_shader, f_shader]);
    
    const posLocation = gl.getAttribLocation(shaderProgram.program, 'in_position');
    let cubedata = gen_cube_data(.5);
    const cube_i = cubedata.indices;
    const cube_v = cubedata.vertices;
    const test_i = [0,1,2];
    const test_v = [
        -.7,-.7,1,
        .7,-.7,1,
        0,.7,1
    ]

    const cubemesh = new Mesh(gl, posLocation, cube_v, cube_i);

    const trianglemesh = new Mesh(gl, posLocation, test_v, test_i);


    const material = new SimpleMaterial(gl, new Color(1,0,0), shaderProgram);

    const greenMat = new SimpleMaterial(gl, new Color(0,1,0), shaderProgram);

    const graphics_node = new GraphicsNode(cubemesh, material);
    const triangle = new GraphicsNode(trianglemesh, greenMat);





    gl.clearColor( 0.8, 0.8, 0.8, 1.0 );
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    graphics_node.draw(gl);
    triangle.draw(gl);
}

function gen_cube_data(r) {

    let vertices = [
        -r, -r, -r,
        -r, -r, r,
        -r, r, -r,
        -r, r, r,
        r, -r, -r,
        r, -r, r,
        r, r, -r,
        r, r, r
    ];

    let indices = [
        4,2,6, // a
        4,0,2, // b
        0,3,2, // c
        0,1,3, // d
        2,7,6, // e
        2,3,7, // f
        1,7,3, // g
        1,5,7, // h
        5,6,7, // i
        5,4,6, // j
        4,1,0, // k
        4,5,1 // l
    ];

    return {vertices:vertices, indices:indices};
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

