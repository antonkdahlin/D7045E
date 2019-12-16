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