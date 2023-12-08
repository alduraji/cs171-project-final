/* * * * * * * * * * * * * *
*         Dot Graph        *
* * * * * * * * * * * * * */

class DotGraph {

    // constructor method to initialize Timeline object
    constructor(parentElement, etiquetteData) {
        this.parentElement = parentElement;
        // Separate etiquette data into frequency and recline frequency
        let vis = this
        vis.reclineFrequency = []
        vis.frequency = []
        this.frequencyData = etiquetteData.map(function(d) {
            if (d.reclineFrequency === "" || d.frequency === "") {
                return null
            }

            vis.reclineFrequency.push(d.reclineFrequency)
            vis.frequency.push(d.frequency)
            return {
                reclineFrequency: d.reclineFrequency,
                frequency: d.frequency
            }
        })
        // Remove null from frequency data
        this.frequencyData = this.frequencyData.filter(function(d) {
            return d != null
        })

        // Get cumulative counts for each frequency and recline frequency pair
        this.counts = {}
        this.counts_norm = {}
        this.frequency.forEach(function(d) {
            vis.counts[d] = {}
            vis.counts_norm[d] = {}
            vis.reclineFrequency.forEach(function(d2) {
                vis.counts[d][d2] = 0
                vis.counts_norm[d][d2] = 0
            })
        })
        this.frequencyData.forEach(function(d) {
            vis.counts[d.frequency][d.reclineFrequency] = (vis.counts[d.frequency][d.reclineFrequency] || 0) + 1
        })

        // Normalize the data for each d.frequency value
        this.sums = {}
        Object.keys(this.counts).forEach(function(d) {
            let sum = 0
            Object.keys(vis.counts[d]).forEach(function(d2) {
                sum += vis.counts[d][d2]
            })
            vis.sums[d] = sum
            Object.keys(vis.counts[d]).forEach(function(d2) {
                vis.counts_norm[d][d2] = vis.counts[d][d2] / sum
            })
        })
        console.log(vis.counts)
        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        // margin conventions
        vis.margin = {top: 100, right: 100, bottom: 100, left: 150};

        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .style("margin", "auto")
            .append("g")
            // center this group
            .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");


        // Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', "chord-tooltip")

        // Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', "chord-tooltip")

        // call next method in pipeline
        this.wrangleData();


    }

    // wrangleData method
    wrangleData() {
        let vis = this;
        vis.updateVis();
    }

    // updateVis method
    updateVis() {
        let vis = this;

        // Add axis
        vis.x = d3.scaleBand()
            .range([0, vis.width])
            .domain(["Once a year or less", "Once a month or less", "A few times per month", "A few times per week", "Every day"]);

        vis.svg.append("g")
            .call(d3.axisBottom(vis.x))
            .attr("transform", "translate(0," + vis.height + ")")

        vis.y = d3.scaleBand()
            .range([vis.height, 0])
            .domain(["Never", "Once in a while", "About half the time", "Usually", "Always"])

        // Add labels to axis
        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", -100)
            .attr("y", -30)
            .text("Frequency of reclining seat");

        vis.svg.append("text")
            .attr("class", "axis-label")
            .attr("x", vis.width / 2 - 120)
            .attr("y", vis.height + vis.margin.bottom - 30)
            .text("Frequency of travel");

        vis.svg.append("g")
            .call(d3.axisLeft(vis.y))

        vis.circles = vis.svg.append('g')
            .selectAll("dot")
            .data(vis.frequencyData)
            .enter()
            .append("circle")
            .attr("cx", function (d) {
                return vis.x(d.frequency);
            })
            .attr("cy", function (d) {
                return vis.y(d.reclineFrequency);
            })
            .attr("r", function(d) {
                return vis.counts_norm[d.frequency][d.reclineFrequency] * 20
            })
            // translate to match ticks
            .attr("transform", "translate(" + vis.x.bandwidth() / 2 + "," + vis.y.bandwidth() / 2 + ")")
            .style("fill", "black")

        // Add tooltip
        vis.circles.enter().merge(vis.circles)
            .attr('pointer-events', 'all')
            .on('mouseover', function(event, d){
                let reclineFrequency = d.reclineFrequency
                let frequency = d.frequency
                let counts = vis.counts[frequency][reclineFrequency]
                let sum = vis.sums[frequency]
                let percentage = vis.counts_norm[frequency][reclineFrequency]
                d3.select(this)
                    .style('fill', 'red');
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                <div>
                        <p  class="standard-text" style="font-weight: lighter">Out of the passangers who flew: <em>${frequency}</em>, 
                        <br/>
                        <b>${Math.round(percentage * 100)}%</b> said that they recline their seat <em>${reclineFrequency}</em>.<p>
                </div>`)
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .style('fill', "black");
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
    }
}
