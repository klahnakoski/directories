

function bounceCircleCircle({circle, other}) {
    // repel each other when they overlap
    const vec = other.pos.sub(circle.pos);
    const distance = vec.magnitude();
    const repel = Math.pow(distance / 2 / (circle.rad + other.rad), -20);

    if (circle.acc === undefined) { 
        console.log("null");
    }
    circle.acc = circle.acc.add(vec.mult(-repel));
    other.acc = other.acc.add(vec.mult(repel));
}

function repelCircleCircle({circle, other, repelFactor}) {
    const vec = other.pos.sub(circle.pos);
    const distance = vec.magnitude();
    // electrostatic repulsion
    const factor = Math.pow(distance, -1.2);
    if (isNaN(factor)) {
        console.log("null");
    }
    circle.acc = circle.acc.add(vec.mult(-repelFactor * factor));
    other.acc = other.acc.add(vec.mult(repelFactor * factor));
}

function forceCircleCircle({circle, other, attractFactor}) {
    if (other === undefined || circle.peers === undefined || other.peers === undefined) {
        console.log("null");
    }
    const vec = other.pos.sub(circle.pos);
    const distance = vec.magnitude()-circle.rad-other.rad;
    // spring attraction
    const total = Math.pow(distance / Math.max(1, circle.peers.length), 1);
    if (isNaN(total)) {
        console.log("null");
    }
    circle.acc = circle.acc.add(vec.mult(attractFactor * total));
    other.acc = other.acc.add(vec.mult(-attractFactor * total));
}

function bounceQuadCircle(quad, other, attractFactor) {
    const {rad} = quad;

    quad.points.forEach((c1, i)=>{
        // find distance from line to circle
        const c2 = quad.points[(i+1)%4];
        
        const d = c2.pos.sub(c1.pos);
        const v = other.pos.sub(c1.pos);
        const side = d.cross(v);
        const t = v.dot(d)/d.dot(d);
        if (t < 0) {
            bounceCircleCircle({circle:c1, other, attractFactor});
        } else if (t > 1 ) {
            bounceCircleCircle({circle:c2, other, attractFactor});
        } else {
            // distribute circle force over the two end points
            const circle = new Circle(c1.pos.add(d.mult(t)), rad, {});
            bounceCircleCircle({circle, other, attractFactor});
            c1.acc = c1.acc.add(circle.acc).mult(1-t);
            c2.acc = c2.acc.add(circle.acc).mult(t);
        }
    });
}

function bounceQuadQuad({quad, other, repelFactor}) {
    const buffer = quad.rad+other.rad;
    const quadNorms = [...quad.getNorms(), ...other.getNorms()];
    const candidates = quadNorms.map((norm, i)=>{
        const q = quad.points.map(c=>{return {x:norm.dot(c.pos), c}}).sort((a,b)=>a.x-b.x);
        const o =other.points.map(c=>{return {x:norm.dot(c.pos), c}}).sort((a,b)=>a.x-b.x);
        if (q[3].x<o[3].x){
            return {dist: o[0].x-q[3].x, norm, q:q[3], o:o[0], i};
        }else {
            return {dist: q[0].x-o[3].x, norm, q:q[0], o:o[3], i}
        } //endif
    }).sort((a,b)=>a.dist-b.dist);
    const {dist, norm, q, o, i} = candidates[0];    
    if (dist<-buffer) return; // no collision

    //which quad edge is in play?
    const source = i<4 ? quad : other;
    const p1 = source.points[i%4];
    const p2 = source.points[(i+1)%4];
    p1.acc = p1.acc.add(norm.mult(repelFactor/2));
    p2.acc = p2.acc.add(norm.mult(repelFactor/2));

    //which vertex on other quad is in play?
    const k = (i<4?o:q).c;
    k.acc = k.acc.add(norm.mult(-repelFactor));

}

function containment({dir, internal, external}) {
    const {rad} = dir;

    dir.points.forEach((c1, i)=>{
        const c2 = dir.points[(i+1)%4];
    
        const d = c2.pos.sub(c1.pos);
        const tan = d.perp();
        internal.forEach(other=>{
            const offset = tan.mult(other.rad+rad);
            const v = other.pos.sub(c1.pos).sub(offset);
            const side = d.cross(v);
            if (side>0){
                // if inside, do nothing
                return;
            }
            const force = tan.mult(containmentFactor);
            other.acc = other.acc.add(force);

            // distribute opposite force over the two end points
            const t = v.dot(d)/d.dot(d);
            c1.acc = c1.acc.add(force.mult(t-1));
            c2.acc = c2.acc.add(force.mult(-t));
        });
    });

    //ensure external circles stay outside
    external.forEach(other=>{
        const forces = dir.points.map((c1, i)=>{
            const c2 = dir.points[(i+1)%4];
        
            const d = c2.pos.sub(c1.pos);
            const tan = d.perp();
            const offset = tan.mult(other.rad+rad);
            const v = other.pos.sub(c1.pos).add(offset);
            const side = d.cross(v);
            if (side<=0){
                // if outside, do nothing
                return {side, distance:0, force:Vector.zero};
            } 
            const force = d.perp().mult(-containmentFactor);
            // distance from line to circle
            const t = v.dot(d)/d.dot(d);
            const distance = v.sub(d.mult(t)).magnitude();
            return {side, distance, force};
        });
        
        const {force} = forces.sort((a,b)=>a.distance-b.distance)[0];
        if (force.magnitude()>0){
            other.acc = other.acc.add(force);   
        }
    });
}


function forceQuadShape(quad, springFactor) {
    const points = quad.points;

    // keep 90 degree angles between lines
    points.forEach((c1, i)=>{
        const c2 = quad.points[(i+1)%4];
        const c3 = quad.points[(i+2)%4];
        const d1 = c1.pos.sub(c2.pos).normalize()
        const d3 = c3.pos.sub(c2.pos).normalize()

        const angle = d1.angle(d3);
        const cosAngle = d1.dot(d3);
        const amplitude = angleFactor * cosAngle * Math.pow((1-cosAngle*cosAngle), -2);
        const f1 = d1.perp().mult(amplitude);
        const f3 = d3.perp().mult(-amplitude);
        c1.acc=c1.acc.add(f1);
        c2.acc=c2.acc.add(f1.add(f3).mult(-1));
        c3.acc=c3.acc.add(f3);

        // keep quad small
        const s1 = c2.pos.sub(c1.pos).normalize()
        c1.acc = c1.acc.add(s1.mult(springFactor));
        c2.acc = c2.acc.add(s1.mult(-springFactor));
    });
}


function step(circles, quads, forces, fields, containers, siblingDirs) {
    // advance shapes, zero out forces
    circles.forEach(circle => {
        if (isNaN(circle.acc.x)) {
            console.log("null");
        }
        circle.pos = circle.pos.add(circle.vel);
        const mag = circle.acc.magnitude();
        if (mag>1) {
            circle.vel = circle.acc.mult(1/mag);
        } else {
            circle.vel = circle.acc;
        }
        circle.acc = windowCenter.sub(circle.pos).normalize().mult(centerFactor);
    });
    quads.forEach(quad => {
        quad.points.forEach((point) => {
            if (isNaN(point.acc.x)) {
                console.log("null");
            }
            point.pos = point.pos.add(point.vel);
            point.vel = point.acc.normalize();
            point.acc = Vector.zero;
        });
    });

    // apply containing forces
    containers.forEach(args=>{
        containment(args);
    });

    // apply circle forces
    forces.forEach(args => forceCircleCircle(args));

    //apply circle field effects
    fields.forEach(args => {
        bounceCircleCircle(args);
        repelCircleCircle(args);
    });

    // ensure quads do not overlap
    siblingDirs.forEach(args=>{
        bounceQuadQuad(args);
    })

    // apply quad effects
    quads.forEach(quad => {
        // circles.forEach(circle => {
        //     bounceQuadCircle(quad, circle);
        // });
        forceQuadShape(quad, boxSpringFactor);
    });
}

let windowCenter = null;
const centerFactor = 1e2;
const boxSpringFactor = 1e-1
const fieldFactor = 2;
const angleFactor =1e0;
const containmentFactor = 1e20;
let dragging = null;
let myCircles = null;

async function setup() {
    createCanvas(windowWidth, windowHeight);
    windowCenter = chain({ x: windowWidth / 2, y: windowHeight / 2 });
    const data = await loadData("js/dependencies.json");
    const circleDetails = {};
    const dirDetails = {};
    const depDetails = {};
    const { circles, quads, forces, fields, containers, siblingDirs } = first_layout(data, circleDetails, dirDetails, depDetails);
    myCircles = circles;

    siblingDirs.forEach(args=>{
        args.repelFactor=containmentFactor*10;
    });

    mainDraw = () => {
        // all the connections
        strokeWeight(1);
        stroke(255, 0, 0);
        forces.forEach(({ circle, other }) => {
            line(circle.pos.x, circle.pos.y, other.pos.x, other.pos.y);
        });

        // quads
        noFill()
        stroke(64);
        quads.forEach(q => {
          strokeWeight(q.rad*2);
            const [p1, p2, p3, p4] = q.points
            quad(p1.pos.x, p1.pos.y, p2.pos.x, p2.pos.y, p3.pos.x, p3.pos.y, p4.pos.x, p4.pos.y);
        });
        // circles
        strokeWeight(0);
        fill(255);
        circles.forEach((c) => {
            ellipse(c.pos.x, c.pos.y, 2 * c.rad, 2 * c.rad);
        });

        // mouse position
        const mouse = chain({ x: mouseX, y: mouseY });
        circles.forEach((c) => {
            if (c.pos.sub(mouse).magnitude() < c.rad) {
                fill(255); // Red when hovering
                text(c.details.label, c.pos.x + c.rad, c.pos.y);
            }
        });

        step(circles, quads, forces, fields, containers, siblingDirs);
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
