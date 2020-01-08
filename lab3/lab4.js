class GraphicsNode {
    constructor (mesh, material, transform) {
        this.mesh = mesh;
        this.material = material;
        this.transgorm = transform;
    }

    draw(){
        console.log("drawed");
    }
}

class Mesh {
    constructor (vertexBufferObject, indexBufferObject, vertexArrayObject) {
        this.vertexBufferObject = vertexBufferObject;
        this.indexBufferObject = indexBufferObject;
        this.vertexArrayObject = vertexArrayObject;
    }

    // get vertexBuffer() {
    //     return this.vertexBufferObject;
    // }
}

class Shader {
    constructor (shaderHandle) {
        this.shaderHandle = shaderHandle;
    }
}



class ShaderProgram {
    /**
     * 
     * @param {Shader[]} shaders 
     * @param {GLuint} program 
     */
    constructor (shaders, program) {
        this.shaders = shaders;
        this.program = program;
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

    
}

class SimpleMaterial {
    constructor (color) {
        this.color = color;
    }
}

