/*************************************/
//HTML
/*************************************/
<body>
  <div id="applicationDiv">
    <div id="landUse-filter" class="esri-widget">
      <div class="landUse-item visible-landUse" data-landUse="Multi-Family">
        Multi-Family
      </div>
      <div
        class="landUse-item visible-landUse"
        data-landUse="Single Family Attached"
      >
        Single Family Attached
      </div>
      <div
        class="landUse-item visible-landUse"
        data-landUse="Single Family Detached/Mobile Home"
      >
        Single Family Detached
      </div>
      <div class="landUse-item visible-landUse" data-landUse="Office">
        Office
      </div>
      <div class="landUse-item visible-landUse" data-landUse="Retail">
        Retail
      </div>
    </div>
  </div>
</body>;

// create FeatureLayer from portal object
const layer = new FeatureLayer({
  portalItem: {
    id: "a81508218fdf4be9bc5b7070e3f957cb"
  },
  //definitionExpression: "yrBuilt > 0",
  // title: "parcelWithBldgAge",
  title: "Buildings",
  //minScale: 72223.819286,
  effect: "bloom(1.25 0 0.5)",
  outFields: ["exlanduse"] //need this parameter to use in the land use filter; if this same field were required for the renderer or labels, wouldn't need to define it again here
});

/*********************************************/
/*              Filter Land Use              */
/*********************************************/
// filter variables
const landUseNodes = document.querySelectorAll(`.landUse-item`); // get all the landUse categories from the HTML
const landUseFilter = document.getElementById("landUse-filter"); // get the DOM division that will hold the filter

// click event handler for landUse filter
landUseFilter.addEventListener("click", filterByLandUse);

/* rather than filtering the layer on the server side, we create a layerview once the layer loads & filter it on the client side (aka browser). This results in smoother, faster performance since it avoids multiple callbacks */

// initialize a variable to hold the layerview
let landUseLayerView;

// once layerView loads, assign to the variable & return it
view.whenLayerView(layer).then((layerView) => {
  landUseLayerView = layerView;
  return landUseLayerView;
});

// set up filter item
landUseFilter.style.visibility = "visible";
const filterLandUseBtn = new Expand({
  view: view,
  content: landUseFilter,
  expandTooltip: "Filter by Land Use",
  expandIconClass: "esri-icon-filter",
  group: "top-left"
});

//clear the filters when user closes the expand widget
filterLandUseBtn.watch("expanded", () => {
  if (!filterLandUseBtn.expanded) {
    landUseLayerView.filter = null;
  }
});

function filterByLandUse(event) {
  const selectedLandUse = event.target.getAttribute("data-landUse");
  landUseLayerView.filter = {
    where: "exlanduse = '" + selectedLandUse + "'"
  };
}
