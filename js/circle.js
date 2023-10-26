class Circle {
    constructor(pos, rad, details) {
        this.pos=chain(pos);
        this.vel=Vector.zero;
        this.acc=Vector.zero;
        this.rad=rad;
        this.details=details;
    }

    getBounds() {
        const pos = chain(this.pos);
        const rad = { x: this.rad, y: this.rad };
        return new Bounds(pos.sub(rad), pos.add(rad));
    }
}
