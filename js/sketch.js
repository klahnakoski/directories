// layout initial bodies
// draw files and dirs
// draw lines between files

// how to draw dir

function forceFunction(circle, other, attractFactor) {
    const vec = chain(other.pos).sub(circle.pos);
    const distance = vec.magnitude();
    const repel = Math.pow(distance / 2 / (circle.rad + other.rad), -20);
    if (attractFactor > 0) {
        // spring attraction
        const total = Math.pow(distance / Math.max(1, circle.peers.length), 1);
        if (isNaN(total)) {
            console.log("null");
        }
        return vec.mult(attractFactor * total - repel);
    } else {
        // electrostatic repulsion
        const total = Math.pow(distance, -1.8);
        if (isNaN(total)) {
            console.log("null");
        }
        return vec.mult(attractFactor * total - repel);
    }
}

function fieldEffects(circles, fields) {
    // return force vector for each circle
    circles.forEach((circle, i) => {
        const sub_fields = fields[i];
        const centering = windowCenter.sub(circle.pos).normalize().mult(centerFactor);
        const temp = circle.acc
            .add(centering)
            .add(
                ...circles.map((other, j) => {
                    if (circle === other) return Vector.zero;
                    return forceFunction(circle, other, sub_fields[j]);
                })
            )
            .mult(1 / 100000);
        if (isNaN(temp.x)) {
            console.log("null");
        }
        circle.acc = temp;
    });
}

function step(circles, fields) {
    circles.forEach((c1) => {
        if (isNaN(c1.vel.x)) {
            console.log("null");
        }
        c1.pos = chain(c1.pos).add(chain(c1.vel));
    });

    // force fields
    fieldEffects(circles, fields);

    // new directions
    circles.forEach((circle) => {
        if (isNaN(circle.acc.x)) {
            console.log("null");
        }
        circle.vel = circle.acc.normalize(); // circle.vel.add(circle.acc);
    });

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
let windowCenter = null;
const centerFactor = 1;
const fieldFactor = 2;
let dragging = null;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    windowCenter = chain({ x: windowWidth / 2, y: windowHeight / 2 });
    const data = await loadData("js/dependencies.json");
    const circleDetails = {};
    const dirDetails = {};
    const depDetails = {};
    const { circles, fields } = first_layout(data, circleDetails, dirDetails, depDetails);

    myFields = fields.map((row) => row.map((f) => f * fieldFactor));
    myCircles = circles;

    mainDraw = () => {
        strokeWeight(1);
        stroke(255, 0, 0);
        circles.forEach((circle, i) => {
            circles.forEach((other, j) => {
                if (myFields[i][j] > 0) {
                    line(circle.pos.x, circle.pos.y, other.pos.x, other.pos.y);
                }
            });
        });
        myCircles.forEach((c) => {
            ellipse(c.pos.x, c.pos.y, 2 * c.rad, 2 * c.rad);
        });
        const mouse = chain({ x: mouseX, y: mouseY });
        myCircles.forEach((c) => {
            if (c.pos.sub(mouse).magnitude() < c.rad) {
                fill(255); // Red when hovering
                text(c.details.label, c.pos.x + c.rad, c.pos.y);
            }
        });

        myCircles = step(myCircles, myFields);
        if (dragging != null) {
            dragging.pos = chain({ x: mouseX, y: mouseY });
        }
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

function mousePressed() {
    let best = null;
    let pos = chain({ x: mouseX, y: mouseY });
    myCircles.forEach((circle) => {
        const d = pos.sub(circle.pos).magnitude();
        if (d < circle.rad) {
            if (!best || d < best.d) {
                best = circle;
            }
        }
    });
    if (best) {
        dragging = best;
    }
}

function mouseReleased() {
    dragging = null;
}
