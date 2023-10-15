// Create an engine
var engine = Matter.Engine.create();

engine.world.gravity.x = 0;
engine.world.gravity.y = 0;
engine.timing.timeScale = 1;

const airFriction = 0.0;
const restitution = 0.5;
const angularResistance = 0.999;
const slop = 0.0;
const density = 0.001;

// Create a renderer for visualization
var render = Matter.Render.create({
  element: document.body,
  engine: engine,
});

// Create a circle and a line (represented by a thin rectangle in this case)
var circle = Matter.Bodies.circle(250, 250, 50, { restitution, airFriction });


// Add all bodies to the world
Matter.World.add(engine.world, [circle]);

function createSquare(centerX, centerY, sideLength) {
  const halfSide = sideLength / 2;
  const halfThickness = 5; // half of the line thickness
  const details = {
    density,
    slop,
    restitution,
    airFriction,
    angularResistance,
  };

  // Define the four lines for the square
  const lines = [
    Matter.Bodies.rectangle(centerX, centerY + halfSide - halfThickness, sideLength, 10, {label:"top", ...details}), // Top
    Matter.Bodies.rectangle(centerX + halfSide - halfThickness, centerY, 10, sideLength, {label:"right", ...details}), // Right
    Matter.Bodies.rectangle(centerX, centerY - halfSide + halfThickness, sideLength, 10, {label:"bottom", ...details}), // Bottom
    Matter.Bodies.rectangle(centerX - halfSide + halfThickness, centerY, 10, sideLength, {label:"left", ...details}), // Left
  ];

  // Define the connection points for each line
  const connectionPoints = [
    { x: halfSide - halfThickness, y: halfSide - halfThickness }, // Top Right
    { x: halfSide - halfThickness, y: -halfSide + halfThickness }, // Bottom right
    { x: -halfSide + halfThickness, y: -halfSide + halfThickness }, // Bottom left
    { x: -halfSide + halfThickness, y: halfSide - halfThickness }, // Top Left
  ];

  // Connect the lines using constraints
  const constraints = lines.map((_, i) => {
    let nextIdx = (i + 1) % 4; // To loop back to the first line after the last one

    let pointA, pointB;
    if (i % 2 === 0) {
      pointA = { x: connectionPoints[i].x, y: 0 };
      pointB = { x: 0, y: connectionPoints[i].y };
    } else {
      pointA = { x: 0, y: connectionPoints[i].y };
      pointB = { x: connectionPoints[i].x, y: 0 };
    }

    return Matter.Constraint.create({
      bodyA: lines[i],
      bodyB: lines[nextIdx],
      angleA: Matter.Common.toRadians(45+90*i),
      angleB: Matter.Common.toRadians(-135+90*i),
      pointA: pointA,
      pointB: pointB,
      stiffness: 1e-5,
      length: 10,
      render: {
        lineWidth: 1,
        strokeStyle: "#FAA",
      },
      label: lines[i].label + "-" + lines[nextIdx].label,
    });
  });

  const composite = Matter.Composite.create({
    bodies: lines,
    constraints: constraints,
  });
  quads.push(composite);
  Matter.World.add(engine.world, composite);
}

// Usage:
const quads = [];

createSquare(250, 250, 300);

function applyCenteringForce(body, centerX, centerY) {
  const strength = 0.0001; // Adjust this value as needed

  // Calculate the distance from the body to the center
  let dx = centerX - body.position.x;
  let dy = centerY - body.position.y;

  // zero out the angular velocity
  Matter.Body.setAngularVelocity(body, 0);

  // Apply the force
  Matter.Body.applyForce(body, body.position, {
    x: dx * strength,
    y: dy * strength,
  });
}

function getOriginalVertices(body) {
  const pos = body.position;
  const angle = body.angle;
  const vertices = body.vertices.map(v=>{
    return chain(v).sub(pos).rotate(-angle).add(pos).get();
  });
  return vertices
}


Matter.Events.on(engine, "beforeUpdate", function () {
  const centerX = 400; // Adjust to the desired center X position
  const centerY = 300; // Adjust to the desired center Y position
  for (let body of engine.world.bodies) {
    applyCenteringForce(body, centerX, centerY);
  }
  for (let quad of quads) {
    const deltas = quad.constraints.map((con, i) => {
      const delta = chain(con.pointA).add(con.bodyA.position).sub(con.pointB).sub(con.bodyB.position).magnitude()-1;
      const body = con.bodyA;
      const nextBody = con.bodyB;
      const oVertices = getOriginalVertices(body);

      if (i === 0) {
        con.pointA.x += delta;
        con.pointB.y += delta;
        body.
        body.position.x += (delta / 2) * Math.cos(body.angle);
        body.position.y += (delta / 2) * Math.sin(body.angle);
        nextBody.position.x -= (delta / 2) * Math.sin(nextBody.angle);
        nextBody.position.y -= (delta / 2) * Math.cos(nextBody.angle);
      }

    });

    
    quad.constraints.forEach((con, i) => {
      const body = con.bodyA;
      const nextBody = con.bodyB;
      const delta = deltas[i];
      // if (i === 0) {
      //   con.pointA.x += delta;
      //   con.pointB.y += delta;
      //   body.
      //   body.position.x += (delta / 2) * Math.cos(body.angle);
      //   body.position.y += (delta / 2) * Math.sin(body.angle);
      //   nextBody.position.x -= (delta / 2) * Math.sin(nextBody.angle);
      //   nextBody.position.y -= (delta / 2) * Math.cos(nextBody.angle);
      // } else if (i === 1) {
      //   con.pointA.y += delta;
      //   con.pointB.x += delta;
      //   body.position.x += (delta / 2) * Math.sin(body.angle);
      //   body.position.y += (delta / 2) * Math.cos(body.angle);
      //   nextBody.position.x += (delta / 2) * Math.cos(nextBody.angle);
      //   nextBody.position.y += (delta / 2) * Math.sin(nextBody.angle);
      // } else if (i === 2) {
      //   con.pointA.x += delta;
      //   con.pointB.y += delta;
      //   body.position.x -= (delta / 2) * Math.cos(body.angle);
      //   body.position.y -= (delta / 2) * Math.sin(body.angle);
      //   nextBody.position.x += (delta / 2) * Math.sin(nextBody.angle);
      //   nextBody.position.y += (delta / 2) * Math.cos(nextBody.angle);
      // } else {
      //   con.pointA.y += delta;
      //   con.pointB.x += delta;
      //   body.position.x -= (delta / 2) * Math.sin(body.angle);
      //   body.position.y -= (delta / 2) * Math.cos(body.angle);
      //   nextBody.position.x -= (delta / 2) * Math.cos(nextBody.angle);
      //   nextBody.position.y -= (delta / 2) * Math.sin(nextBody.angle);
      // }
    });
  }
});

// Run the engine
Matter.Engine.run(engine);

// Run the renderer
Matter.Render.run(render);
