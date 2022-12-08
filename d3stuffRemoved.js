//HTML
<script src="https://d3js.org/d3.v4.js"></script>;

//JS

//************************/
//POPULATION GRAPH SVG

//const animSpeed = If possible, make animation speed a variable so it can be used for the graphs as well

// make an object of each decades' population
//(Make sure this is the right way to structure dictionary)
//const popYear = 【1840:??, 1850:??, etc ]

/*
// declare a variable to hold pop data; do outside the callback function so it's available globally
//let popData;

// load population data from the csv,  & a function to print the error message if there is one

//including a rowConverter to convert strings into numbers
let rowConverter = (data) => {
  return {
    Year: parseInt(data.Year),
    Population: parseInt(data.Population),
  };
};

d3.csv("popData.csv", rowConverter, function (error, data) {
  if (error) {
    console.log(error);
  } else {
    //popData = data;
    console.log(data);
    addPopCircles();
  }
});
*/
//UNDEFINED
//console.log(data);

// d3.csv("popData.csv", (d) => {
//   popData = d;
//   return {
//     Year: d.Year,
//     Population: d.Population,
//   };
//   console.log(popData);
//   console.log(d.Population);
// });

//console.log(popData.Population);

let popData = [
  [2020, 295507, 1925, 0.0066],
  [2010, 275971, 83478, 0.4337],
  [1990, 192493, 43838, 0.2949],
  [1980, 148655, 45608, 0.4426],
  [1970, 103047, 28822, 0.3883],
  [1960, 74225, 22635, 0.4387],
  [1950, 51590, 19944, 0.6302],
  [1940, 31646, 8170, 0.348],
  [1930, 23476, 5417, 0.3],
  [1920, 18059, -1368, -0.0704],
  [1910, 19427, -460, -0.0231],
  [1900, 19887, 2135, 0.1203],
  [1890, 17752, -1910, -0.0971],
  [1880, 19662, 4426, 0.2905],
  [1870, 15236, 2893, 0.2344],
  [1860, 12343, 901, 0.0787],
  [1850, 11442, 729, 0.068],
  [1840, 10713, 4219, 0.6497],
  [1830, 6494, 0, 0]
];

// let popData = [
//   [1920, 1000, -1368, -0.0704],
//   [1910, 900, -460, -0.0231],
//   [1900, 800, 2135, 0.1203],
//   [1890, 700, -1910, -0.0971],
//   [1880, 600, 4426, 0.2905],
//   [1870, 500, 2893, 0.2344],
//   [1860, 400, 901, 0.0787],
//   [1850, 300, 729, 0.068],
//   [1840, 200, 4219, 0.6497],
//   [1830, 100, 0, 0],
// ];

//CREATE SVG TO HOLD THE CIRCLES REPRESENTING POPULATION

// set width & height; these need to be the same so the circles will fill the entire SVG
let w = 450;
let h = 300;
let circW = 300;

let svg = d3
  .select("#popContainer")
  .append("svg")
  .attr("width", w)
  .attr("height", h);

let xScale = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(popData, (d) => {
      return d[1];
    })
  ])
  .range([0, circW]);

let yScale = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(popData, (d) => {
      return d[1];
    })
  ])
  .range([0, h]);

// make a scale for the radius, setting it as the square root of the population (so the circles will be the
// relative areas representing population); the scale range is 1/2 of height of the SVG, since radius will
// be 1/2 of the diameter of each circle. Therefore the largest circle will fill up the SVG
let rScale = d3
  .scaleSqrt()
  .domain([
    0,
    d3.max(popData, (d) => {
      return d[1];
    })
  ])
  .range([0, h / 2]);

console.log(popData);
//add the circles to the svg; d3 places the .data() value for each record into the internal functions

// svg
//   .selectAll("circle")
//   .data(popData)
//   .enter()
//   .append("circle")
//   .attr("cx", h / 2)
//   .attr("cy", 100)
//   .attr("r", 100)
//   .attr("stroke", "white");

//let allCircles =d3.selectAll("circle");

d3.select("p").on("click", function () {
  svg
    .selectAll("circle")
    .each()
    .data(popData)
    .enter()
    .append("circle")
    .attr("cx", h / 2) // this & the same with y result in circles centered in the SVG
    // .attr("cx", (d) => {
    //   return d[1];
    // })
    // .attr("cx", function (d, i) {
    //   return i / 1000;
    //   return Math.number(d.Population / 1000);
    // })
    // .attr("cy", w / 2)

    // along with ("cx", h/2) & (("r", (d) => {return d[1];})) results in concentric circles centered on bottom
    // .attr("cy", (d) => {
    //   return h - d[1];
    // })

    // .attr("cy", (d) => {
    //   return h - (yScale(d[1]) - yScale(d[1]) * 0.5);
    // })
    .attr("cy", (d) => {
      return h - rScale(d[1]);
    })
    //   return Math.number(d.Population / 1000);
    // })
    .transition()
    .duration(5000)
    .attr("r", (d) => {
      return rScale(d[1]);
    })
    // along with ("cx", h/2) &  ("cy", (d) => {return h - d[1];}), results in concentric circles centered on the bottom
    // .attr("r", (d) => {
    //   return d[1];
    // })

    // .attr("r", (d) => {
    //   return aScale(d[1]);
    // })
    //.attr("cx", 25)
    //.attr("cy", 25)
    .attr("stroke", "white");

  // ADD LABELS FOR THE CIRCLES
  let wText = 150;
  let hText = 300;

  // let svgText = d3
  //   .select("#popContainer")
  //   .append("svg")
  //   .attr("width", wText)
  //   .attr("height", hText);

  svg
    .selectAll("text")
    .data(popData)
    .enter()
    .append("text")
    .text((d) => {
      return d[0] + ":" + d[1];
    })
    .attr("x", circW + 10)
    .attr("y", (d) => {
      return h - rScale(d[1]);
    })
    .attr("font-family", "sans-serif")
    .attr("font-size", "11px")
    .attr("fill", "red");
});

// // CREATE ANOTHER ANIMATED CIRCLE ON TOP OF THE STATIC CIRCLES
// let svgAnim = d3
//   .select("#popContainer")
//   .append("svg")
//   .attr("width", w)
//   .attr("height", h);

// svgAnim
//   .selectAll("circle")
//   .data(popData)
//   .transition()
//   .duration(10000)
//   //.enter()
//   .append("circle")
//   .attr("cx", h / 2) // this & the same with y result in circles centered in the SVG
//   .attr("cy", (d) => {
//     return h - rScale(d[1]);
//   })
//   .attr("r", (d) => {
//     return rScale(d[1]);
//   })
//   .attr("fill", "orange");

/* THIS WAS A TEST
  const svg = d3.create("svg");
  
  let popRadius = 10;
  
  // create initial 1840s circle
  let circle = svg
    .append("circle")
    .attr("cx", 150)
    .attr("cy", 75)
    .attr("r", 50)
    .attr("fill", "white"); //after test, change to variable popRadius
  END TEST
  */

//Encapsulate everything below in a function called within the animate function

// needs work
//let popChgPerc = (popYear[i] - popYear[i-1])/popYear[i]

// look at animate function to see if this works

// look at using when instead of if
//if year == popYear[dictionary reference]{

//popRadius =  popRadius * popChgPerc

/* SECOND PART OF TEST
  // make circle radius change with population
  circle
    .transition()
    .duration(10000) //after test, change to animSpeed
    .attr("r", 150); // after test, change 75 to popRadius
  
  // append everything to the container
  d3.select("#popContainer").append(() => svg.node());
  END SECOND PART OF TEST
  */

//}

// will need to account for reset of radius on restart
