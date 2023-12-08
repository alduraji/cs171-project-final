/* * * * * * * * * * * * * * * * * * * * * * * * * * *
*         Aggregate Flight Data (Chord Diagram)       *
* * * * * * * * * * *  * * * * * * * * * * * * * * * */

class AggregateFlightData {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data
        this.displayData = this.data
        this.margin = {top: 250, right: 80, bottom: 10, left: 100};
        this.initVis()
        console.log(this.displayData)
    }

    initVis() {
        let vis = this
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height;
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (vis.margin.left + (vis.width / 2)) + "," + vis.margin.top + ")");

            
        // Tooltip
        vis.tooltip = d3.select("body").append('div')
            .attr('class', "tooltip")
            .attr('id', "chord-tooltip")

        vis.airportNames = {}
        vis.airportNames["ATL"] = "Atlanta"
        vis.airportNames["ORD"] = "Chicago"
        vis.airportNames["DTW"] = "Detroit"
        vis.airportNames["DFW"] = "Dallas"
        this.wrangleData(1990, 2009)
    }

    wrangleData(yearStart, yearEnd) {
        let vis = this
        console.log(yearStart)
        // Filter by year
        vis.displayData = vis.data.filter(function(d) {
            let year = Number(d.date.split("-")[0])
            return (year >= yearStart && year <= yearEnd)
        })

        // Get origin airport data
        vis.allAirportsSet = new Set()
        vis.displayData.forEach(function(d) {
            vis.allAirportsSet.add(d.originAirport)
            vis.allAirportsSet.add(d.destAirport)
        })

        vis.allAirports = Array.from(vis.allAirportsSet)
        vis.allAirports.sort()

        // Filter data by year
        vis.displayData = vis.displayData.filter(function(d) {
            let year = Number(d.date.split("-")[0])
            return (year >= yearStart && year <= yearEnd)
        })

        vis.matrix = {}
        vis.allAirports.forEach(function(d) {
            vis.matrix[d] = {}
            vis.allAirports.forEach(function(e) {
                vis.matrix[d][e] = 0
            })
        })

        // vis.matrix[i][j] = number of flights from i to j
        vis.displayData.forEach(function(d) {
            if (d.originAirport === d.destAirport) {
                return
            }
            vis.matrix[d.originAirport][d.destAirport] += 1
        })
        console.log(vis.matrix)

        // Initialize the array
        vis.matrixNums = []
        for (let i = 0; i < vis.allAirports.length; i++) {
            let newArr = []
            for (let j = 0; j < vis.allAirports.length; j++) {
                newArr.push(vis.matrix[vis.allAirports[i]][vis.allAirports[j]])
            }
            vis.matrixNums.push(newArr)
        }

        console.log(vis.matrixNums)
        this.updateVis()
    }

    updateVis() {
        let vis = this
        vis.res = d3.chord()
            .padAngle(0.05)     // padding between entities (black arc)
            .sortSubgroups(d3.descending)
            (vis.matrixNums)
        console.log(vis.res)

        vis.colorScale = d3.scaleOrdinal()
            .domain(vis.allAirports)
            .range(["#be7058", "#ff8560", "#b4e2ed", "#50ddff"]);

        d3.selectAll(".chord").remove()
        d3.selectAll(".groups").remove()

        // Links between groups
        vis.chords = vis.svg
            .datum(vis.res)
            .append("g")
            .attr("class", "chord")
            .selectAll("path")
            .data(function(d) { return d; })
            .enter()
            .append("path")
            .attr("d", d3.ribbon()
                .radius(200)
            )
            .style("fill", function(d){ return vis.colorScale(d.source.index)})
            .style("stroke", "black");

        // this group object use each group of the data.groups object
        vis.group = vis.svg
            .datum(vis.res)
            .append("g")
            .attr("class", "groups")
            .selectAll("g")
            .data(function(d) { return d.groups; })
            .enter()

        vis.innerRadius = 190
        vis.outerRadius = 200
        // add the group arcs on the outer part of the circle
        let arcs = vis.group.append("g")
        arcs.append("path")
            .style("fill", function(_, i) { return vis.colorScale(i) })
            .style("stroke", "black")
            .attr("d", d3.arc()
                .innerRadius(vis.innerRadius)
                .outerRadius(vis.outerRadius)
            )

        // Add labels for each arc
        arcs.append("text")
            .text(function(d){return(vis.airportNames[vis.allAirports[d.index]])})
            .attr("transform", function(d) {
                if (d.index === 0) {
                    return "translate(" + (vis.outerRadius) + "," + (-1 * vis.outerRadius) + ")"
                } else if (d.index === 1) {
                    return "translate(" + (vis.outerRadius) + "," + (vis.outerRadius + 8) + ")"
                } else if (d.index === 2) {
                    return "translate(" + (-1 * vis.outerRadius - 60) + "," + (vis.outerRadius + 10) + ")"
                } else if (d.index === 3) {
                    return "translate(" + (-1 * vis.outerRadius - 60) + "," + (-1 * vis.outerRadius) + ")"
                }
            })
            .attr("class", "group-label")


        // Add the ticks
        let ticks = vis.group
            .selectAll(".group-tick")
            .data(function(d) { return groupTicks(d, 2500); })    // Controls the number of ticks: one tick each 25 here.

        let tickGroups = ticks.enter()
            .append("g")
            .merge(ticks)
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })

        tickGroups.append("line")               // By default, x1 = y1 = y2 = 0, so no need to specify it.
            .merge(tickGroups)
            .attr("x2", 6)
            .attr("stroke", "black")


        // Add the labels of a few ticks:
        let tickLabels = vis.group
            .selectAll(".group-tick-label")
            .data(function(d) { return groupTicks(d, 2500); })

        tickLabels.enter()
            .filter(function(d) { return d.value % 2500 === 0; })
            .append("g")
            .merge(tickLabels)
            .attr("transform", function(d) { return "rotate(" + (d.angle * 180 / Math.PI - 90) + ") translate(" + 200 + ",0)"; })
            .append("text")
            .attr("x", 8)
            .attr("dy", ".35em")
            .attr("transform", function(d) { return d.angle > Math.PI ? "rotate(180) translate(-16)" : null; })
            .style("text-anchor", function(d) { return d.angle > Math.PI ? "end" : null; })
            .text(function(d) { return d.value })
            .style("font-size", 9)

        // Returns an array of tick angles and values for a given group and step.
        function groupTicks(d, step) {
            let k = (d.endAngle - d.startAngle) / d.value;
            return d3.range(0, d.value, step).map(function(value) {
                return {value: value, angle: value * k + d.startAngle};
            });
        }

        // Add tooltip
        vis.chords.enter().merge(vis.chords)
             // change color be black
            .attr('pointer-events', 'all')
            .on('mouseover', function(event, d){
                let originAirport = vis.allAirports[d.source.index]
                let destAirport = vis.allAirports[d.target.index]
                d3.select(this)
                    .style('fill', '#dbc9b0');
                vis.tooltip
                    .style("opacity", 1)
                    .style("left", event.pageX + 20 + "px")
                    .style("top", event.pageY + "px")
                    .html(`
                <div">
                    <div>
                        <h3 class="standard-text">${originAirport} to ${destAirport}</h3>
                        <p class="subtext" >Number of flights: <em>${vis.matrix[originAirport][destAirport]}</em><p>
                    </div>
                    <div>
                        <h3 class="standard-text">${destAirport} to ${originAirport}</h3>
                        <p class="subtext" >Number of flights: <em>${vis.matrix[destAirport][originAirport]}</em><p>   
                    </div>
                </div>`)
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .style('fill', vis.colorScale(d.source.index));
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })
    }


}