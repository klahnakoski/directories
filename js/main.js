

// Select the <svg> element by its id
const svg = d3.select('#main-svg');

// Define data for circles
const circles = [
    { cx: 50, cy: 50, r: 20, fill: 'orange' },
    { cx: 120, cy: 90, r: 20, fill: 'purple' },
    { cx: 200, cy: 60, r: 20, fill: 'green' },
    { cx: 280, cy: 30, r: 20, fill: 'blue' },
];

// Define data for lines connecting circles (edges)
const links = [
    { source: 0, target: 1 },
    { source: 0, target: 2 },
    { source: 0, target: 3 },
];

// Create a force simulation
const simulation = d3.forceSimulation(circles)
    .force('charge', d3.forceManyBody().strength(-30)) // Repulsive force
    .force('link', d3.forceLink(links).id((d, i) => i).strength(0.1))
    .force('x', d3.forceX(200).strength(4e-3)) 
    .force('y', d3.forceY(150).strength(4e-3))
    ;


// Add circles to the simulation
const circleElements = svg.selectAll('circle')
    .data(circles)
    .enter()
    .append('circle')
    .attr('cx', d => d.cx)
    .attr('cy', d => d.cy)
    .attr('r', d => d.r)
    .attr('fill', d => d.fill);

// Add lines (edges) to the simulation
const lineElements = svg.selectAll('line')
    .data(links)
    .enter()
    .append('line')
    .attr('stroke', 'black') // Customize line color

// Update circle and line positions in each tick of the simulation
simulation.velocityDecay(1e-2).alphaDecay(1e-2).on('tick', () => {
    circleElements
        .attr('cx', d => d.x)
        .attr('cy', d => d.y);

    lineElements
        .attr('x1', d => d.source.x)
        .attr('y1', d => d.source.y)
        .attr('x2', d => d.target.x)
        .attr('y2', d => d.target.y);
});
