
class Node {
    get_triangles_as_simple_vec() {
        var triangles = this.get_triangles();
        var res = [];

        for (var i = 0; i < triangles.length; i+=1){
            var next  = triangles[i].as_simple_vec();

            res = res.concat(next);
        }
        
        return res;
    }
}

const nodetype = {
    BINARY: 'binary',
    TERNARY: 'ternary',
    LEAF: 'leaf',
}

const Color = {
    RED: [1.0, 0, 0],
    GREEN: [0, 1.0, 0],
    BLUE: [0, 0, 1.0],
    YELLOW: [1.0, 1.0, 0],
}

class BinNode extends Node{
    constructor (parent = null, left = null, right = null) {
        super();
        this.nodetype = nodetype.BINARY;
        this.parent = parent;
        this.left = left;
        this.right = right;
    }

    get_triangles() {
        return this.left.get_triangles().concat(this.right.get_triangles());
    }

    change(oldChild, newChild) {
        if (this.left === oldChild) {
            this.left = newChild;
        }else if (this.right === oldChild) {
            this.right = newChild;
        } else {
            console.assert(false )
        }
    }

    query(point) {
  

        // console.log(`querying point (${point.x}, ${point.y}) with cm:(${this.cm.x}, ${this.cm.y}), ci:(${this.ci.x}, ${this.ci.y}), cj:(${this.cj.x}, ${this.cj.y}), c:(${this.c.x}, ${this.c.y})`)
        
        var cmcci = Point.det(this.cm, this.c, this.ci);
        var cmcp = Point.det(this.cm, this.c, point);
        var cicp = Point.det(this.ci, this.c, point);
        var cjcp = Point.det(this.cj, this.c, point);
        

        if (cmcci > 0) {
    
            if (cmcp > 0 && cicp <= 0){
                return this.left.query(point);
            }else if (cmcp == 0 && cicp < 0){
                return [this.left.query(point), this.right.query(point)];
            }
        }else if(cmcci < 0){
    
            if (cmcp > 0){
                return this.left.query(point);
            } else if (cicp <= 0){
                return this.left.query(point);
            }else if (cmcp == 0 && cicp > 0 ){
                return [this.left.query(point), this.right.query(point)];
            }
        }else if (cmcci == 0){
       
            if (cmcp > 0){
       
                return this.left.query(point);
            }else if (cmcp == 0){
       
                if (this.ci === this.cj){
  
                    return [this.left.query(point), this.right.query(point)];
                }else if (cjcp > 0){

                    return [this.left.query(point), this.right.query(point)];
                }else {

                    return this.left.query(point);
                }
            }
        }
        return this.right.query(point);
        

    }
}

/**
 * {Node} ab, bc, ca
 * {Point} m, a, b, c
 */
class TernaryNode extends Node{
    constructor (parent, m, a, b, c){
        super();
        this.nodetype = nodetype.TERNARY;
        this.parent = parent;
        this.a = a;
        this.b = b;
        this.c = c;
        this.m = m;
    }

    get_triangles() {
        return this.ab.get_triangles().concat(this.bc.get_triangles(), this.ca.get_triangles());
    }

    change(oldChild, newChild) {
        if (this.ab === oldChild) {
            this.ab = newChild;
        }else if (this.bc === oldChild) {
            this.bc = newChild;
        }else if (this.ca === oldChild) {
            this.ca = newChild;
        } else {
            console.assert(false )
        }
    }

    query(p) {
        
        var cm = Point.det(this.c, this.m, p);
        var am = Point.det(this.a, this.m, p);
        var bm = Point.det(this.b, this.m, p);
        //console.log(`cm:${cm}, am:${am}, bm:${bm}, p:(${p.x},${p.y})`)
        if (cm < 0) {
            if (am > 0){
                return this.ca.query(p);
            }else if (am == 0) {
                return [this.ca.query(p), this.ab.query(p)];
            }
        }
        if (am < 0) {
            if (bm > 0){
                return this.ab.query(p);
            }else if (bm == 0) {
                return [this.bc.query(p), this.ab.query(p)];
            }
        }
        if (bm < 0) {
            if (cm > 0){
                return this.bc.query(p);
            }else if (cm == 0) {
                return [this.bc.query(p), this.ca.query(p)];
            }
        }
    }
}

class LeafNode extends Node{
    constructor (triangle, parent) {
        super();
        this.triangle = triangle;
        this.parent  = parent;
        this.nodetype = nodetype.LEAF;
    }

    query(point) {
        return this;
    }

    get_triangles() {
        return [this.triangle];
    }

    toBinaryNode(p) {
        //p is on edge of triangle
        var new_node = new BinNode(this.parent);
        new_node.c = p;

        var left_neighbor;
        var right_neighbor;

        if(Point.det(this.triangle.a, this.triangle.b, p) == 0) { // point is on ab
            new_node.cm = this.triangle.c;
            new_node.ci = this.triangle.b;
            new_node.cj = this.triangle.a;

            left_neighbor = this.triangle.neighbor_bc;
            right_neighbor = this.triangle.neighbor_ca;
     
        }else if (Point.det(this.triangle.b, this.triangle.c, p) == 0) { // point is on bc
            new_node.cm = this.triangle.a;
            new_node.ci = this.triangle.c;
            new_node.cj = this.triangle.b;

            left_neighbor = this.triangle.neighbor_ca;
            right_neighbor = this.triangle.neighbor_ab;

        }else if (Point.det(this.triangle.c, this.triangle.a, p) == 0) { // point is on ca
            new_node.cm = this.triangle.b;
            new_node.ci = this.triangle.a;
            new_node.cj = this.triangle.c;

            left_neighbor = this.triangle.neighbor_ab;
            right_neighbor = this.triangle.neighbor_bc;
        }

        var left_triangle = new Triangle(new_node.ci, new_node.cm, p);
        var right_triangle = new Triangle(p, new_node.cm, new_node.cj);

        left_triangle.neighbor_ab = left_neighbor;
        if (left_neighbor != null){
            left_neighbor.update_neighbor(left_triangle);
        }
        left_triangle.neighbor_bc = right_triangle;

        right_triangle.neighbor_ab = left_triangle;
        right_triangle.neighbor_bc = right_neighbor;
        if (right_neighbor != null){
            right_neighbor.update_neighbor(right_triangle);
        }

        var left = new LeafNode(left_triangle, new_node);
        var right = new LeafNode(right_triangle, new_node);
        new_node.left = left;
        new_node.right = right;

        return new_node;
    }

    toTernaryNode(p) {
        var new_node = new TernaryNode(this.parent, p, this.triangle.a, this.triangle.b, this.triangle.c);

        var ab = new Triangle(new_node.a, new_node.b, new_node.m);
        var bc = new Triangle(new_node.b, new_node.c, new_node.m);
        var ca = new Triangle(new_node.c, new_node.a, new_node.m);

        ab.neighbor_ab = this.triangle.neighbor_ab;
        if (this.triangle.neighbor_ab != null) {
            this.triangle.neighbor_ab.update_neighbor(ab);
        }
        ab.neighbor_bc = bc;
        ab.neighbor_ca = ca;

        bc.neighbor_ab = this.triangle.neighbor_bc;
        if (this.triangle.neighbor_bc != null){
            this.triangle.neighbor_bc.update_neighbor(bc);
        }
        bc.neighbor_bc = ca;
        bc.neighbor_ca = ab;

        ca.neighbor_ab = this.triangle.neighbor_ca;
        if (this.triangle.neighbor_ca != null){
            this.triangle.neighbor_ca.update_neighbor(ca);
        }
        ca.neighbor_bc = ab;
        ca.neighbor_ca = bc;

        new_node.ab = new LeafNode(ab, new_node);
        new_node.bc = new LeafNode(bc, new_node);
        new_node.ca = new LeafNode(ca, new_node);

        return new_node;
    }
}




class Triangle {
    constructor(a, b, c) {
        this.a = a;
        this.b = b;
        this.c = c;  
    }

    as_simple_vec() {
        return this.a.as_simple_vec().concat(this.b.as_simple_vec(), this.c.as_simple_vec());
    }

    update_neighbor(triangle) {
        var vertices = [triangle.a, triangle.b, triangle.c];
        if (!vertices.includes(this.a)) {
            this.neighbor_bc = triangle;
        }else if (!vertices.includes(this.b)){
            this.neighbor_ca = triangle;
        }else if (!vertices.includes(this.c)){
            this.neighbor_ab = triangle;
        }else{
            console.assert(false);
        }
    }

    get_neighbors() {
        var res = [];
        if (this.neighbor_ab != null){
            res.push(this.neighbor_ab);
        }if (this.neighbor_bc != null){
            res.push(this.neighbor_bc);
        }if (this.neighbor_ca != null){
            res.push(this.neighbor_ca);
        }
        return res;
    }

    set_color() {
        var colors = [];
        var neighbors = this.get_neighbors();
        for (var i = 0; i < neighbors.length; i+=1){
            if (neighbors[i].color != null){
                colors.push(neighbors[i].color);
            }
        }
        [Color.BLUE, Color.GREEN, Color.RED, Color.YELLOW].forEach(color => {
            if (!colors.includes(color)){
                this.color = color;
                return;
            }
        });
    }
}


function triangulate(points) {
    var hull = jarvis_march(points).reverse(); 
    // console.log(hull);
    // find c inside of triangle
    var c = hull[0];
    var others = [];
    var middle = get_middle(hull);
    var min_distance = Number.POSITIVE_INFINITY;
    for (let point of points) {
        if (!hull.includes(point)){
            others.push(point);
            if (Point.distance_squared(middle, point) < min_distance){
                min_distance = Point.distance_squared(middle, point);
                c = point;
            } 
        }
    }
    if ( others.length == 0 ) {
        return false;
    }
    console.assert(points.length == hull.length + others.length);

    others = others.filter(item => item !== c);
    

    // initialized tree with only binary nodes
    var tree = init_fan(c, hull.concat([hull[0]]), null);
    var triangles  = tree.get_triangles();
    console.log(triangles);
    //link together all triangles
    for (var i = 0; i < triangles.length; i += 1){
        triangles[i].neighbor_bc = triangles[(i+1) % triangles.length];
        triangles[i].neighbor_ca = triangles[(triangles.length + i-1) % triangles.length];
        triangles[i].neighbor_ab = null;
    }
    
    

    while (others.length > 0){
        var p = others.shift();
        var pointIn = tree.query(p);

        // multiple triangles i.e. on edge
        if (Array.isArray(pointIn)) {
            console.assert(pointIn.length === 2, {point: p, errorMsg: 'multiple vertices on same point'});
            console.assert(pointIn[0].nodetype === nodetype.LEAF);
            console.assert(pointIn[1].nodetype === nodetype.LEAF);

            var newNode1 = pointIn[0].toBinaryNode(p);
            
            pointIn[0].parent.change(pointIn[0], newNode1);
            var newNode2 = pointIn[1].toBinaryNode(p);
            pointIn[1].parent.change(pointIn[1], newNode2);

            newNode1.left.triangle.neighbor_ca = newNode2.right.triangle;
            newNode1.right.triangle.neighbor_ca = newNode2.left.triangle;

            newNode2.left.triangle.neighbor_ca = newNode1.right.triangle;
            newNode2.right.triangle.neighbor_ca = newNode1.left.triangle;

        }else{
            console.assert(pointIn.nodetype === nodetype.LEAF);
            // point is inside a triangle
            var new_node = pointIn.toTernaryNode(p);
            pointIn.parent.change(pointIn, new_node);
        }
    }



    console.log(tree);


   
    



    return (tree);
}

function get_middle(hull) {
    var x = 0;
    var y = 0;
    for (let point of hull){
        x += point.x;
        y += point.y;
    }
    return new Point(x/hull.length, y/hull.length);
}

/**
 * 
 * @param {Point} c 
 * @param {Point[]} points 
 * 
 * @returns {Node}
 */
function init_fan(c, points, parent) {
    // base case
    if (points.length == 2) {
        var triangle = new Triangle(points[0], points[1], c);
        var node = new LeafNode(triangle, parent);
        return node;
    }

    var median = parseInt(points.length / 2); // lower median if odd length
    var node = new BinNode(parent);
    
    node.cm = points[median];
    node.c = c;
    node.ci = points[0];
    node.cj = points[points.length - 1];


    var left = init_fan(c, points.slice(0, median + 1), node);
    var right = init_fan(c, points.slice(median), node);
    node.left = left;
    node.right = right;
    
    return node;
}

