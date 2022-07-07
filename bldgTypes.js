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
    effect: "bloom(2.5 0 0.5)",
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
    zoom: 10,
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
        width: 2,
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
