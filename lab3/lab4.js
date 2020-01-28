

function degToRad(d) {
    return d * Math.PI / 180;
}

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

    get rgb () {
        return [this._red, this._green, this._blue];
    }

    asVec () {
        return [this._red, this._green, this._blue, this._alpha];
    }
}

const ShaderType = {
    VERTEX: "vertexshader",
    FRAGMENT: "fragmentshader"
}

class Node {
    constructor() {
        if (this.constructor === Node) {
            throw new TypeError('Abstract class "Node" cannot be instantiated directly.'); 
        }

        this.transform = {
            translation: {x: 0, y: 0, z: 0},
            rotation: {x: 0, y: 0, z: 0},
            scale: {x: 1, y: 1, z: 1}
        };

        this._transformMatrix = [
            1,0,0,0,
            0,1,0,0,
            0,0,1,0,
            0,0,0,1
        ];

        this.parent = null;
        this.children = [];

        
    }

    get translation () {
        return Object.values(this.transform.translation);
    }

    updateTransformMatrix () {
        let matrix = m4.translation(this.transform.translation.x, this.transform.translation.y, this.transform.translation.z);
        matrix = m4.xRotate(matrix, this.transform.rotation.x);
        matrix = m4.yRotate(matrix, this.transform.rotation.y);
        matrix = m4.zRotate(matrix, this.transform.rotation.z);
        matrix = m4.scale(matrix, this.transform.scale.x, this.transform.scale.y, this.transform.scale.z);

        this._transformMatrix = matrix;
    }

    get transformMatrix (){
        if (this.parent == null){
            return this._transformMatrix;
        }else{
            return m4.multiply(this.parent.transformMatrix, this._transformMatrix);
        }
        
    }

    xRotate (angleInRad){
        this.transform.rotation.x += angleInRad;
        this.updateTransformMatrix();
    }

    yRotate (angleInRad){
        this.transform.rotation.y += angleInRad;
        this.updateTransformMatrix();
    }

    zRotate (angleInRad){
        this.transform.rotation.z += angleInRad;
        this.updateTransformMatrix();
    }

    translate (x, y, z){
        this.transform.translation.x += x;
        this.transform.translation.y += y;
        this.transform.translation.z += z;
        this.updateTransformMatrix();
    }

    scaling (x, y, z){
        this.transform.scale.x = x;
        this.transform.scale.y = y;
        this.transform.scale.z = z;
        this.updateTransformMatrix();
    }

    update (deltaTime) {
        
    }

    /**
     * 
     * @param {Node} newChild 
     */
    add (newChild) {
        newChild.parent = this;
        this.children.push(newChild);
    }
}

class GraphicsNode extends Node{
    constructor (mesh, material, u_transformLoc, u_worldLoc) {
        super();

        this.mesh = mesh;
        this.material = material;
        
        this.u_transformLoc = u_transformLoc;
        this.u_worldLoc = u_worldLoc;

        this.prev = null;
    }

    

    draw(gl, matrix){
        this.mesh.bind_vao(gl);
        this.material.applyMaterial(gl);

        let worldMatrix = this.transformMatrix;
        
        
        
        let transformMatrix = m4.multiply(matrix, worldMatrix);

        gl.uniformMatrix4fv(this.u_transformLoc, false, transformMatrix);
        gl.uniformMatrix4fv(this.u_worldLoc, false, worldMatrix);

        gl.drawElements(gl.TRIANGLES, this.mesh.element_count , gl.UNSIGNED_SHORT, 0);
    }
}

class Mesh {
    constructor (gl, positionLocation, normalLocation, vertices, indices, normals) {
        this.vao = gl.createVertexArray();
        this.vbo = gl.createBuffer();
        this.ibo = gl.createBuffer();
        this.nbo = gl.createBuffer();

        this._element_count = indices.length;

        gl.bindVertexArray(this.vao);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.vbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);

        

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.ibo);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);

        /**
         * components per iteration
         * data type
         * normalize data
         * stride, 0 = move forward size * sizeof(type)
         * offset in buffer
         */
        gl.vertexAttribPointer(positionLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(positionLocation);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.nbo);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

        gl.vertexAttribPointer(normalLocation, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(normalLocation);
    }

    bind_vao(gl){
        gl.bindVertexArray(this.vao);
    }

    get element_count() {
        return this._element_count;
    }

    static makeCuboid(gl, positionLocation, normalLocation, length, height, width){
        let x = length / 2;
        let y = height / 2;
        let z = width / 2;
        // length /= 2;
        // height /= 2;
        // width /= 2;

        /*
            0----1        [top]
            |    |    [ls][fro][rs][back]
            2----3        [bot]
        */
        let vertices =[
            // front
            x, y, z, // 0
            x, y, -z,
            x, -y, z,
            x, -y, -z,
            // left side
            -x, y, z, // 4
            x, y, z,
            -x, -y, z,
            x, -y, z,
            //right side
            x, y, -z, // 8
            -x, y, -z,
            x, -y, -z,
            -x, -y, -z,
            // back
            -x, y, -z, // 12
            -x, y, z,
            -x, -y, -z,
            -x, -y, z,
            // top
            -x, y, z, // 16
            -x, y, -z,
            x, y, z,
            x, y, -z,
            // bot
            x, -y, z, // 20
            x, -y, -z,
            -x, -y, z,
            -x, -y, -z,
        ];

        let normals = [
            // front
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            1, 0, 0,
            // ls
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            0, 0, 1,
            // rs
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            0, 0, -1,
            // back 
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            -1, 0, 0,
            // top
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            0, 1, 0,
            // bot
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
            0, -1, 0,
        ];

        let indices = [
            // front
            0,2,1,      2,3,1,
            // LS
            4,6,5,      5,6,7,
            // RS
            8,10,9,     9,10,11,
            //back
            12,14,13,   13,14,15,
            // top
            16,18,17,   17,18,19,
            // bot
            20,22,21,   21,22,23
        ];

        return new Mesh(gl, positionLocation, normalLocation, vertices, indices, normals);
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
        gl.useProgram(this.shaderProgram.program);
        gl.uniform4fv(this.colorLocation, this.color.asVec());
    }
}

class Camera extends Node {
    constructor (aspect, fovInRadians) {
        super();
        this._zNear = 1;
        this._zFar = 2000;
        this._aspect = aspect;
        this._fov = fovInRadians;

        this.projMatrix = m4.perspective(this._fov, this._aspect, this._zNear, this._zFar);
        this.updateTransformMatrix();

        // Mechanics
        this.x_velocity = 0;
        this.y_velocity = 0;
        this.z_velocity = 0;
        this.x_acceleration = 0;
        this.y_acceleration = 0;
        this.z_acceleration = 0;

        this.friction = 7;
    }

    updateProjMatrix(){
        this.projMatrix = m4.perspective(this._fov, this._aspect, this._zNear, this._zFar);
    }

    updateTransformMatrix() {
        super.updateTransformMatrix();
        this.updateViewProjMatrix();
    }

    updateViewProjMatrix(){
        var camMatrix = m4.translation(this.transform.translation.x,70, this.transform.translation.z);
        camMatrix = m4.yRotate(camMatrix,  this.transform.rotation.x );
        camMatrix = m4.xRotate(camMatrix,  this.transform.rotation.y );
        
        let viewMatrix = m4.inverse(camMatrix);
        this._viewProjMat = m4.multiply(this.projMatrix, viewMatrix);
    }

    set fov (angleInRad){
        this._fov = angleInRad;
        this.updateProjMatrix();
    }

    tilt(angleInRad){
        this.transform.rotation.y += angleInRad;

        if (this.transform.rotation.y < -1.57){
            this.transform.rotation.y = -1.57;
        }else if (this.transform.rotation.y > 1.57){
            this.transform.rotation.y = 1.57;
        }
        this.updateTransformMatrix();
    }

    get position () {
        return Object.values(this.transform.translation);
    }

    get viewProjMat () {
        // FPS style
        

        return this._viewProjMat;
    }

    update (deltaTime){ 
        if (Math.abs(this.x_velocity) < 0.01) { this.x_velocity = 0; }
        if (Math.abs(this.y_velocity) < 0.01) { this.y_velocity = 0; }
        if (Math.abs(this.z_velocity) < 0.01) { this.z_velocity = 0; }

        this.x_velocity += (this.x_acceleration - this.x_velocity * this.friction) * deltaTime;
        this.y_velocity += (this.y_acceleration - this.y_velocity * this.friction) * deltaTime;
        this.z_velocity += (this.z_acceleration - this.z_velocity * this.friction) * deltaTime;

        this.translate(this.x_velocity, this.y_velocity, this.z_velocity);
    }
}

class LightSource extends Node {
    constructor(intensity, color){
        super();
        this.intensity = intensity;
        this.color = color;
    }
}

function init() {
    console.log("initialised");
    var canvas = document.getElementById("graphics-surface");
    var gl = canvas.getContext("webgl2");
    if (!canvas){
        console.log("no gl for you :(");
    }

    var fovSlide = document.getElementById("fovSlide");
    var lightSlide = document.getElementById("lightSlide");
    var lighthSlide = document.getElementById("lighthSlide");
    var cube2xtSlide = document.getElementById("cube2xt");
    

    
   
    // vertexShader and fragmentShader defined in shaders.js
    const v_shader = new Shader(gl, vertexShader, ShaderType.VERTEX);
    const f_shader = new Shader(gl, fragmentShader, ShaderType.FRAGMENT);

    const shaderProgram = new ShaderProgram(gl, [v_shader, f_shader]);

    const normalLocation = gl.getAttribLocation(shaderProgram.program, 'in_normal');
    const posLocation = gl.getAttribLocation(shaderProgram.program, 'in_position');
    const u_transformLoc = gl.getUniformLocation(shaderProgram.program, 'u_transform');
    const u_worldLoc = gl.getUniformLocation(shaderProgram.program, 'u_world');
    const u_lightPositionLoc = gl.getUniformLocation(shaderProgram.program, 'u_lightPosition');
    const u_viewPositionLoc = gl.getUniformLocation(shaderProgram.program, 'u_cameraPosition');
    const u_lightColorLoc = gl.getUniformLocation(shaderProgram.program, 'u_lightColor');
    console.log(u_lightColorLoc);


    let axisLen = 100;
    const axismesh = Mesh.makeCuboid(gl, posLocation, normalLocation, axisLen, 1, 1);
    const cubemesh = Mesh.makeCuboid(gl, posLocation, normalLocation, 20, 20, 20);
    const material = new SimpleMaterial(gl, new Color(1,0,0), shaderProgram);

    // LIGHSOURCE
    let lightSource = new LightSource(1, new Color(1,1,1));
    lightSource.translate(-60, 100, -60);

    lightSlide.oninput = (e) => {
        lightVal.value = lightSlide.value;
        lightSource.transform.translation.x = 100 * Math.cos(degToRad(lightSlide.value));
        lightSource.transform.translation.z = 100 * Math.sin(degToRad(lightSlide.value));
    };

    lighthSlide.oninput = (e) => {
        lighthVal.value = lighthSlide.value;
        lightSource.transform.translation.y = lighthSlide.value;
        
    };

    // CAMERA
    let camera = new Camera(gl.canvas.clientWidth / gl.canvas.clientHeight, degToRad( fovSlide.valueAsNumber));

    fovSlide.oninput = (e) => {
        fovval.value = fovSlide.value;
        camera.fov = degToRad( fovSlide.value);
    };

    


    const cube1 = new GraphicsNode(cubemesh, material, u_transformLoc, u_worldLoc);
    cube1.update = function( deltaTime, now) {
        this.translate(0,0,Math.cos(now));
        this.xRotate(deltaTime / 2);
        this.yRotate(deltaTime / 3);
        this.zRotate(deltaTime / 5);
        this.updateTransformMatrix();
    };

    const cube2 = new GraphicsNode(cubemesh, new SimpleMaterial(gl, new Color(0,.5,.7), shaderProgram), u_transformLoc, u_worldLoc);
    cube2.translate(30,0,0);
    cube2.scaling(5,5,5);

    const cube3 = new GraphicsNode(cubemesh, new SimpleMaterial(gl, new Color(1,.5,.7), shaderProgram), u_transformLoc, u_worldLoc);
    cube3.translate(0, 15, 0);
    cube3.scaling(.3,.9,.4);

    // scene tree 
    // cube1.add(cube2);
    cube2.add(cube3);
    


    const floor = new GraphicsNode(cubemesh, new SimpleMaterial(gl, new Color(0,.5,0), shaderProgram), u_transformLoc, u_worldLoc);
    floor.scaling(100,1,100);
    floor.translate(0,-30,0);

    const xaxis = new GraphicsNode(axismesh, new SimpleMaterial(gl, new Color(1,0,0), shaderProgram), u_transformLoc, u_worldLoc);
    xaxis.translate(axisLen / 2, 0, 0);

    const yaxis = new GraphicsNode(axismesh, new SimpleMaterial(gl, new Color(0,1,0), shaderProgram), u_transformLoc, u_worldLoc);
    yaxis.translate(0, axisLen / 2, 0);
    yaxis.zRotate(Math.PI / 2);

    const zaxis = new GraphicsNode(axismesh, new SimpleMaterial(gl, new Color(0,0,1), shaderProgram), u_transformLoc, u_worldLoc);

    zaxis.translate(0, 0, axisLen / 2);
    zaxis.yRotate(Math.PI / 2);


    // Keypress gui
    /**
     * wasd to move camera
     */
    let acc = 10;
    window.addEventListener('keydown', (evt) => {
        switch (evt.keyCode) {
            case 87:
                // w
                camera.z_acceleration = acc;
                break;
            case 65:
                // a
                camera.x_acceleration = acc;
                break;
            case 83:
                camera.z_acceleration = -acc;
                break;
            case 68:
                // d
                camera.x_acceleration = -acc;
                break;
        }
    }, false);

    window.addEventListener('keyup', (evt) => {
        switch (evt.keyCode) {
            case 87:
                // w
                if (camera.z_acceleration == acc){
                    camera.z_acceleration = 0;
                }
                break;
            case 65:
                // a
                if (camera.x_acceleration == acc){
                    camera.x_acceleration = 0;
                }
                break;
            case 83:
                // s
                if (camera.z_acceleration == -acc){
                    camera.z_acceleration = 0;
                }
                break;
            case 68:
                // d
                if (camera.x_acceleration == -acc){
                    camera.x_acceleration = 0;
                }
                break;
        }
    }, false);
            
    let pressed = false;
    document.body.onmousedown = (evt) => {
        pressed = true;
    };

    document.body.onmouseup = (evt) => {
        pressed = false;
    };

    // gui for camera movement
    let prevX = null;
    let prevY = null;
    let sensitivity = .4;
    canvas.addEventListener('mousemove', function(evt) {
        var diff = {x: evt.clientX - prevX, y: evt.clientY - prevY};

        prevX = evt.clientX;
        prevY = evt.clientY;

        if(pressed){
            camera.xRotate(degToRad( diff.x * sensitivity));
            camera.tilt(degToRad( diff.y * sensitivity));
        }
    }, false);

    let objects = [cube1, cube2, cube3, floor, xaxis, yaxis, zaxis];


    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height); // ??
    gl.enable(gl.CULL_FACE);
    gl.enable(gl.DEPTH_TEST);

    var then = 0.0;
    requestAnimationFrame(drawScene);
    function drawScene(now) {
        now *= 0.001;
        var deltaTime = now - then;
        then = now;

 
        camera.update(deltaTime);

        gl.clearColor( .53, 0.81, 0.92,1 );
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        

        let viewProjMat = camera.viewProjMat;

        gl.uniform3fv(u_lightPositionLoc, lightSource.translation);
        gl.uniform3fv(u_viewPositionLoc, camera.translation);
        gl.uniform3fv(u_lightColorLoc, lightSource.color.rgb);

        objects.forEach(object => {
            object.update(deltaTime, now);
            object.draw(gl, viewProjMat.slice());
        });
        
        requestAnimationFrame(drawScene); // for some reason this crashes the browser
    }
    
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

