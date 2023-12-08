/* * * * * * * * * * * * * * * * * * * * * * * * * * *
*          FlightMap Visualisation Class             *
* * * * * * * * * * *  * * * * * * * * * * * * * * * */

class FlightMap {
    constructor(selector) {

        // URLs for data files
        const urls = {
            map: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json",
            airports: "https://gist.githubusercontent.com/alduraji/b79d67bfeb53e2d09fed81653d9b934f/raw/a0601004022498be242e061b0d982ea2d871147c/airports.csv",
            flights: "https://gist.githubusercontent.com/alduraji/8069612023b3642201d89c22733188dc/raw/6520359bb531d63133c1d132e101a955c5ee038f/flights.csv",
        }
        

        this.selector = selector;
        this.svg = d3.select(selector).append('svg')
            .attr('viewBox', '0 0 960 600')
            .attr('width', '100%')
            .attr('height', '100%')
            .attr('transform', `translate(${190}, ${0})`);

        this.width = 960;
        this.height = 600;
        this.hypotenuse = Math.sqrt(this.width * this.width + this.height * this.height);

        this.projection = d3.geoAlbers().scale(1280).translate([480, 300]);

        this.scales = {
            airports: d3.scaleSqrt().range([4, 18]),
            segments: d3.scaleLinear().domain([0, this.hypotenuse]).range([1, 10])
        };


        this.g = {
            basemap: this.svg.append("g").attr("id", "basemap"),
            flights: this.svg.append("g").attr("id", "flights"),
            airports: this.svg.append("g").attr("id", "airports"),
            voronoi: this.svg.append("g").attr("id", "voronoi"),
        };

        this.tooltip = d3.select(this.selector)  // Attach the tooltip to the main visualization container.
            .append("div")
            .attr("class", "tooltip")
            .attr('id', 'flight-tooltip')
            .style("opacity", 0)
            .style("position", "absolute")
            .style("pointer-events", "none") // Ensure the tooltip does not capture mouse events
            .style("visibility", "hidden");  // Initially, the tooltip is invisible


        this.loadData(urls.map, urls.airports, urls.flights);

        }

    loadData(mapUrl, airportsUrl, flightsUrl) {
        const promises = [
            d3.json(mapUrl),
            d3.csv(airportsUrl, this.typeAirport.bind(this)),
            d3.csv(flightsUrl, this.typeFlight.bind(this))
        ];

        Promise.all(promises).then(([us, airports, flights]) => {
            this.drawMap(us);
            this.processData(airports, flights);
        });

    }

    drawMap(us) {
        // Remove non-continental states
        us.objects.states.geometries = us.objects.states.geometries.filter(this.isContinental);

        const land = topojson.merge(us, us.objects.states.geometries);
        const path = d3.geoPath();

        // Draw base map
        this.g.basemap.append("path")
            .datum(land)
            .attr("class", "land")
            .attr("d", path);

        // Draw interior borders
        this.g.basemap.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a !== b))
            .attr("class", "border interior")
            .attr("d", path);

        // Draw exterior borders
        this.g.basemap.append("path")
            .datum(topojson.mesh(us, us.objects.states, (a, b) => a === b))
            .attr("class", "border exterior")
            .attr("d", path);
    }

    processData(airports, flights) {
        // Convert airports array (pre-filter) into map for fast lookup
        const iata = new Map(airports.map(node => [node.iata, node]));
    
        // Calculate incoming and outgoing degree based on flights
        flights.forEach(link => {
            link.source = iata.get(link.origin);
            link.target = iata.get(link.destination);
    
            if (link.source) link.source.outgoing += link.count;
            if (link.target) link.target.incoming += link.count;
        });

        // Sort and slice flights.
        flights.sort((a, b) => d3.descending(a.count, b.count));
        flights = flights.slice(0, 200);
        
        // Define the thickness scale based on the extent of the flight count after filtering.
        const countExtent = d3.extent(flights, d => d.count);
        this.scales.thickness = d3.scaleLinear()
            .domain(countExtent)
            .range([1, 10]); // Define a range from 1px to 10px for stroke thickness.

        // Sort airports by the number of outgoing flights
        airports.sort((a, b) => d3.descending(a.outgoing, b.outgoing));
    
        // Keep only the top 50 airports
        const oldLength = airports.length;
        airports = airports.slice(0, 50);
        console.log(" removed: " + (oldLength - airports.length) + " airports with low outgoing degree");
    
        // Filter operations as per your requirements
        airports = this.filterAirports(airports);
        flights = this.filterFlights(flights, iata);
    
        // Draw airports and flights
        this.drawAirports(airports);
        this.drawFlights(flights);
    }    

    drawAirports(airports) {
        const extent = d3.extent(airports, d => d.outgoing);
        this.scales.airports.domain(extent);
    
        this.g.airports.selectAll("circle.airport")
            .data(airports, d => d.iata)
            .join("circle")
            .attr("r", d => this.scales.airports(d.outgoing))
            .attr("cx", d => d.x)
            .attr("cy", d => d.y)
            .attr("class", "airport")
            .on("mouseover", (event, d) => this.onMouseoverAirport(event, d))
            .on("mouseout", (event, d) => this.onMouseoutAirport(event, d));
    }

    drawFlights(flights) {
        const lineGenerator = d3.line()
            .curve(d3.curveBundle.beta(0.5))
            .x(d => d.x)
            .y(d => d.y);
    
        // Make sure that the flights array items have a source and target with x, y coordinates.
        // The source and target need to have been replaced with the corresponding airport objects
        // with x, y coordinates in the processData method.
    
        // Create flight paths
        this.g.flights.selectAll("path.flight")
            .data(flights)
            .join("path")
            .attr("class", "flight")
            .attr("d", d => {
                // Generate points only if source and target have been set up correctly.
                if (d.source && d.target) {
                    const points = [d.source, { x: (d.source.x + d.target.x) / 2, y: (d.source.y + d.target.y) / 2 }, d.target];
                    return lineGenerator(points);
                }
                return null; // If source or target is not available, return null path.
            })
            .attr("id", d => `flight-${d.source.iata}-${d.target.iata}`) // Add an ID to each path for selection
            .attr("stroke", "black") // Make sure the path is visible by setting a stroke.
            .attr("fill", "none")
            .style("stroke-width", d => this.scales.thickness(d.count)); 
    }
    

    onMouseoverAirport(event, airport) {
    
        // Highlight the circle
        d3.select(event.target).classed("highlight", true);
    
        // Show the tooltip with airport name and total flight count
        this.tooltip
            .html(`<p class="standard-text">${airport.name} (${airport.iata})</p>`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY + 10}px`)
            .style("visibility", "visible")
            .style("opacity", 1);
        
        // Also, select all flights connected to this airport and highlight them
        this.g.flights.selectAll(`path.flight[id*="${airport.iata}"]`)
            .classed("highlight", true)
            .raise(); // Bring highlighted paths to the top

    }   
     
    onMouseoutAirport(event, airport) {
        // Remove highlight from the circle
        d3.select(event.target).classed("highlight", false);
    
        // Remove highlight from the flight paths
        d3.selectAll(airport.flights)
            .classed("highlight", false);
    
        // Hide the tooltip
        this.tooltip.style("visibility", "hidden");

        // Also, de-highlight all flights connected to this airport
        this.g.flights.selectAll(`path.flight[id*="${airport.iata}"]`)
            .classed("highlight", false);

    }    

    filterAirports(airports) {
        // implement filtering logic here, similar to the original script
        // remember to use this.projection, this.width, and this.height

        airports = airports.filter(airport => airport.x >= 0 && airport.y >= 0);
        airports = airports.filter(airport => airport.state !== "NA");
        airports = airports.filter(airport => airport.outgoing > 0 && airport.incoming > 0);
        airports.sort((a, b) => d3.descending(a.outgoing, b.outgoing));
        airports = airports.slice(0, 50);

        return airports;
    }

    filterFlights(flights, iata) {
        // implement filtering logic here, similar to the original script

        flights = flights.filter(link => iata.has(link.source.iata) && iata.has(link.target.iata));

        return flights;
    }

    // Determine which states belong to the continental United States
    isContinental(state) {
        const id = parseInt(state.id);
        return id < 60 && id !== 2 && id !== 15;
    }

    // Parse airport data
    typeAirport(airport) {
        airport.longitude = parseFloat(airport.longitude);
        airport.latitude = parseFloat(airport.latitude);

        // Use projection hard-coded to match topojson data
        const coords = this.projection([airport.longitude, airport.latitude]);
        airport.x = coords[0];
        airport.y = coords[1];

        airport.outgoing = 0;
        airport.incoming = 0;
        airport.flights = [];

        return airport;
    }

    // Parse flight data
    typeFlight(flight) {
        flight.count = parseInt(flight.count);
        return flight;
    }

    // Calculate the distance between two points (used in various places)
    distance(source, target) {
        const dx2 = Math.pow(target.x - source.x, 2);
        const dy2 = Math.pow(target.y - source.y, 2);
        return Math.sqrt(dx2 + dy2);
    }
}
