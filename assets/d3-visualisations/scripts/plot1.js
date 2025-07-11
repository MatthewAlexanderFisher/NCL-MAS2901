const margin = { top: 20, right: 20, bottom: 30, left: 50 };
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Scales
const x = d3.scaleLinear().domain([-5, 5]).range([0, width]);
const y = d3.scaleLinear().domain([-2, 2]).range([height, 0]);

// Axes
svg.append("g")
    .attr("transform", `translate(0,${height})`)
    .call(d3.axisBottom(x));
svg.append("g").call(d3.axisLeft(y));

// Add a simple plot
svg.append("path")
    .datum(d3.range(-5, 5.1, 0.1).map(d => ({ x: d, y: Math.sin(d) })))
    .attr("fill", "lightblue")
    .attr("stroke", "none")
    .attr("d", d3.area()
        .x(d => x(d.x))
        .y0(d => y(d.y - 0.5))
        .y1(d => y(d.y + 0.5)));

svg.append("path")
    .datum(d3.range(-5, 5.1, 0.1).map(d => ({ x: d, y: Math.sin(d) })))
    .attr("fill", "none")
    .attr("stroke", "black")
    .attr("stroke-width", 2)
    .attr("d", d3.line()
        .x(d => x(d.x))
        .y(d => y(d.y)));
