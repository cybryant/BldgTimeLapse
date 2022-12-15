// HTML Button Element
// <button id="testBtn">Start Chart</button>

/*********************************************/
/*             Population Chart              */
/*********************************************/

// variable for dom context where chart is placed
let ctx = document.getElementById("popChart");

function startChart() {
  async function getPopData() {
    const url = "popData.json";
    const response = await fetch(url);
    const popDatapoints = await response.json();
    return popDatapoints;
  }

  getPopData().then((popDatapoints) => {
    const population = popDatapoints.popHistory.map(function (index) {
      return index.population;
    });

    const popYear = popDatapoints.popHistory.map(function (index) {
      return index.year;
    });

    // set chart data parameters
    const data = {
      labels: popYear,
      datasets: [
        {
          label: false,
          backgroundColor: "rgb(255, 99, 132)",
          borderColor: "rgb(255, 99, 132)",
          // fill: true,
          data: population
        }
      ]
    }; // end data

    // animation for progressive line chart adapted from documentation example
    // HARD CODING duration for test; make a variable once we know it works
    // const totalDuration = 51000; //this is the number of seconds the bldg animation takes (51)
    // const delayBetweenPoints = totalDuration / population.length;
    // /* 'previousY' is an if/then function; if the ctx index is 0, start the chart at the Y-value we provide; otherwise get the value of the population data located at the index minus 1 and make that the y value*/
    // const previousY = (ctx) =>
    //   ctx.index === 0
    //     ? ctx.chart.scales.y.getPixelForValue(6916)
    //     : ctx.chart
    //         .getDatasetMeta(ctx.datasetIndex)
    //         .data[ctx.index - 1].getProps(["y"], true).y;

    // set chart configuration parameters
    const config = {
      type: "line",
      data: data,
      options: {
        responsive: true
        // hoverRadius: 5,
        // animation: {
        //   x: {
        //     type: "number",
        //     easing: "linear",
        //     duration: delayBetweenPoints,
        //     // duration: 0,
        //     from: NaN, // the point is initially skipped
        //     delay(ctx) {
        //       if (ctx.type !== "data" || ctx.xStarted) {
        //         return 0;
        //       }
        //       ctx.xStarted = true;
        //       return ctx.index * delayBetweenPoints;
        //     }
        //   },
        //   y: {
        //     type: "number",
        //     easing: "linear",
        //     duration: delayBetweenPoints,
        //     // duration: 0,
        //     from: previousY,
        //     delay(ctx) {
        //       if (ctx.type !== "data" || ctx.yStarted) {
        //         return 0;
        //       }
        //       ctx.yStarted = true;
        //       return ctx.index * delayBetweenPoints;
        //     }
        // }
        // }
      }
    };

    const populationChart = new Chart(ctx, config);
  }); // end getPopData().then()
} // end startChart()

document.getElementById("testBtn").addEventListener("click", startChart);
