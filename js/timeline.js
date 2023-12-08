
/*
 * Timeline - ES6 Class
 * @param  parentElement 	-- the HTML element in which to draw the visualization
 * @param  data             -- the data the timeline should use
 */

class Timeline {

    // constructor method to initialize Timeline object
    constructor(parentElement, data){
        this._parentElement = parentElement;
        this._data = data;

        // No data wrangling, no update sequence
        this._displayData = data;
        this.initVis()
    }

    // create initVis method for Timeline class
    initVis() {

        // store keyword this which refers to the object it belongs to in variable vis
        let vis = this;

        vis.margin = {top: 40, right: 40, bottom: 40, left: 40};

        vis.width = document.getElementById(vis._parentElement).getBoundingClientRect().width;
        vis.height = document.getElementById(vis._parentElement).getBoundingClientRect().height;

        vis.brush_width = 500;
        vis.brush_height = 300;

        // SVG drawing area
        vis.svg = d3.select("#" + vis._parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + vis.margin.left + "," + (vis.margin.top + 50) + ")")


        // Scales and axes
        vis.x = d3.scaleLinear()
            .range([0, vis.brush_width])
            .domain(d3.extent(vis._displayData, function(d) {return d.year; }));

        vis.y = d3.scaleLinear()
            .range([vis.brush_height, 0])
            .domain([0, d3.max(vis._displayData, function(d) {return d.num_flights; })]);


        vis.xAxis = d3.axisBottom()
            .scale(vis.x)
            .tickFormat(d3.format("d"));

        vis.yAxis = d3.axisLeft()
            .scale(vis.y)
            .tickFormat(function (d) {
                if ((d / 1000) >= 1) {
                  d = d / 1000 + "K";
                }
                return d;
              });

        // SVG area path generator
        vis.area = d3.area()
            .x(function(d) { return vis.x(d.year); })
            .y0(vis.brush_height)
            .y1(function(d) { return vis.y(d.num_flights); });

        // Draw area by using the path generator
        vis.svg.append("path")
            .datum(vis._displayData)
            .attr("fill", "#dbc9b0")
            .attr("d", vis.area);

        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.brush_width, vis.brush_height]])
            .on("brush", brushed);

        // Append brush component here
        vis.svg.append("g")
            .attr("class", "x brush")
            .call(vis.brush)
            .selectAll("rect")
            .attr("y", -6)
            .attr("height", vis.brush_height);


        // Append x-axis
        vis.svg.append("g")
            .attr("class", "x-axis axis")
            .attr("transform", "translate(0," + vis.brush_height + ")")
            .call(vis.xAxis);

        vis.svg.append("g")
			.attr("class", "y-axis axis")
            .call(vis.yAxis);

        // Give title
        vis.svg.append("text")
            .attr("x", vis.brush_width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .text("Number of Flights Per Year");
    }
}