

class Quad {
    constructor(points, rad, details) {
        this.points = points;  // circles
        this.rad = rad;
        this.details
    }

    getBounds() {
        const {rad}=this
        const thickness = {x:rad, y:rad};
        // add the thickness 
        const bounds= this.points[0].getBounds().union(...this.points.slice(1).map(p=>p.getBounds()));
        bounds.min = bounds.min.sub(thickness);
        bounds.max = bounds.max.add(thickness);
        return bounds
    }

    getNorms() {
        // return inward pointing normals
        return this.points.map((c1, i)=>{
            const c2 = this.points[(i+1)%4];
            const d = c2.pos.sub(c1.pos);
            return d.norm();
        });
    }

}


function createSquare(center, sideLength, thickness, details){
    const halfSide = sideLength / 2;
    const rad = thickness/2;
    return new Quad(
        [
            new Circle(center.add({x: halfSide, y: -halfSide}), rad, {}),
            new Circle(center.add({x: halfSide, y: halfSide}),  rad, {}),
            new Circle(center.add({x: -halfSide, y: halfSide}), rad, {}),
            new Circle(center.add({x: -halfSide, y: -halfSide}), rad, {})
        ],
        rad,
        details
    )
}
