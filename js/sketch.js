// layout initial bodies
// draw files and dirs
// draw lines between files

// how to draw dir

function collideMovingCircles(c1, c2) {
    if (c1 === c2) return 1;
    // return time [0..1] that collision will happen
    // c1 and c2 are circles with position, radius and velocity
    // d(t) = sqrt(c1+v1(t) - c2-v2(t)
    const dp = chain(c1.pos).sub(c2.pos);
    const dv = chain(c1.vel).sub(c2.vel);

    const A = 2 * dv.dot(dv);
    const B = 2 * dp.dot(dv);
    const C = dp.dot(dp) - Math.pow(c1.rad + c2.rad, 2);
    const T = B * B - 2 * A * C;
    if (T < 0) return 1;
    const G = Math.sqrt(T);

    const t1 = (-B + G) / A;
    const t2 = (-B - G) / A;
    if (0 <= t1 && t1 <= 1) return t1;
    if (0 <= t2 && t2 <= 1) return t2;
    return 1;
}

function force(circle, other, factor) {
    const vec = chain(other.pos).sub(circle.pos);
    const distance = vec.magnitude();
    return vec.mult(factor / distance / distance);
}

function fieldEffects(circles, fields) {
    // return force vector for each circle
    const forces = circles.map((c1, i) => {
        const sub_fields = fields[i];
        return Vector.zero
            .add(
                ...circles.map((c2, j) => {
                    if (c2 === c1) return Vector.zero;
                    return force(c1, c2, sub_fields[j]);
                })
            )
            .normalize();
    });
    return forces;
}

function redirect(collisions, forces) {
    return collisions.map(({c1, peer, time}, i) => {
        const force = forces[i];
        if (peer === null) return { pos: c1.pos, vel: force, rad: c1.rad };
        const tangent = chain(peer.pos).sub(c1.pos).tangent().normalize();
        const vel = tangent.mult(tangent.dot(force));
        return { pos: c1.pos, vel: vel, rad: c1.rad };
    });
}

function nextTime(circles, fields) {
    // advance
    const collisions = circles.map((c1) => {
        let time = 1;
        let peer = null;
        circles.forEach((c2) => {
            const t = collideMovingCircles(c1, c2);
            if (t < time) {
                time = t;
                peer = c2;
            }
        });
        return { c1, peer, time };
    });

    collisions.forEach(({c1, peer, time}) => {
        c1.pos = chain(c1.pos).add(chain(c1.vel).mult(time));
    });

    // force fields
    const forces = fieldEffects(circles, fields);

    // new directions
    circles = redirect(collisions, forces);
    return circles;
}

// how to calculate next direction when circle on edge of dir
// apply center force and torque to edge
// remaining force (parallel to edge) to self

// calc collision between circle and edge
// edge has position, direction and rotation
// calc distance to edge over time d == f(t) for t in [0:1]
// d = abs((vy*px - vx*py + (vx*oy-vy*ox))/sqrt(vx^2 + vy^2)
// d = abs(vy*(px-ox)  - vx*(py -oy))/sqrt(vx^2 + vy^2)
// with v being unit length
// d = abs(vy*(px-ox)  - vx*(py -oy))
// d(t) = abs(vy(t)*(px(t)-ox(t))  - vx(t)*(py(t) -oy(t)))
// f(t) = vy(t)*(px0+px'(t)-(ox0 + ox(t))  - vx(t)*(py(t) -oy(t))
// f(t) = vy(t)*(px0+px'(t)-ox(t))  - vx(t)*(py(t) -oy(t))

// how to ensure dirs do not overlap?

// OPTIMIZATION
// convert object to one spread over time
// map object to some set of (overlpping) bounded boxes
// any boxes with more than one object means a collision check pair
// union the pairs, then do collision check
// much like drawing shapes in a low res grid

let myCircles = null;
let myFields = null;

function setup() {
    createCanvas(windowWidth, windowHeight);
    myCircles = [
        { pos: { x: 100, y: 100 }, vel: { x: 20, y: 1 }, rad: 10 },
        { pos: { x: 200, y: 100 }, vel: { x: -20, y: -1 }, rad: 10 },
    ];
    myFields = [[0,1], [1, 0]]
}

function draw() {
    background(20);
    const c= myCircles[0];

    myCircles.forEach((c) => {
        ellipse(c.pos.x, c.pos.y, 2*c.rad, 2*c.rad);
    });
    myCircles = nextTime(myCircles, myFields);
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}
