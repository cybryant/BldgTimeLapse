/*********************************************/
/*             Population Chart              */
/*********************************************/

// variable for dom context where chart is placed
let ctx = document.getElementById("popChart");

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

  // set chart configuration parameters
  const config = {
    type: "line",
    data: data,
    options: {
      responsive: true
    }
  };

  const populationChart = new Chart(ctx, config);
}); // end getPopData().then()

////////OR ALTERNATIVELY, NO CALLBACK IS REQUIRED SINCE WE ONLY NEED TO LOAD DATA ONE TIME
/*********************************************/
/*             Population Chart              */
/*********************************************/
// be sure to reference popDatapoint.js as an src in the hmtl

// create an array of year values from the external popDatapoint.js file
const popYear = popDatapoints.popHistory.map(function (index) {
  return index.year;
});

// create an array of population values from external popDatapoint.js file
const population = popDatapoints.popHistory.map(function (index) {
  return index.population;
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

// set chart configuration parameters
const config = {
  type: "line",
  data: data,
  options: {
    responsive: true
  }
};

const populationChart = new Chart(document.getElementById("popChart"), config);
