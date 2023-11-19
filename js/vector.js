class Vector {
    constructor(vector) {
        if (isNaN(vector.x) || isNaN(vector.y)){
            console.log(v);
      }

        Object.assign(this, vector);
    }

    add(...vectors) {
        let x = this.x;
        let y = this.y;
        for (let v of vectors) {
            if (v ===undefined || isNaN(v.x) || isNaN(v.y)){
                  console.log(v);
            }
            x += v.x;
            y += v.y;
        }
        return new Vector({ x, y });
    }

    sub(vector) {
        return new Vector({ x: this.x - vector.x, y: this.y - vector.y });
    }

    angle(other) {
        const dot = this.dot(other);
        const mag = this.magnitude() * other.magnitude();
        return Math.acos(dot / mag);
    }

    rotate(angle) {
        return new Vector({
            x: this.x * cos(angle) - this.y * sin(angle),
            y: this.x * sin(angle) + this.y * cos(angle),
        });
    }

    norm() {
        // 90deg clockwise (positive y is down) normalized perpendicular vector
        return new Vector({ x: -this.y, y: this.x }).unit();
    }

    mult(other) {
        return new Vector({ x: this.x * other, y: this.y * other });
    }

    dot(other) {
        return this.x * other.x + this.y * other.y;
    }

    cross(other) {
        return this.x * other.y - this.y * other.x;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    unit() {
        const mag = this.magnitude();
        if (mag == 0) return Vector.zero;
        return this.mult(1 / this.magnitude());
    }

    ceiling(max){
        const mag = this.magnitude();
        if (mag>max) return this.mult(max/mag);
        return this;
    }

    inverse() {
        return this.mult(Math.pow(this.magnitude(), -2));
    }

    x() {
        return new Vector({ x: this.x, y: 0 });
    }

    y() {
        return new Vector({ x: 0, y: this.y });
    }

    min(other) {
        if (isNaN(other.x) || isNaN(other.y)){
            console.log(v);
      }

        return new Vector({ x: Math.min(this.x, other.x), y: Math.min(this.y, other.y) });
    }

    max(other) {
        if (isNaN(other.x) || isNaN(other.y)){
            console.log(v);
      }
        return new Vector({ x: Math.max(this.x, other.x), y: Math.max(this.y, other.y) });
    }
}

Vector.zero = new Vector({ x: 0, y: 0 });

function chain(vector) {
    return new Vector(vector);
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
