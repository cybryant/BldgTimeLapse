require([
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/views/MapView",
  "esri/core/promiseUtils",
  "esri/widgets/Legend",
  "esri/widgets/Home",
  "esri/widgets/Slider",
  "esri/widgets/Fullscreen",
  "esri/widgets/Expand",
  "esri/layers/GeoJSONLayer",
  "esri/geometry/geometryEngine",
], (
  Map,
  FeatureLayer,
  MapView,
  promiseUtils,
  Legend,
  Home,
  Slider,
  Fullscreen,
  Expand,
  GeoJSONLayer,
  geometryEngine
) => {
  // API Querying Documentation: "Features within a FeatureLayer are rendered as graphics inside a
  // LayerView. Therefore the features visible in a view are accessed via the LayerView, not the
  // FeatureLayer. To access features visible in the view, use the query methods in the FeatureLayerView."
  // FeatureLayerView definition: "Represents the LayerView of a FeatureLayer after it has been
  // added to a Map in either a MapView or SceneView."

  //-----------------------,---------------------------------------------------
  //
  //  Setup Map and View
  //
  //--------------------------------------------------------------------------

  // create FeatureLayer from portal object
  const layer = new FeatureLayer({
    portalItem: {
      id: "a81508218fdf4be9bc5b7070e3f957cb",
    },
    //definitionExpression: "yrBuilt > 0",
    title: "parcelWithBldgAge",
    //minScale: 72223.819286,
    effect: "bloom(1.25 0 0.5)",
    outFields: ["exlanduse"], //need this parameter to use in the land use filter; if this same field were required for the renderer or labels, wouldn't need to define it again here
  });

  // create another FeatureLayer from portal object
  const cityLimLayer = new FeatureLayer({
    portalItem: {
      id: "fef09159b39a4661907c574bc142e84a",
    },
    //   const annexLayer = new GeoJSONLayer({
    //     url: "https://intervector.leoncountyfl.gov/intervector/rest/services/MapServices/TLC_OverlayCityAnnexHistory_D_WM/MapServer/0/query?outFields=*&where=1%3D1&f=geojson",
    title: "City Limit",
    labelsVisible: false,
    //effect: "bloom(2.5 0 0.5)",
  });

  // create the map object from portal basemap & add layers
  const map = new Map({
    basemap: {
      portalItem: {
        id: "4f2e99ba65e34bb8af49733d9778fb8e",
      },
    },
    layers: [layer, cityLimLayer],
  });

  //set the mapView parameters
  const view = new MapView({
    map: map,
    container: "viewDiv",
    center: [-84.2807, 30.49],
    zoom: 11,
    constraints: {
      snapToZoom: false,
      //minScale: 72223.819286,
      //minScale: 100000,
    },
    // This ensures that when going fullscreen
    // The top left corner of the view extent
    // stays aligned with the top left corner
    // of the view's container
    resizeAlign: "top-left",
  });

  //--------------------------------------------------------------------------
  //
  //  Setup UI & variables
  //
  //--------------------------------------------------------------------------

  const applicationDiv = document.getElementById("applicationDiv");
  const sliderValue = document.getElementById("sliderValue");
  const playButton = document.getElementById("playButton");
  const titleDiv = document.getElementById("titleDiv");

  // filter variables
  const landUseNodes = document.querySelectorAll(`.landUse-item`); // get all the landUse categories from the HTML
  const landUseElement = document.getElementById("landUse-filter"); // get the DOM division that will hold the filter
  // initialize a variable to hold the data filtered by land use but don't define it yet; will be a LayerView object.
  let landUseLayerView;

  // animation won't start until user presses 'Play'
  let animation = null;

  //create the slider widget
  const slider = new Slider({
    container: "slider",
    min: 1824,
    max: 2021,
    values: [1824],
    step: 1,
    visibleElements: {
      rangeLabels: true,
    },
  });

  // When user drags the slider:
  //  - stops the animation
  //  - set the visualized year to the slider one.
  function inputHandler(event) {
    stopAnimation();
    setYear(event.value);
  }
  slider.on("thumb-drag", inputHandler);

  // Toggle animation on/off when user
  // clicks on the play button
  playButton.addEventListener("click", () => {
    if (playButton.classList.contains("toggled")) {
      stopAnimation();
    } else {
      startAnimation();
    }
  });

  // click event handler for landUse filter
  landUseElement.addEventListener("click", filterByLandUse);

  view.ui.empty("top-left");
  view.ui.add(titleDiv, "top-left");
  view.ui.add(sidePanel, "top-right");
  view.ui.add(openButton, "top-right");
  view.ui.add(
    new Home({
      view: view,
    }),
    "top-left"
  );
  view.ui.add(
    new Legend({
      view: view,
    }),
    "bottom-left"
  );
  view.ui.add(
    new Fullscreen({
      view: view,
      element: applicationDiv,
    }),
    "top-right"
  );

  // When the layerview is available, setup hovering interactivity
  view.whenLayerView(layer).then(setupHoverTooltip);

  // when the LayerView is available, set up filtering functionality
  view.whenLayerView(layer).then((layerView) => {
    // flash flood warnings layer loaded
    // get a reference to the flood warnings layerview
    landUseLayerView = layerView;

    // set up filter item
    landUseElement.style.visibility = "visible";
    const landUseExpand = new Expand({
      view: view,
      content: landUseElement,
      expandIconClass: "esri-icon-filter",
      group: "top-left",
    });
    //clear the filters when user closes the expand widget
    landUseExpand.watch("expanded", () => {
      if (!landUseExpand.expanded) {
        floodLayerView.filter = null;
      }
    });
    view.ui.add(landUseExpand, "top-left");
  });

  // Starts the application by visualizing year 1824
  setYear(1824);

  //--------------------------------------------------------------------------
  //
  //  Methods
  //
  //--------------------------------------------------------------------------

  /**
   * Sets the current visualized construction year.
   */
  function setYear(value) {
    sliderValue.innerHTML = Math.floor(value);
    slider.viewModel.setValue(0, value);
    cityLimLayer.renderer = cityLimRenderer(value);
    layer.renderer = createRenderer(value);
    // annexLayer.renderer = {
    //   type: "simple", // autocasts as new SimpleRenderer()
    //   symbol: {
    //     type: "simple-fill",
    //     color: "#8c8e8e",
    //     outline: {
    //       // autocasts as new SimpleLineSymbol()
    //       width: 0.5,
    //       color: "white",
    //     },
    //   },
    // };
  }

  function cityLimRenderer(year) {
    //opacity stops make the feature invisible until the field value (ANNEXYEAR) equals the year of the slider
    const opacityStops = [
      { opacity: 0, value: year + 1 },
      { opacity: 1, value: year },
      { opacity: 0.5, value: year - 2 },
      { opacity: 0, value: year - 4 },
    ];
    return {
      type: "simple",
      symbol: {
        type: "simple-line",
        width: 3,
        color: "orange",
      },
      visualVariables: [
        {
          type: "opacity",
          field: "annexYr",
          stops: opacityStops,
          legendOptions: { showLegend: false },
        },
        // {
        //   type: "color",
        //   field: "annexYr",
        //   legendOptions: { title: "Year:" },
        //   stops: [
        //     {
        //       value: year,
        //       color: "orange",
        //       label: "in " + Math.floor(year),
        //     },
        //     {
        //       value: year - 10,
        //       color: "gray",
        //       label: "in " + (Math.floor(year) - 20),
        //     },
        //     {
        //       value: year - 50,
        //       color: "dimgray",
        //       label: "before " + (Math.floor(year) - 50),
        //     },
        //   ],
        // },
        // {
        //   type: "size",
        //   field: "annexYr",
        //   legendOptions: { showLegend: false },
        //   stops: [
        //     {
        //       value: year,
        //       size: 4,
        //     },
        //     {
        //       value: year - 10,
        //       size: 2,
        //     },
        //     {
        //       value: year - 50,
        //       size: 0.5,
        //     },
        //   ],
        // },
      ],
    };
  }
  //RENDERER
  function createRenderer(year) {
    const opacityStops = [
      {
        opacity: 1,
        value: year,
      },
      {
        opacity: 0,
        value: year + 1,
      },
    ];

    return {
      type: "simple",
      symbol: {
        type: "simple-marker",
        style: "circle",
        color: "rgb(0,0,0)",
        size: "5px",
        outline: null,
      },
      visualVariables: [
        {
          type: "opacity",
          field: "yrBuilt",
          stops: opacityStops,
          legendOptions: {
            showLegend: false,
          },
        },
        {
          type: "color",
          field: "yrBuilt",
          legendOptions: {
            title: "Building Built:",
          },
          stops: [
            {
              value: year,
              color: "#0ff",
              label: "in " + Math.floor(year),
            },
            {
              value: year - 10,
              color: "#f0f",
              label: "in " + (Math.floor(year) - 20),
            },
            {
              value: year - 50,
              color: "#404",
              label: "before " + (Math.floor(year) - 50),
            },
          ],
        },
      ],
    };
  }

  /**
   * Sets up a moving tooltip that displays
   * the construction year of the hovered building.
   */
  function setupHoverTooltip(layerview) {
    let highlight;

    const tooltip = createTooltip();

    const hitTest = promiseUtils.debounce((event) => {
      return view.hitTest(event).then((hit) => {
        const results = hit.results.filter((result) => {
          return result.graphic.layer === layer;
        });

        if (!results.length) {
          return null;
        }

        return {
          graphic: results[0].graphic,
          screenPoint: hit.screenPoint,
        };
      });
    });

    view.on("pointer-move", (event) => {
      return hitTest(event).then(
        (hit) => {
          // remove current highlighted feature
          if (highlight) {
            highlight.remove();
            highlight = null;
          }

          // highlight the hovered feature
          // or hide the tooltip
          if (hit) {
            const graphic = hit.graphic;
            const screenPoint = hit.screenPoint;

            highlight = layerview.highlight(graphic);
            tooltip.show(
              screenPoint,
              "Built in " + graphic.getAttribute("yrBuilt")
            );
          } else {
            tooltip.hide();
          }
        },
        () => {}
      );
    });
  }

  /**
   * Starts the animation that cycle
   * through the construction years.
   */
  function startAnimation() {
    stopAnimation();
    animation = animate(slider.values[0]);
    playButton.classList.add("toggled");
  }

  /**
   * Stops the animations
   */
  function stopAnimation() {
    if (!animation) {
      return;
    }

    animation.remove();
    animation = null;
    playButton.classList.remove("toggled");
  }

  /**
   * Animates the color visual variable continously
   */
  function animate(startValue) {
    let animating = true;
    let value = startValue;

    const frame = (timestamp) => {
      if (!animating) {
        return;
      }

      value += 0.5;
      if (value > 2021) {
        value = 1824;
      }

      setYear(value);

      // Update at 10fps
      setTimeout(() => {
        requestAnimationFrame(frame);
      }, 1000 / 10);
    };

    frame();

    return {
      remove: () => {
        animating = false;
      },
    };
  }

  /**
   * Creates a tooltip to display a the construction year of a building.
   */
  function createTooltip() {
    const tooltip = document.createElement("div");
    const style = tooltip.style;

    tooltip.setAttribute("role", "tooltip");
    tooltip.classList.add("tooltip");

    const textElement = document.createElement("div");
    textElement.classList.add("esri-widget");
    tooltip.appendChild(textElement);

    view.container.appendChild(tooltip);

    let x = 0;
    let y = 0;
    let targetX = 0;
    let targetY = 0;
    let visible = false;

    // move the tooltip progressively
    function move() {
      x += (targetX - x) * 0.1;
      y += (targetY - y) * 0.1;

      if (Math.abs(targetX - x) < 1 && Math.abs(targetY - y) < 1) {
        x = targetX;
        y = targetY;
      } else {
        requestAnimationFrame(move);
      }

      style.transform =
        "translate3d(" + Math.round(x) + "px," + Math.round(y) + "px, 0)";
    }

    return {
      show: (point, text) => {
        if (!visible) {
          x = point.x;
          y = point.y;
        }

        targetX = point.x;
        targetY = point.y;
        style.opacity = 1;
        visible = true;
        textElement.innerHTML = text;

        move();
      },

      hide: () => {
        style.opacity = 0;
        visible = false;
      },
    };
  }

  // When User selects a Land Use, set an attribute filter on buildings layer view
  // to display the land uses of that type
  function filterByLandUse(event) {
    const selectedLandUse = event.target.getAttribute("data-landUse");
    landUseLayerView.filter = {
      where: "exlanduse = '" + selectedLandUse + "'",
    };
  }
});

//open & close the sidebar
function openNav() {
  document.getElementById("sidePanel").style.width = "450px";
}

function closeNav() {
  document.getElementById("sidePanel").style.width = "0";
  // document.getElementById("main").style.marginLeft = "0";
}

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
  [1830, 6494, 0, 0],
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
    }),
  ])
  .range([0, circW]);

let yScale = d3
  .scaleLinear()
  .domain([
    0,
    d3.max(popData, (d) => {
      return d[1];
    }),
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
    }),
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
