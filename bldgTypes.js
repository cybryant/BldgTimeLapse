require([
  "esri/Map",
  "esri/layers/FeatureLayer",
  "esri/views/MapView",
  "esri/core/promiseUtils",
  "esri/widgets/Legend",
  "esri/widgets/Home",
  "esri/widgets/Slider",
  "esri/widgets/Zoom",
  "esri/widgets/Fullscreen",
  "esri/widgets/Expand",
  "esri/layers/support/FeatureEffect"
], (
  Map,
  FeatureLayer,
  MapView,
  promiseUtils,
  Legend,
  Home,
  Slider,
  Zoom,
  Fullscreen,
  Expand,
  FeatureEffect
) => {
  // API Querying Documentation: "Features within a FeatureLayer are rendered as graphics inside a
  // LayerView. Therefore the features visible in a view are accessed via the LayerView, not the
  // FeatureLayer. To access features visible in the view, use the query methods in the FeatureLayerView."
  // FeatureLayerView definition: "Represents the LayerView of a FeatureLayer after it has been
  // added to a Map in either a MapView or SceneView."

  /*********************************************/
  /*             SETUP MAP & VIEW              */
  /*********************************************/

  // popup format
  const popupTemplate = {
    title: "Parcel Info",
    content: [
      {
        type: "fields",
        fieldInfos: [
          {
            fieldName: "YR_BLT",
            label: "Year Building Built"
          },
          {
            fieldName: "exlanduse",
            label: "Existing Land Use"
          },
          {
            fieldName: "ZONED",
            label: "Zoned"
          }
        ]
      }
    ]
  };

  // create FeatureLayer from portal object
  const layer = new FeatureLayer({
    portalItem: {
      id: "a81508218fdf4be9bc5b7070e3f957cb"
    },
    // TODO - THIS TAKES A LOT OF PROCESSING TIME; FILTER DATASET BEFORE LOADING TO SERVER
    // filter out parcels designated as vacant
    definitionExpression: "exlanduse <> 'vacant'",
    title: "Buildings",
    //minScale: 72223.819286,
    // effect: "bloom(1.25 0 0.5)"
    effect: "bloom(2.5 0 0.7)",
    popupTemplate: popupTemplate
    //DON'T NEED THIS ANYMORE WITH NEW FILTER SETUP
    // outFields: ["exlanduse"] //need this parameter to use in the land use filter; if this same field were required for the renderer or labels, wouldn't need to define it again here
  });

  // create another FeatureLayer from portal object
  const cityLimLayer = new FeatureLayer({
    portalItem: {
      id: "fef09159b39a4661907c574bc142e84a"
    },
    //   const annexLayer = new GeoJSONLayer({
    //     url: "https://intervector.leoncountyfl.gov/intervector/rest/services/MapServices/TLC_OverlayCityAnnexHistory_D_WM/MapServer/0/query?outFields=*&where=1%3D1&f=geojson",
    title: "City Limit",
    labelsVisible: false,
    legendEnabled: false,
    visible: false
    //effect: "bloom(2.5 0 0.5)",
  });

  // create the map object from portal basemap & add layers
  const map = new Map({
    basemap: {
      portalItem: {
        id: "4f2e99ba65e34bb8af49733d9778fb8e"
      }
    },
    layers: [layer, cityLimLayer]
  });

  //set the mapView parameters
  const view = new MapView({
    map: map,
    container: "viewDiv",
    // center: [-84.28073, 30.43826], //this is the true center but it's offset due to more northward growth
    center: [-84.28073, 30.47],
    // scale: 250000,
    zoom: 11,
    constraints: {
      snapToZoom: false
      //minScale: 72223.819286,
      //minScale: 100000,
    },
    // This ensures that when going fullscreen
    // The top left corner of the view extent
    // stays aligned with the top left corner
    // of the view's container
    resizeAlign: "top-left"
  });

  /*********************************************/
  /*                                           */
  /*********************************************/

  // access DOM elements
  const applicationDiv = document.getElementById("applicationDiv");

  const titleDiv = document.getElementById("titleDiv");

  /*********************************************/
  /*             POPULATION CHART              */
  /*********************************************/
  // be sure to reference popDatapoint.js as an src in the html

  // create an array of year values from the external popDatapoint.js file
  const popYears = popDatapoints.popHistory.map(function (index) {
    return index.year;
  });

  // create an array of population values from external popDatapoint.js file
  const population = popDatapoints.popHistory.map(function (index) {
    return index.population;
  });

  let changingPop = population[0];

  // set chart data parameters
  const data = {
    labels: popYears,
    datasets: [
      {
        label: false,
        // backgroundColor: "rgba(30, 30, 30, 0.99)",
        // borderColor: "rgb(255, 99, 132, .6)",
        borderColor: "#fbf4b5",
        // fill: true,
        data: changingPop
      }
    ]
  }; // end data

  // set chart configuration parameters
  const config = {
    type: "line",
    data: data,
    options: {
      responsive: true,
      legend: {
        display: false
      },
      title: {
        display: true,
        text: "Leon County Population",
        fontFamily:
          "'Avenir Next W00','Helvetica Neue', Helvetica, Arial, sans-serif"
      },
      scales: {
        yAxes: [
          {
            ticks: {
              min: 0,
              // beginAtZero: true,
              // this will return the y-axis values with a thousand separator (i.e. comma)
              callback: (value) => {
                return value.toLocaleString();
              }
            },
            gridLines: {
              zeroLineColor: "#d1d1d1",
              color: "#696969"
            }
          }
        ],
        xAxes: [
          {
            ticks: {
              // max: 2020,
              // maxTicksLimit: 20,
              callback: (value) => {
                if (value % 10 == 0) {
                  return value;
                }
              }
            }
          }
        ]
      }
    }
  };

  const popChartCanvas = document.getElementById("popChartCanvas");
  const populationChart = new Chart(popChartCanvas, config);

  // TOGGLE SWITCH FOR CHART
  // watch for when toggle is changed & call function
  // get reference to div element
  const checkboxID_popChart = document.getElementById("checkboxID_popChart");

  // watch for when toggle is changed & call function
  popChartToggle.onchange = () => {
    chartToggleSwitch(checkboxID_popChart, popChartCanvas);
  };

  function chartToggleSwitch(checkboxID, appObject) {
    if (checkboxID.checked) {
      appObject.style.display = "";
    } else {
      appObject.style.display = "none";
    }
  }

  /*********************************************/
  /*         OPTIONS PANEL & ELEMENTS          */
  /*********************************************/

  // get reference to the DOM element
  const optionsPanel = document.getElementById("optionsPanel");

  const optionsPanelExpand = new Expand({
    view: view,
    content: optionsPanel,
    expandIconClass: "esri-icon-settings",
    expandTooltip: "Change Display Settings"
  });

  /*********************************************/
  /*             City Limit Toggle             */
  /*********************************************/
  // get reference to div element
  const checkboxID_cityLim = document.getElementById("checkboxID_cityLim");

  // TEMP REFERENCE - when toggle function was used for city & charts
  // // watch for when toggle is changed & call function
  // cityLimToggle.onchange = () => {
  //   toggleSwitch(checkboxID_cityLim, cityLimLayer);
  // };

  cityLimToggle.onchange = () => {
    toggleCityLimits();
  };

  function toggleCityLimits() {
    if (checkboxID_cityLim.checked) {
      cityLimLayer.visible = true;
    } else {
      cityLimLayer.visible = false;
    }
  }

  /*********************************************/
  /*     Points/Parcels Display Buttons        */
  /*********************************************/

  let symbolProperties;
  let points = {
    type: "simple-marker",
    style: "circle",
    color: "rgb(0,0,0)",
    size: "5px",
    outline: null
  };

  let parcels = {
    type: "simple-fill",
    color: "rgb(0, 0, 0)",
    outline: null
  };

  document.getElementById("displayBtns").addEventListener("change", (event) => {
    let targetDisplay = event.target;
    if (targetDisplay.id == "points") {
      return (symbolProperties = points), (layer.title = "Buildings");
    } else {
      return (symbolProperties = parcels), (layer.title = "Parcels");
    }
  });

  /*********************************************/
  /*              Land Use Filter              */
  /*********************************************/
  /* rather than filtering the layer on the server side, we create a layerview once the layer loads & filter it on the client side (aka browser). This results in smoother, faster performance since it avoids multiple callbacks */

  // initialize a variable to hold the layerview
  let landUseLayerView;

  // once layerView loads, assign to the variable & return it
  view.whenLayerView(layer).then((layerView) => {
    landUseLayerView = layerView;
    return landUseLayerView;
  });

  // event listener for the radio buttons (be sure to set initial button in index.html)
  document.getElementById("filterBtns").addEventListener("change", (event) => {
    filterLandUse(event);
  });

  // make unselected features gray
  function filterLandUse(event) {
    const selectedLandUse = event.target.getAttribute("data-landUse");
    let featureFilter = {
      where: "exlanduse = '" + selectedLandUse + "'"
    };
    if (featureFilter && selectedLandUse != "noFilter") {
      landUseLayerView.featureEffect = new FeatureEffect({
        filter: featureFilter,
        // includedEffect: "drop-shadow(3px 3px 3px)",
        excludedEffect: "opacity(25%) grayscale(99%)"
      });
    } else {
      // this is the 'noFilter' reset so no effect is applied to anything
      landUseLayerView.featureEffect = new FeatureEffect({
        filter: featureFilter,
        excludedEffect: ""
      });
    }
  }

  /*********************************************/
  /*             SLIDER WIDGET                 */
  /*********************************************/

  // get reference to the DOM elements
  const sliderValue = document.getElementById("sliderValue");
  const playButton = document.getElementById("playButton");

  //create the slider widget
  const slider = new Slider({
    container: "slider",
    min: 1824,
    max: 2021,
    values: [1824],
    step: 1,
    visibleElements: {
      rangeLabels: true
    }
  });

  // When user drags the slider:
  //  - stops the animation
  //  - set the visualized year to the slider one
  //  - updates the charts based on the year value from the slider
  function inputHandler(event) {
    stopAnimation();
    setYear(event.value);
    updateChart(event.value);
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

  // view.when(() => {
  //   timeSlider = new TimeSlider({

  /*********************************************/
  /*      Set up Hovering Interactivity        */
  /*********************************************/
  // When the layerview is available, setup hovering interactivity
  view.whenLayerView(layer).then(setupHoverTooltip);

  /*********************************************/
  /*            Place UI Elements              */
  /*********************************************/
  const sidebarToggler = document.getElementById("sidebarToggler");
  const chartsSidebar = document.getElementById("chartsSidebar");

  // place in the application view
  view.ui.empty("top-left");
  view.ui.add(titleDiv, "top-left");
  view.ui.add(
    new Home({
      view: view
    }),
    "top-left"
  );
  view.ui.add(
    new Zoom({
      view: view
    }),
    "top-left"
  );
  view.ui.add(
    new Fullscreen({
      view: view,
      element: applicationDiv
    }),
    "top-left"
  );
  view.ui.add(optionsPanelExpand, "top-left");
  view.ui.add(sidebarToggler, "bottom-right");
  // view.ui.add(filterLandUseBtn, "bottom-right");
  view.ui.add(chartsSidebar, "bottom-right");
  // view.ui.add(popDiv, "bottom-right");
  view.ui.add(
    new Legend({
      view: view
      // id: "legendBox"
    }),
    "bottom-left"
  );

  /*********************************************/
  /*      Set Initial Application State        */
  /*********************************************/
  // Starts the application by visualizing year 1824
  setYear(1824);
  // setYear(1830);

  // TEMPORARY : open sidebar on load while developing
  // openNav();

  // animation won't start until user presses 'Play'
  let animation = null;

  // set new construction to render as points by default
  symbolProperties = points;

  /*********************************************/
  /*               FUNCTIONS                   */
  /*********************************************/

  /*********************************************/
  /*                 Set Year                  */
  /*********************************************/
  //Sets the current visualized construction year based on slider value

  function setYear(value) {
    sliderValue.innerHTML = Math.floor(value);
    slider.viewModel.setValue(0, value);
    cityLimLayer.renderer = cityLimRenderer(value);
    layer.renderer = createRenderer(value);
  }

  /*********************************************/
  /*       Update the Population Chart         */
  /*********************************************/
  function updateChart(year) {
    year = Math.floor(year);
    for (let x in popYears) {
      if (popYears[x] == year) {
        let popYrIndex = popYears.indexOf(popYears[x]);
        changingPop = population.slice(0, popYrIndex + 1);
        populationChart.config.data.datasets[0].data = changingPop;
        populationChart.update();
      }
    }
  }

  /*********************************************/
  /*          Renderer: City Limit             */
  /*********************************************/
  function cityLimRenderer(year) {
    //opacity stops make the feature invisible until the field value (ANNEXYEAR) equals the year of the slider
    const opacityStops = [
      { opacity: 0, value: year + 1 },
      { opacity: 1, value: year },
      { opacity: 0.5, value: year - 2 },
      { opacity: 0, value: year - 4 }
    ];
    return {
      type: "simple",
      symbol: {
        type: "simple-line",
        width: 3,
        // color: "#437F97"
        color: "#6BA292"
      },
      visualVariables: [
        {
          type: "opacity",
          field: "annexYr",
          stops: opacityStops,
          legendOptions: { showLegend: false }
        }
      ]
    };
  }

  /*********************************************/
  /*            Renderer: Buildings            */
  /*********************************************/

  function createRenderer(year, symbolProps) {
    /* since rendering of new construction can be changed by the user, the first step is to get the value of symbolProperties from either the intial app settings or the point/parcel radio buttons */
    symbolProps = symbolProperties;

    const opacityStops = [
      {
        opacity: 1,
        value: year
      },
      {
        opacity: 0,
        value: year + 1
      }
    ];

    return {
      type: "simple",
      symbol: symbolProps,
      visualVariables: [
        {
          type: "opacity",
          field: "yrBuilt",
          stops: opacityStops,
          legendOptions: {
            showLegend: false
          }
        },
        {
          type: "color",
          field: "yrBuilt",
          legendOptions: {
            title: "Year Built:"
          },
          stops: [
            {
              value: year,
              // color: "#0ff",
              // color: "#CEB888",
              color: "#FBF4B5",
              label: "in " + Math.floor(year)
            },
            {
              value: year - 10,
              // color: "#f0f",
              // color: "#BA927B",
              color: "#AB836C",
              label: "in " + (Math.floor(year) - 20)
            },
            {
              value: year - 50,
              // color: "#404",
              color: "#5A1122",
              label: "before " + (Math.floor(year) - 50)
            }
          ]
        }
      ]
    };
  }

  /*********************************************/
  /*                Animations                 */
  /*********************************************/
  // start
  function startAnimation() {
    stopAnimation();
    animation = animate(slider.values[0]);
    playButton.classList.add("toggled");
  }

  // stop
  function stopAnimation() {
    if (!animation) {
      return;
    }
    animation.remove();
    animation = null;
    playButton.classList.remove("toggled");
  }

  /**************************************************/
  /* Animates the color visual variable continously */
  /**************************************************/
  function animate(startValue) {
    let animating = true;
    let value = startValue;

    const frame = (timestamp) => {
      if (!animating) {
        return;
      }

      value += 0.5;
      // value += 1;
      if (value > 2021) {
        value = 1824;
      }

      setYear(value);
      updateChart(value);

      // Update at 10fps
      setTimeout(() => {
        requestAnimationFrame(frame);
      }, 1000 / 15);
    };

    frame();

    return {
      remove: () => {
        animating = false;
      }
    };
  }

  /*********************************************/
  /*             Tooltip                       */
  /*********************************************/
  // Creates a tooltip to display a the construction year of a building.
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
      }
    };
  }

  // Sets up a moving tooltip that displays the construction year of the hovered building.
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
          screenPoint: hit.screenPoint
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

  /*********************************************/
  /*             Toggle Switch                 */
  /*********************************************/

  // FIRST TRY AT ONE FUNCTION TO CONTROL ALL SWITCHES; DIDN'T WORK FOR CHARTS SINCE PROPERTY NAME IS DIFFERENT
  // function toggleSwitch(checkboxID, appObject) {
  //   if (checkboxID.checked) {
  //     appObject.visible = true;
  //   } else {
  //     appObject.visible = false;
  //   }
  // }

  //TEMPORARILY COMMENTED OUT WHILE COPY IS ADJUSTED NEXT TO CHART
  // function toggleSwitch(checkboxID, appObject) {
  //   if (checkboxID.checked) {
  //     appObject.hidden = true;
  //   } else {
  //     appObject.hidden = false;
  //   }
  // }
});

/*********************************************/
/*       Population Chart Side Bar           */
/*********************************************/
// //open the sidebar
// function openNav() {
//   document.getElementById("sidePanel").style.width = "550px";
// }

// // close the sidebar
// function closeNav() {
//   document.getElementById("sidePanel").style.width = "0";
//   // document.getElementById("main").style.marginLeft = "0";
// }

/************************/
/*SIDEBAR*/
/************************/
const $toggler = document.querySelector(".toggler");
const $sidebar = document.querySelector(".sidebar");
// const $main = document.querySelector(".main");
const $closeSidebarButton = document.querySelector(".closeSidebarButton");

$closeSidebarButton.addEventListener("click", () => {
  $sidebar.classList.remove("is-opened");
});

$toggler.addEventListener("click", () => {
  $sidebar.classList.toggle("is-opened");
});
