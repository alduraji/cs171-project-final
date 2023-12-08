/* * * * * * * * * * * * * *
*         Etiquette Map         *
* * * * * * * * * * * * * */


class EtiquetteMap {

    // constructor method to initialize Timeline object
    constructor(parentElement, geoData, surveyData) {
        this.parentElement = parentElement;
        this.surveyData = surveyData;
        this.geoData = geoData;
        this.categories = [
            {
                'key': 'Generally speaking, is it rude to say more than a few words tothe stranger sitting next to you on a plane?',
                'text': 'Generally speaking, is it rude to say more than a few words to the stranger sitting next to you on a plane?',
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': 'Given the opportunity, would you eliminate the possibility of reclining seats on planes entirely?',
                'text': 'Given the opportunity, would you eliminate the possibility of reclining seats on planes entirely?',
                'responses': [
                    'No',
                    'Yes'
                ]
            },
            {
                'key': 'Have you ever smoked a cigarette in an airplane bathroom when it was against the rules?',
                'text': 'Have you ever smoked a cigarette in an airplane bathroom when it was against the rules?',
                'responses': [
                    'No',
                    'Yes'
                ]
            },
            {
                'key': "Have you ever used personal electronics during take off or landing in violation of a flight attendant's direction?",
                'text': "Have you ever used personal electronics during take off or landing in violation of a flight attendant's direction?",
                'responses': [
                    'No',
                    'Yes'
                ]
            },
            {
                'key': "In general, is it rude to knowingly bring unruly children on a plane?",
                'text': "In general, is it rude to knowingly bring unruly children on a plane?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "In general, is itrude to bring a baby on a plane?",
                'text': "In general, is it rude to bring a baby on a plane?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is it rude to ask someone to switch seats with you in order to be closer to friends?",
                'text': "Is it rude to ask someone to switch seats with you in order to be closer to friends?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is it rude to wake a passenger up if you are trying to go to the bathroom?",
                'text': "Is it rude to wake a passenger up if you are trying to go to the bathroom?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is itrude to ask someone to switch seats with you in order to be closer to family?",
                'text': "Is it rude to ask someone to switch seats with you in order to be closer to family?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is itrude to move to an unsold seat on a plane?",
                'text': "Is it rude to move to an unsold seat on a plane?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is itrude to recline your seat on a plane?",
                'text': "Is it rude to recline your seat on a plane?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
            {
                'key': "Is itrude to wake a passenger up if you are trying to walk around?",
                'text': "Is it rude to wake a passenger up if you are trying to walk around?",
                'responses': [
                    'No, not at all rude',
                    'Yes, somewhat rude',
                    'Yes, very rude'
                ]
            },
        ]

        // conversion to dict
        var d = this.categories.reduce((d, el) => {
            d[el.key] = {'text': el.text, 'responses': el.responses}
            return d
        }, {})
        this.categoriesDict = d

        // call initVis method
        this.initVis()
    }

    initVis() {
        let vis = this;

        vis.selectedQuestion = vis.categories[0].key

        // add options to select
        let questionSelector = document.getElementById('questionSelector');
        vis.categories.forEach((el, i) => {
            var opt = document.createElement('option');
            opt.value = el.key
            opt.innerHTML = el.text
            questionSelector.appendChild(opt)
        })

        // margin conventions
        vis.margin = {top: 30, right: 100, bottom: 80, left: 100};
        vis.width = document.getElementById(vis.parentElement).getBoundingClientRect().width - vis.margin.left - vis.margin.right;
        vis.height = document.getElementById(vis.parentElement).getBoundingClientRect().height - vis.margin.top - vis.margin.bottom;

        // init drawing area
        vis.svg = d3.select("#" + vis.parentElement).append("svg")
            .attr("width", vis.width + vis.margin.left + vis.margin.right)
            .attr("height", vis.height + vis.margin.top + vis.margin.bottom)
            .append("g")
            .attr("transform", "translate(" + (vis.margin.left + (vis.width / 5)) + "," + vis.margin.top + ")");

        // Init map
        vis.viewpoint = {'width': 1700, 'height': 610};
        vis.zoom = vis.width / vis.viewpoint.width;
       
        vis.map = vis.svg.append("g") // group will contain all state paths
            .attr("class", "states")
            .attr('pointer-events', 'painted')
            .attr('transform', `scale(${vis.zoom} ${vis.zoom})`)
            // .attr('transform', `translate(${vis.width / 2}, 20)`);

        // Draw states
        vis.path = d3.geoPath()

        vis.world = topojson.feature(vis.geoData, vis.geoData.objects.states).features

        vis.regions = ['Pacific', 'Mountain', 'West North Central', 'East North Central', 'Middle Atlantic', 'New England', 'West South Central', 'East South Central', 'South Atlantic']

        // Regions
        var pacific = new Set([
            'California', 'Alaska', 'Hawaii', 'Oregon', 'Washington'
        ]);
        var mountain = new Set([
            'Wyoming', 'Idaho', 'Utah', 'Nevada', 'Montana', 'Arizona', 'New Mexico', 'Colorado'
        ]);
        var wnc = new Set([
            'North Dakota', 'South Dakota', 'Minnesota', 'Nebraska', 'Iowa', 'Kansas', 'Missouri'
        ]);
        var enc = new Set([
            "Wisconsin", 'Michigan', 'Illinois', 'Indiana', 'Ohio'
        ]);
        var midatlantic = new Set([
            'Pennsylvania', 'New York'
        ]);
        var newengland = new Set([
            'Maine', 'New Hampshire', 'Vermont', 'Massachusetts', 'Rhode Island', 'Connecticut', 'New Jersey'
        ]);
        var wsc = new Set([
            'Oklahoma', 'Texas', 'Arkansas', 'Louisiana'
        ]);
        var esc = new Set([
            'Mississippi', 'Alabama', 'Tennessee', 'Kentucky'
        ]);
        var southatlantic = new Set([
            'Delaware', 'West Virginia', 'Virginia', 'North Carolina', 'Maryland', 'South Carolina', 'Georgia', 'Florida'
        ]);


        // Pacific Path
        vis.map.append("path")
         .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return pacific.has(d.properties.name); })))
         .attr('class', 'pacific region')
         .attr('stroke', 'gray')
         .attr('stroke-width', 4)
         .attr('fill', 'orange')
         .attr("d", vis.path);

        // Mountain Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return mountain.has(d.properties.name); })))
        .attr('class', 'mountain region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 4)
        .attr('fill', 'tan')
        .attr("d", vis.path);

        // West North Central Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return wnc.has(d.properties.name); })))
        .attr('class', 'wnc region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'lightblue')
        .attr("d", vis.path);

        // East North Central Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return enc.has(d.properties.name); })))
        .attr('class', 'enc region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'darkgrey')
        .attr("d", vis.path);

        // Midatlantic Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return midatlantic.has(d.properties.name); })))
        .attr('class', 'midatlantic region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'coral')
        .attr("d", vis.path);

        // New England Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return newengland.has(d.properties.name); })))
        .attr('class', 'newengland region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'crimson')
        .attr("d", vis.path);

        // West South Central Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return wsc.has(d.properties.name); })))
        .attr('class', 'wsc region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'darkkhaki')
        .attr("d", vis.path);

        // East South Central Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return esc.has(d.properties.name); })))
        .attr('class', 'esc region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'darkturquoise')
        .attr("d", vis.path);

        // South Atlantic Path
        vis.map.append("path")
        .datum(topojson.merge(vis.geoData, vis.geoData.objects.states.geometries.filter(function(d) { return southatlantic.has(d.properties.name); })))
        .attr('class', 'southatlantic region')
        .attr('stroke', 'gray')
        .attr('stroke-width', 3)
        .attr('fill', 'darkseagreen')
        .attr("d", vis.path);

        // States Outlines
        vis.states = vis.map.selectAll(".state")
        .data(vis.world)
        .enter().append("path")
        .attr('class', 'state')
        .attr('stroke', 'gray')
        .attr('fill', 'None')
        .attr("d", vis.path)

        // Init color scale
        vis.color = d3.scaleLinear().range(['#ff8560', '#24caf2'])

        // tooltips setup
        vis.tooltip = d3.select("body").append('div')
        .attr('class', "tooltip")

        // Legend setup
        vis.legend = vis.svg.append("g")
        .attr('class', 'legend')
        .attr('transform', `translate(${vis.width + vis.margin.left - 900}, ${0})`)

        // Linear gradient setup
        vis.defs = vis.svg.append("defs");

        vis.linearGradient = vis.defs.append("linearGradient")
            .attr("id", "linear-gradient")
            .attr("x1", "0%")
            .attr("y1", "0%")
            .attr("x2", "100%")
            .attr("y2", "0%");

        vis.linearGradient.append("stop")
            .attr("offset", "0%")
            .attr("stop-color", "#ff8560")

        vis.linearGradient.append("stop")
            .attr("offset", "100%")
            .attr("stop-color", "#24caf2ff")
        
        vis.legend.append("rect")
            .attr("width", 300)
            .attr("height", 10)
            .style("fill", "url(#linear-gradient)");
            
        // Legend scales + axes
		vis.x = d3.scaleOrdinal()
		.domain(['0% Yes (No)', '100% Yes'])
        .range([0, 300])

		vis.xAxis = d3.axisBottom()
			.scale(vis.x)

		vis.legend.append("g")
			.attr("class", "x-axis axis")
            .attr('transform', `translate(${0}, ${10})`)

        vis.legend.select(".x-axis")
            .call(vis.xAxis);

        // call next method in pipeline
        this.wrangleData();
    }

    // wrangleData method
    wrangleData() {
        let vis = this

        vis.selectedQuestion = document.getElementById('questionSelector').value;
        vis.responses = vis.categoriesDict[vis.selectedQuestion].responses

        let regionVotesPerResponse = []

        vis.regions.forEach((region) => {
            let filteredData = vis.surveyData.filter(function (d) { return d['Location (Census Region)'] == region})
            let votesPerResponse = d3.range(0,2).map(function() {
                return 0;
            });
            filteredData.forEach((response) => {
                let answer = response[vis.selectedQuestion]
                let idx = vis.responses.findIndex((el) => el == answer)
                if (idx == 2) {
                    idx = 1
                }
                votesPerResponse[idx] += 1
            });
            votesPerResponse = votesPerResponse.slice(0, 2)
            let normalizedVotes = votesPerResponse.map((el) => {
                return el / filteredData.length
            })
            regionVotesPerResponse.push({'region': region, 'votes': votesPerResponse, 'normalizedVotes': normalizedVotes})
        });

        vis.displayData = regionVotesPerResponse

        vis.updateVis()

    }

    // updateVis method
    updateVis() {
        let vis = this;

        // update color domain
        let extent = d3.extent(vis.displayData, function(d) {
            return d.normalizedVotes[d.normalizedVotes.length - 1];
        });
        vis.color.domain(extent)

        // Color regions
        vis.regionDrawings = vis.map.selectAll('.region')
        .data(vis.displayData)

        // color and tooltips
        vis.regionDrawings.enter().merge(vis.regionDrawings)
        .attr('fill', (d, i) => vis.color(d.normalizedVotes[d.normalizedVotes.length - 1]))
        .attr('pointer-events', 'all')
        .on('mouseover', function(event, d){
            d3.select(this)
                .attr('fill', '#dbc9b0');
            vis.tooltip
            .style("opacity", 1)
            .style("left", event.pageX + 20 + "px")
            .style("top", event.pageY + "px")
            .html(`
                <div>
                    <h3 class="standard-text">${d.region} Region<h3>     
                    <h5 class="subtext"> Votes for Yes: ${d.votes[1]} (${parseFloat(d.normalizedVotes[1] * 100).toFixed(1)}%)</h5>  
                    <h5 class="subtext"> Votes No: ${d.votes[0]} (${parseFloat(d.normalizedVotes[0] * 100).toFixed(1)}%)</h5>      
     
                </div>`);
        })
        .on('mouseout', function(event, d){
            d3.select(this)
                .attr('fill', vis.color(d.normalizedVotes[d.normalizedVotes.length - 1]));
            vis.tooltip
                .style("opacity", 0)
                .style("left", 0)
                .style("top", 0)
                .html(``);
        })

    }
}