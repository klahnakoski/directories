// layout initial bodies
// draw files and dirs
// draw lines between files

// how to draw dir

function collideMovingCircles(c1, c2) {
    if (c1 === c2) return 1;
    // return time [0..1] that collision will happen
    // c1 and c2 are circles with position, radius and velocity

    const dp = chain(c1.pos).sub(c2.pos);
    const dv = chain(c1.vel).sub(c2.vel);

    // is c1 moving away from c2?
    // if (dp.dot(c1.vel) > 0){
    //   return 1;
    // }

    const A = 2 * dv.dot(dv);
    const B = 2 * dp.dot(dv);
    const C = dp.dot(dp) - Math.pow(c1.rad + c2.rad, 2);
    const T = B * B - 2 * A * C;
    if (T < 0) return 1;
    const G = Math.sqrt(T);

    const t1 = (-B - G) / A;
    const t2 = (-B + G) / A;
    if (0 <= t1 && t1 <= 1) return t1;
    if (0 <= t2 && t2 <= 1) return t2;
    return 1;
}

function force(circle, other, factor) {
    if (circle === other) return Vector.zero;
    const vec = chain(other.pos).sub(circle.pos);
    const distance = vec.magnitude();
    return vec.mult(factor / distance / distance);
}

function fieldEffects(collisions, fields) {
    // return force vector for each circle
    collisions.forEach(({ c1 }, i) => {
        const sub_fields = fields[i];
        const centering = windowCenter.sub(c1.pos).mult(centerFactor);
        c1.acc = centering.add(...collisions.map(({ c1: c2 }, j) => force(c1, c2, sub_fields[j]))).normalize();
    });
}

function redirect(collisions) {
    return collisions.map(({ c1: { pos, vel, acc, ...rest }, peer }, i) => {
        if (peer === null) return { pos, vel: acc, acc: Vector.zero, ...rest };
        const tangent = chain(peer.pos).sub(pos).tangent().normalize();
        const new_vel = tangent.mult(tangent.dot(acc));
        return { pos, vel: new_vel, acc: Vector.zero, ...rest };
    });
}

function step(circles, fields) {
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

    collisions.forEach(({ c1, peer, time }) => {
        c1.pos = chain(c1.pos).add(chain(c1.vel).mult(time));
    });

    // force fields
    fieldEffects(collisions, fields);

    // new directions
    return redirect(collisions);
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
let windowCenter = null;
const centerFactor = 1e-1;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    windowCenter = chain({ x: windowWidth / 2, y: windowHeight / 2 });
    const data = await loadData("js/dependencies.json");
    const circleDetails = {};
    const dirDetails = {};
    const depDetails = {};
    const { circles, fields } = first_layout(data, circleDetails, dirDetails, depDetails);

    myFields = fields;
    myCircles = circles;

    mainDraw = () => {
        myCircles.forEach((c) => {
            ellipse(c.pos.x, c.pos.y, 2 * c.rad, 2 * c.rad);
        });
        myCircles = step(myCircles, myFields);
    };
}

// do nothing until ready
let mainDraw = () => {};

function draw() {
    background(20);
    mainDraw();
}

function windowResized() {
    windowCenter = chain({ x: windowWidth / 2, y: windowHeight / 2 });
    resizeCanvas(windowWidth, windowHeight);
}
