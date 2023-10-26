class Vector {
    constructor(vector) {
      Object.assign(this, vector);
    }

    add(...vectors) {
        let x = this.x;
        let y = this.y;
        for (let v of vectors) {
            x += v.x;
            y += v.y;
        }
        return new Vector({ x, y });
    }

    sub(vector) {
        return new Vector({ x: this.x - vector.x, y: this.y - vector.y });
    }

    rotate(angle) {
        return new Vector({
            x: this.x * cos(angle) - this.y * sin(angle),
            y: this.x * sin(angle) + this.y * cos(angle),
        });
    }

    tangent() {
        return new Vector({ x: -this.y, y: this.x });
    }

    mult(other) {
        return new Vector({ x: this.x * other, y: this.y * other });
    }

    dot(vector) {
        return this.x * vector.x + this.y * vector.y;
    }

    magnitude() {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    normalize() {
        return this.mult(1 / this.magnitude());
    }

    x() {
        return new Vector({ x: this.x, y: 0 });
    }

    y() {
        return new Vector({ x: 0, y: this.y });
    }
}

Vector.zero = new Vector({ x: 0, y: 0 });

function chain(vector) {
    return new Vector(vector);
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}
