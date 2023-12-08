	/* * * * * * * * * * * * * *
*           MAIN           *
* * * * * * * * * * * * * */

let etiquetteMap;
let aggregateFlightData;
let timeline;

const urls = {
	albers: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-albers-10m.json",
	states: "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json",
	airports: "https://gist.githubusercontent.com/alduraji/b79d67bfeb53e2d09fed81653d9b934f/raw/a0601004022498be242e061b0d982ea2d871147c/airports.csv",
	flights: "https://gist.githubusercontent.com/alduraji/8069612023b3642201d89c22733188dc/raw/6520359bb531d63133c1d132e101a955c5ee038f/flights.csv",
	etiquette: "https://gist.githubusercontent.com/alduraji/a4042232dbb52304c33e62edee311f53/raw/53f01562fe18826cb0c5f099724440f0e5814f2d/flying-etiquette.csv",
	flightdelay: "https://gist.githubusercontent.com/alduraji/2b2a2cb60ad4ffd239559559ccf41d8f/raw/5e9237b961700f57ba9112177ff5e388a09d94b5/flight-delay-airports.csv",
	years: "https://gist.githubusercontent.com/alduraji/30646b496d22f984a1f891ea0fa31f40/raw/533e4388bd104af68aa963f0667ce2cbc2ad5c8a/year-counts.csv",
	airports2top4: "https://gist.githubusercontent.com/alduraji/ab76769e05ddef448adcf9f301415ef8/raw/74dd3f8b11d61e6bdcde8006b369675a423d148b/airports2-top4.csv",
	radial: "https://gist.githubusercontent.com/alduraji/674737a206d30ebb9869cc60a00c497d/raw/729fd03557d70b4ebe6f4eccfbbb02ecdbbfa318/radial.csv"
}

// React to 'brushed' event and update domain (x-scale; stacked area chart) if selection is not empty
function brushed() {
	let selection = d3.brushSelection(d3.select(".brush").node());
	let bounds = selection.map(timeline.x.invert)
	console.log(bounds)
	aggregateFlightData.wrangleData(Math.round(bounds[0]), Math.round(bounds[1]));
}

let promises = [
	// Load Geodata and etiquette survey data for Regions x Etiquette Visualization
    d3.json(urls.albers), // already projected -> you can just scale it to fit your browser window
    d3.csv(urls.etiquette).then(csv=> {
		// clean data, filter out no location
		csv = csv.filter(function(d) {
			if (d['Location (Census Region)'].length <= 0) {
				return false
			}
			return true
		})
		return csv
	}),
	// Load condensed airports data for Chord Visualization
	d3.csv(urls.airports2top4).then(function(data) {
		let airportData = data.map(function(d) {
			return {
				originAirport: d['Origin_airport'],
				destAirport: d['Destination_airport'],
				date: d["Fly_date"]
			}
		})
		return airportData
	}),
	// Load data for timeline viz
	d3.csv(urls.years).then(function(data) {
		let yearData = data.map(function(d) {
			return {
				year: Number(d['Year']),
				num_flights: Number(d['Num_flights'])
			}
		})
		return yearData
	}),
	// Load flight delays data for Flight Delays Visualization
	d3.json(urls.states), // not projected
	d3.csv(urls.flightdelay, (row) => {
		// convert
		row.ArrDelay = +row.ArrDelay
		row.DepDelay = +row.DepDelay
		return row
	}).then(function(data) {
		return data;
	}),
	// Load data for flightmap.js
	d3.csv(urls.airports),
	d3.csv(urls.flights),
	// Load data for dotgraph.js
	d3.csv(urls.etiquette).then(function(data) {
		let etiquetteData = data.map(function(d) {
			return {
				region: d['Location (Census Region)'],
				frequency: d['How often do you travel by plane?'],
				reclineFrequency: d['Do you ever recline your seat when you fly?']
			}
		})
		return etiquetteData
	}),
	// Load data for radialchart.js
	d3.csv(urls.radial)
];

document.addEventListener('DOMContentLoaded', function() {
    Promise.all(promises)
        .then(function (data) {
            initMainPage(data);
        })
        .catch(function (err) {
            console.error(err);
        });
});

// initMainPage
function initMainPage(dataArray) {
    etiquetteMap = new EtiquetteMap('regions-map', dataArray[0], dataArray[1])
	aggregateFlightData = new AggregateFlightData('agg-flight-data', dataArray[2])
	timeline = new Timeline('timeline', dataArray[3])
	flightDelayMap = new DelayMap('delay-map', dataArray[4], dataArray[5])
	dotGraph = new DotGraph('main-msg', dataArray[8])
	radialChart = new RadialChart('radial-chart', dataArray[9])
    flightMap = new FlightMap('#flight-map');
}
	
function categoryChange() {
	etiquetteMap.wrangleData();
}

function toggleChange() {
	selectedQuestion =  document.getElementById('questionSelector').value;
	flightDelayMap.updateVis();
 }