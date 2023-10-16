// Create an engine
var engine = Matter.Engine.create();

engine.gravity.x = 0;
engine.gravity.y = 0;
engine.timing.timeScale = 1;

const airFriction = 0.1;
const restitution = 0.5;
const angularResistance = 0.999;
const slop = 0.0;
const density = 0.001;
const degree90 = Math.PI / 2;

// Create a renderer for visualization
var render = Matter.Render.create({
  element: document.body,
  engine: engine,
});

// Create a circle and a line (represented by a thin rectangle in this case)
var circle = Matter.Bodies.circle(250, 250, 50, { restitution, airFriction });

// Add all bodies to the world
Matter.World.add(engine.world, [circle]);

// Usage:
const quads = [];

createSquare({x:250, y:250}, 300, {
  density,
  slop,
  restitution,
  airFriction,
  angularResistance,
});

function applyCenteringForce(body, centerX, centerY) {
  const strength = 0.0001; // Adjust this value as needed

  // Calculate the distance from the body to the center
  let dx = centerX - body.position.x;
  let dy = centerY - body.position.y;

  // zero out the angular velocity
  Matter.Body.setAngularVelocity(body, body.angularVelocity / 2);

  // Apply the force
  Matter.Body.applyForce(body, body.position, {
    x: dx * strength,
    y: dy * strength,
  });
}

function getOriginalVertices(body) {
  const pos = body.position;
  const angle = body.angle;
  const vertices = body.vertices.map((v) => {
    return chain(v).sub(pos).rotate(-angle).add(pos).get();
  });
  return vertices;
}

const stretchFactor = 1e-2;

Matter.Events.on(engine, "afterUpdate", function () {
  const centerX = 400; // Adjust to the desired center X position
  const centerY = 300; // Adjust to the desired center Y position
  for (let body of engine.world.bodies) {
    applyCenteringForce(body, centerX, centerY);
  }
  for (let quad of quads) quad.afterUpdate();
});

// Run the engine
Matter.Engine.run(engine);

// Run the renderer
Matter.Render.run(render);
