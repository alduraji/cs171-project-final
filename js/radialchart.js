/* * * * * * * * * * * * * *
*       Radial Chart       *
* * * * * * * * * * * * * */

class RadialChart {
    constructor(parentElement, data) {
        this.parentElement = parentElement;
        this.data = data;
            
        // Bind methods
        this.showTooltip = this.showTooltip.bind(this);
        this.moveTooltip = this.moveTooltip.bind(this);
        this.hideTooltip = this.hideTooltip.bind(this);

        this.initVis();
    }

    convertDateFormat(input) {
        let [day, month, year] = input.split("-");
        return new Date(`${year}-${month}-${day}`);
    }

    showTooltip(event, d) {
        console.log("Tooltip position:", event.pageX, event.pageY); // Add this line for debugging
        d3.select("#tip")
            .style("opacity", 1)
            .html(`<div class="standard-text">Date: ${d.date.toLocaleDateString()}</div><div class="subtext">Passengers: ${d.passengers}</div>`)
            .style("left", (event.pageX + 10) + "px")
            .style("top", (event.pageY + 10) + "px");
    }
    
        
    moveTooltip(event) {
    d3.select("#tip")
        .style("left", (event.pageX + 10) + "px")
        .style("top", (event.pageY + 10) + "px");
    }

    hideTooltip() {
    d3.select("#tip").style("opacity", 0);
    }

    initVis() {
        let vis = this;
        
        // margin conventions
        vis.margin = {top: 20, right: 50, bottom: 40, left: 50};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;
    
        // consts
        const innerRadius = 100; // Fixed inner radius
        const outerRadius = Math.min(vis.width, vis.height) / 2 - 10; // Dynamic based on the size
    
        // SVG drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", `translate(${vis.width / 2 + vis.margin.left}, ${vis.height / 2 + vis.margin.top})`);
    
        // Convert the date strings into JavaScript Date objects
        vis.data.forEach(d => {
            d.date = this.convertDateFormat(d.Date);
            d.passengers = +d.Passengers;
        });
    
        // Create a group for labels
        vis.labelsGroup = vis.svg.append("g")
            .attr("class", "passenger-label");

        // Create a group for gray segments
        vis.segmentsGroup = vis.svg.append("g")
            .attr("class", "segments");

        // Scales and generator
        vis.x = d3.scaleUtc()
            .domain(d3.extent(vis.data, d => d.date)) // Use the extent of the data
            .range([0, 2 * Math.PI]);
    
        vis.y = d3.scaleRadial()
            .domain([0, d3.max(vis.data, d => d.passengers)])
            .range([innerRadius, outerRadius]);
    
        vis.line = d3.lineRadial()
            .angle(d => vis.x(d.date))
            .curve(d3.curveLinearClosed);
    
        // Add the radial line path
        vis.svg.append("path")
            .attr("fill", "none")
            .attr("stroke", "#ff8560")
            .attr("stroke-width", 2)
            .attr("d", vis.line
                .radius(d => vis.y(d.passengers))
            (vis.data));   

            vis.data.forEach(d => {
                const angle = vis.x(d.date) - Math.PI / 2; // Adjust angle to account for coordinate system; D3's scale starts from the 12 o'clock position
                const radius = vis.y(d.passengers);
            
                const cx = Math.cos(angle) * radius;
                const cy = Math.sin(angle) * radius;
            
                vis.svg.append("circle")
                    .attr("class", "data-point")
                    .attr("r", 5)
                                .attr("cx", cx)
                                .attr("cy", cy)
                                .attr("fill", "transparent")
                                .on("mouseover", (event) => this.showTooltip(event, d))
                                .on("mousemove", (event) => this.moveTooltip(event))
                                .on("mouseout", () => this.hideTooltip());
                        });
                        

                    // Add month radial axes and month labels
                    const months = d3.utcMonth.range(new Date("2022-01-01"), new Date("2022-12-31"));
                    const monthFormat = d3.utcFormat("%B");

                    vis.svg.selectAll(".month-axis")
                        .data(months)
                        .enter()
                        .append("path")
                        .attr("class", "month-axis")
                        .attr("stroke", "#000")
                        .attr("stroke-opacity", 0.2)
                        .attr("d", d => {
                            //console.log(vis.x(d));    pass
                            return `
                                M${d3.pointRadial(vis.x(d), innerRadius)}
                                L${d3.pointRadial(vis.x(d), outerRadius)}
                            `;
                        });
                    // Add concentric circles for passenger numbers and labels
                    const passengerTicks = vis.y.ticks(5); // Number of ticks can be adjusted

                    vis.svg.selectAll(".passenger-circle")
                        .data(passengerTicks)
                        .enter()
                        .append("circle")
                        .attr("class", "passenger-circle")
                        .attr("fill", "none")
                        .attr("stroke", "currentColor")
                        .attr("stroke-opacity", 0.2)
                        .attr("r", d => vis.y(d));

                    // Create invisible arcs for anchoring the month labels
                    vis.svg.selectAll(".month-arc")
                        .data(months)
                        .enter()
                        .append("path")
                        .attr("class", "month-arc")
                        .attr("id", (d, i) => `month-arc-${i}`)
                        .style("fill", "none")
                        .style("stroke", "none")
                        .attr("d", d => {
                            const startAngle = vis.x(d);
                            const endAngle = vis.x(d3.utcMonth.offset(d, 1));
                            //console.log("startAngle:", startAngle); --> good
                            //console.log("endAngle:", endAngle);     --> good
                            const start = d3.pointRadial(startAngle, outerRadius);
                            const end = d3.pointRadial(endAngle, outerRadius);
                            return `M${start[0]},${start[1]}A${outerRadius},${outerRadius} 0 0,1 ${end[0]},${end[1]}`;
                        });

                    // Append month names using textPath referencing the defined arcs
                    vis.svg.selectAll(".month-label")
                        .data(months)
                        .enter()
                        .append("text")
                        .attr("class", "month-label")
                        // We position the text in the middle of the arc path using `dy` and by setting the alignment baseline
                        .attr("dy", (d) => (monthFormat(d) === "February") ? "-1.5em" : "1em") // Adjust dy for "February"
                        .attr("letter-spacing", (d) => (monthFormat(d) === "February") ? "normal" : "normal") // Adjust font style for "February"
                        .attr("font-size", (d) => (monthFormat(d) === "February") ? "1.1rem" : "1rem") // Adjust font size for "February"
                        .attr("fill", "black") // Remove red color
                        .style("text-anchor", "middle")
                        .append("textPath")
                        // Use `href` to reference the arcs for the month labels (SVG 2 syntax)
                        .attr("href", (d, i) => `#month-arc-${i}`)
                        .attr("startOffset", "50%") // Centralize the text along the path
            .text(d => (monthFormat(d) === "February") ? "February" : monthFormat(d));
            
        // Add Color Block for Legend
        vis.svg.append("rect")
            .attr("x", -50) // Adjust x position to align with the text
            .attr("y", -20)  // Adjust y position to place below the text
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", "#ff8560");
    
        // add color block for gray
        vis.svg.append("rect")
            .attr("x", -50) // Adjust x position to align with the text
            .attr("y", 10)  // Adjust y position to place below the text
            .attr("width", 25)
            .attr("height", 25)
            .attr("fill", "gray");

            let legendText = vis.svg.append("text")
            .attr("x", -20) // Adjust to align with the rectangle
            .attr("y", -5) // Adjust to align with the rectangle
            .attr("text-anchor", "start")
            .style("font-size", "12px"); // Adjust font size as needed
        
        // First line of text
        legendText.append("tspan")
            .attr("x", -15)
            .attr("dy", "-5")
            .text("number of");
        
        // Second line of text
        legendText.append("tspan")
            .attr("x", -15)
            .attr("dy", "10") // This value controls the line spacing
            .text("passengers");
        
        // Third line of text
        legendText.append("tspan")
            .attr("x", -15)
            .attr("dy", "26") // This value controls the line spacing
            .attr("font-style", "italic")
            .text("transitions");

        vis.labelsGroup = vis.svg.selectAll(".passenger-label")
            .data(passengerTicks)
            .enter()
            .append("text")
            .attr("class", "passenger-label")
            .attr("y", d => -vis.y(d))
            .attr("dy", "0.35em")
            .attr("text-anchor", "middle")
            .attr("fill", "black")
            .style("font-size", "12px")
            .style("font-weight", "400")
            .style("text-shadow", "1px 1px 1px rgba(0, 0, 0, 0.5)") 
            .style("letter-spacing", ".5px")
            .text(d => d);

        // call wrangleData
        vis.wrangleData();
    }

    wrangleData() {
        let vis = this;
        vis.updateVis();
    }

    updateVis() {
        let vis = this;
      
        // Threshold for passenger change
        const threshold = 175483; // specific to this dataset, cant be 175,483 + 1

        // Calculate differences and store the indexes where the threshold is exceeded
        let indexesAboveThreshold = [];
        for (let i = 1; i < vis.data.length; i++) {
          let diff = Math.abs(vis.data[i].passengers - vis.data[i - 1].passengers);
          if (diff > threshold) {
            indexesAboveThreshold.push(i);
          }
        }
      
        // Draw gray segments on the indexes identified
        indexesAboveThreshold.forEach(index => {
          let startPoint = vis.data[index - 1];
          let endPoint = vis.data[index];
      
          // Define a custom line generator for the segment
          let segmentLine = d3.lineRadial()
            .angle(d => vis.x(d.date))
            .radius(d => vis.y(d.passengers))
            .curve(d3.curveLinearClosed);
      
          // Draw the segment
          vis.svg.append("path")
            .datum([startPoint, endPoint]) // Data for the start and end points
            .attr("class", "segment")
            .attr("fill", "none")
            .attr("stroke", "gray") // Gray color for large changes
            .attr("stroke-width", 2)
            .attr("d", segmentLine);
        });

        // Re-append the labels group to bring it to the front
            vis.labelsGroup.raise();
      }
    }      