/* * * * * * * * * * * * * *
*         Delay Map         *
* * * * * * * * * * * * * */


class DelayMap {

    // constructor method
    constructor(parentElement, geoData, delayData) {
        this.parentElement = parentElement;
        this.delayData = delayData;
        this.geoData = geoData;

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.arrivalToggleValue = document.getElementById('arrival-toggle').checked;

        // margin conventions
        vis.margin = {top: 10, right: 100, bottom: 20, left: 100};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (vis.margin.left + (vis.width / 8)) + "," + vis.margin.top + ")");

        // Init color scale
        vis.color = d3.scaleLinear()
            .range(['#24caf2', '#ff8560'])

        // // Init map
        vis.viewpoint = {'width': 1250, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;

        vis.mapgroup = vis.svg.append('g')
        .attr('transform', `scale(${vis.zoom} ${vis.zoom})`);

        // Create Projection
        vis.projection = d3.geoAlbers()

        // Path generator
        vis.path = d3.geoPath()
        .projection(vis.projection);

        // Topo json --> Geo json
        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.states).features

        // Draw state outlines
        vis.states = vis.mapgroup.selectAll(".state")
            .data(vis.world)
            .enter().append("path")
            .attr('class', 'state')
            .attr('stroke', 'white')
            .attr('fill', 'lightgray')
            .attr("d", vis.path)
        
        // tooltips setup
        vis.tooltip = d3.select("body").append('div')
        .attr('class', "tooltip")
        .attr('id', 'delay-tooltip')

        // Draw Airport Markers
        vis.airports = vis.mapgroup.selectAll(".airport-marker")
            .data(vis.delayData)
            .enter()
            .append("circle")
            .attr('class', 'airport-marker')
            .attr("transform", (d) => {
                let p = vis.projection([d.Lon,d.Lat]);
                return `translate(${p[0]}, ${p[1]})`;
                })
            .attr('opacity', 0.9)
            .attr('stroke', 'white')
        
        // Legend setup
        vis.legend = vis.svg.append("g")
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.width + vis.margin.left - 800}, ${vis.margin.top})`)

        // Linear gradient setup
        vis.defs = vis.svg.append("defs");

        vis.linearGradient = vis.defs.append("linearGradient")
            .attr("id", "linear-gradient-2")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        vis.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#24caf2")

        vis.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#ff8560")
        
        vis.legend.append("rect")
            .attr("width", 300)
            .attr("height", 10)
            .style("fill", "url(#linear-gradient-2)");
            
        // Legend scales + axes
		vis.x = d3.scaleOrdinal()
        .range([0, 300])

		vis.xAxis = d3.axisBottom()
			.scale(vis.x)
            .tickFormat((d) => `${parseFloat(d).toFixed(2)} minutes`)

		vis.legend.append("g")
			.attr("class", "x-axis axis")
            .attr('transform', `translate(${0}, ${10})`)

        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this

        vis.updateVis()

    }

    // updateVis method
    updateVis() {
        let vis = this;

        vis.arrivalToggleValue = document.getElementById('arrival-toggle').checked;

        let ext = d3.extent(vis.delayData, function(d) {
            return vis.arrivalToggleValue ? d.ArrDelay : d.DepDelay;
        })

        vis.color.domain(ext)

        vis.x.domain(ext)
        vis.legend.select(".x-axis")
            .call(vis.xAxis);

        // Draw airports and tooltip
        vis.airports
            .merge(vis.airports)
            .attr('r', (d) => vis.arrivalToggleValue ? d.ArrDelay : d.DepDelay)
            .attr('fill', (d) => vis.arrivalToggleValue ? vis.color(d.ArrDelay) : vis.color(d.DepDelay))
            .on('mouseover', function(event, d){
                d3.select(this)
                    .attr('fill', 'grey');
                vis.tooltip
                .style("opacity", 1)
                .style("left", event.pageX + 20 + "px")
                .style("top", event.pageY + "px")
                .html(`
                    <div">
                        <h3 class="standard-text" >${d.AirportName}<h3>     
                        <h5 class="subtext" > Avg. ${vis.arrivalToggleValue ? 'Arrival' : 'Departure'} Delay: ${parseFloat(d.DepDelay).toFixed(2)} minutes</h5>   
                    </div>`);
            })
            .on('mouseout', function(event, d){
                d3.select(this)
                    .attr('fill', vis.arrivalToggleValue ? vis.color(d.ArrDelay) : vis.color(d.DepDelay));
                vis.tooltip
                    .style("opacity", 0)
                    .style("left", 0)
                    .style("top", 0)
                    .html(``);
            })

        vis.airports.exit().remove();
    }
}