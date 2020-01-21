
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
        
    }
}

class Mesh {
    // constructor (vertexBufferObject, indexBufferObject, vertexArrayObject) {
    //     this.vertexBufferObject = vertexBufferObject;
    //     this.indexBufferObject = indexBufferObject;
    //     this.vertexArrayObject = vertexArrayObject;
    // }

    constructor (gl, vertices, indices) {
        var vao = gl.createVertexArray();

        // let vbo = gl.createBuffer();
        // let ibo = gl.createBuffer();

        // gl.bindBuffer(gl.ARRAY_BUFFER, vbo);
        // gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        // gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ibo);
        // gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW);

        // this.vertexBufferObject = vbo;
        // this.indexBufferObject = ibo;
    }

    get vertexBufferObject() {
        return this.vertexBufferObject;
    }

    get indexBufferObject() {
        return this.indexBufferObject;
    }

    get vertexArrayObject() {
        return this.vertexArrayObject;
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
        this.shaderProgram = shaderProgram;
    }

    get program(){
        return this.shaderProgram;
    }
}

class SimpleMaterial extends Material {
    constructor (color, program) {
        super(program);
        this._color = color;
        this.colorLocation = gl.getUniformLocation(program, 'u_color');
    }

    get color(){
        return this._color;
    }

    applyMaterial (gl) {
        gl.useProgram(this.program);
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

    let cubedata = gen_cube_data(1.0);
    const cube_i = cubedata.indices;
    const cube_v = cubedata.vertices;
    const cubemesh = new Mesh(cube_i, cube_v);

    const v_shader = new Shader(gl, vertexShader, ShaderType.VERTEX);
    const f_shader = new Shader(gl, fragmentShader, ShaderType.FRAGMENT);

    const program = new ShaderProgram(gl, [v_shader, f_shader]);

    const material = new SimpleMaterial(new Color(1,0,0), program);

    const graphics_node = new GraphicsNode(mesh, material);


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

