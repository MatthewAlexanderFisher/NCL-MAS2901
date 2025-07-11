// Generate a fixed set of standard normal samples
const fixedSeed = 42; // Use any constant value for reproducibility
const fixedRandomNormal = d3.randomNormal.source(d3.randomLcg(fixedSeed))(0, 1);
const fixedSamples = Array.from({ length: 1000 }, fixedRandomNormal);

// Function to calculate PDF
function calculatePDF(mean, variance, xValues) {
    const pdf = (x, mean, variance) =>
        (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-((x - mean) ** 2) / (2 * variance));
    return xValues.map(x => ({ x, y: pdf(x, mean, variance) }));
}

// Function to draw the plot
function drawPlot(plotGroup, width, height, margin, theme) {
    const xScale = d3.scaleLinear().domain([-10, 10]).range([0, width]);
    const yScale = d3.scaleLinear().range([height, 0]);

    // Define colours based on the theme
    const backgroundColor = theme === "dark" ? "#121212" : "#fff";
    const textColor = theme === "dark" ? "#fff" : "#121212";
    const barColor = theme === "dark" ? "orange" : "red";
    const pdfLineColor = theme === "dark" ? "blue" : "red";

    // Apply background colour to the container
    d3.select("#chart").style("background-color", backgroundColor);

    // Add axes
    const xAxis = plotGroup.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale));

    xAxis.selectAll("text").style("fill", textColor);
    xAxis.selectAll("path, line").style("stroke", textColor);

    const yAxis = plotGroup.append("g").call(d3.axisLeft(yScale));

    yAxis.selectAll("text").style("fill", textColor);
    yAxis.selectAll("path, line").style("stroke", textColor);

    // Create histogram and PDF line groups
    const histogramGroup = plotGroup.append("g")
        .attr("class", "histogram-bar");
        
    const pdfLine = plotGroup.append("path")
        .attr("class", "pdf-line")
    //     .attr("stroke", pdfLineColor)
    //     .attr("fill", "none");

    // Function to update the plot based on sliders
    function updatePlot() {
        const mean = +d3.select("#mean").property("value");
        const variance = +d3.select("#variance").property("value");

        d3.select("#mean-value").text(mean.toFixed(1));
        d3.select("#variance-value").text(variance.toFixed(1));

        // Transform fixed samples based on current mean and variance
        const samples = fixedSamples;

        // Generate histogram
        const bins = d3.bin().domain(xScale.domain()).thresholds(30)(samples);

        // Calculate bin densities
        const binWidth = bins[0].x1 - bins[0].x0;
        const densities = bins.map(bin => ({
            x0: bin.x0,
            x1: bin.x1,
            density: bin.length / (samples.length * binWidth),
        }));

        // Calculate PDF
        const xValues = d3.range(-10, 10, 0.1);
        const pdfData = calculatePDF(mean, variance, xValues);

        // Update yScale domain to include both histogram and PDF values
        const maxDensity = Math.max(
            d3.max(densities, d => d.density),
            d3.max(pdfData, d => d.y)
        );
        yScale.domain([0, maxDensity]);

        // Update axes
        yAxis.call(d3.axisLeft(yScale));
        yAxis.selectAll("text").style("fill", textColor);
        yAxis.selectAll("path, line").style("stroke", textColor);

        // Update histogram
        const barWidth = xScale(bins[1].x0) - xScale(bins[0].x0) - 1;
        const bars = histogramGroup.selectAll("rect").data(densities);

        bars.enter()
            .append("rect")
            .merge(bars)
            .attr("x", d => xScale(d.x0))
            .attr("y", d => yScale(d.density))
            .attr("width", barWidth)
            .attr("height", d => height - yScale(d.density));

        bars.exit().remove();

        // Update PDF
        pdfLine
            .datum(pdfData)
            .attr("d", d3.line()
                .x(d => xScale(d.x))
                .y(d => yScale(d.y)));
    }

    // Initial plot update
    updatePlot();

    // Add event listeners to sliders
    d3.select("#mean").on("input", updatePlot);
    d3.select("#variance").on("input", updatePlot);
}

// Function to make the chart responsive
function makeResponsive(container, theme) {
    const margin = { top: 20, right: 30, bottom: 50, left: 50 };

    let width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    // Remove any existing SVG to avoid duplicates
    container.select("svg").remove();

    // Create the responsive SVG
    const svg = container.append("svg")
        .attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
        .attr("preserveAspectRatio", "xMinYMin meet")
        .classed("svg-content-responsive", true);

    const plotGroup = svg.append("g")
        .attr("transform", `translate(${margin.left},${margin.top})`);

    // Draw the plot with the specified theme
    console.log(theme)
    drawPlot(plotGroup, width, height, margin, theme);

    // Redraw the plot on window resize
    window.addEventListener("resize", () => {
        width = container.node().getBoundingClientRect().width - margin.left - margin.right;

        svg.attr("viewBox", `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`);
        plotGroup.selectAll("*").remove(); // Clear previous content
        drawPlot(plotGroup, width, height, margin, theme); // Redraw plot
    });
}

// Initialize responsive plot with light theme as default
document.addEventListener("DOMContentLoaded", function () {
    const container = d3.select("#chart");
    const initialMode = localStorage.getItem("theme") || "light"; // Get theme from localStorage
    document.documentElement.setAttribute("data-theme", initialMode);
    makeResponsive(container, initialMode);
});

// Listen for theme changes
window.addEventListener("message", function (event) {
    if (event.data && event.data.theme) {
        const theme = event.data.theme;
        document.documentElement.setAttribute("data-theme", theme);
        localStorage.setItem("theme", theme);

        // Apply CSS changes for the theme
        updateCSSForMode(theme);

        // Redraw the chart for the new theme
        const container = d3.select("#chart");
        makeResponsive(container, theme);
    }
});



function updateCSSForMode(theme) {
    const backgroundColor = theme === "dark" ? "#121212" : "#fff";
    const textColor = theme === "dark" ? "#fff" : "#121212";

    // Update the body background and text color
    document.body.style.backgroundColor = backgroundColor;
    document.body.style.color = textColor;

    // Update the chart container
    d3.select("#chart").style("background-color", backgroundColor);
}
