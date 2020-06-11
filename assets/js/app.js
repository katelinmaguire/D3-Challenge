/* 
Directions:

Create a scatter plot between two of the data variables such as Healthcare vs. Poverty or Smokers vs. Age 
Use D3 to create a scatter plot that represents each state with circle elements
Create the graphic in the app.js file of your homework directory
Make sure you pull in the data from data.csv by using the d3.csv function 
*/

// SET UP SVG ELEMENT -----------------------------------

// define the dimensions of the SVG element
var svgWidth = 1000;
var svgHeight = 500;

// define chart margins
var margin = {
  top: 50, 
  right: 50, 
  bottom: 100, 
  left: 50};

// define chart dimensions
var chartWidth = svgWidth - margin.left - margin.right;
var chartHeight = svgHeight - margin.top - margin.bottom;

// select the scatter class, append SVG element, and set its dimensions
var svg = d3.select(".scatter")
  .append("svg")
  .attr("width", svgWidth)
  .attr("height", svgHeight);

// append SVG group and set its margins
var chartGroup = svg.append("g")
  .attr("transform", `translate(${margin.left}, ${margin.top})`);  // transform by margin so they're placed properly

// CREATE FUNCTIONS THAT ALLOW FOR DYNAMIC CHART -----------------------------------

// function to update x-axis scale when x-axis variable is changed
function updateXScale(healthData, defaultXAxis) {
  
  // create scales
  var xLinearScale = d3.scaleLinear()
    .range([0, chartWidth])   // chart limits
    .domain([                 
      d3.min(healthData, d => d[defaultXAxis]) * .8,
      d3.max(healthData, d => d[defaultXAxis]) * 1
]);   // x scale limits

  return xLinearScale;
}

// function to update x-axis when new axis is selected (transition)
function transitionAxes(newXScale, newXAxis) {

  // the bottom axis will be the the new selection
  var bottomAxis = d3.axisBottom(newXScale);

  // transition to new axis
  newXAxis.transition()
    .duration(1000)
    .call(bottomAxis);

  return newXAxis;
}

// update circles function (transition)
function transitionCircles(circlesGroup, newXScale, defaultXAxis) {

  // transition to new circles
  circlesGroup.transition()
    .duration(1000)
    .attr("cx", d => newXScale(d[defaultXAxis]));

  return circlesGroup;
}

// update tooltip function
function createToolTip(defaultXAxis, circlesGroup) {

  // initialize tooltip labels
  var xTipLabel;
  var xPercent;   // poverty is percent, while median age is not

  // label the tooltip with the current x-axis label
  if (defaultXAxis === "poverty") {
    xTipLabel = "Poverty";
    xPercent = "%";  // to provide more clarity
  }
  else {
    xTipLabel = "Age";
    xPercent = " years"; // to provide more clarity
  }

  // list the x-axis (povery and age) and obesity values for each circle (i.e., each state)
  var hoverToolTip = d3.tip()
    .attr("class", "tooltip")
    .offset([85, 40])
    .html(function(d) {
      return (`${d.state}<br>${xTipLabel}: ${d[defaultXAxis]}${xPercent}<br>Obesity: ${d.obesity}%`);
    });

  circlesGroup.call(hoverToolTip);

  circlesGroup
    .on("mouseover", function(data) {
      hoverToolTip
      .show(data);})
    .on("mouseout", function(data) {
      hoverToolTip
      .hide(data);});

  return circlesGroup;

}

// LOAD DATA AND CREATE VISUALIZATION -----------------------------------

d3.csv("assets/data/data.csv").then(function(healthData, err) {
  if (err) throw err;

  // parse data
  healthData.forEach(function(d) {
    d.poverty = +d.poverty;   // parse int
    d.age = +d.age;
    d.obesity = +d.obesity;
  });

  // define default x-axis and corresponding scale
  var defaultXAxis = "poverty";
  var xLinearScale = updateXScale(healthData, defaultXAxis);
  var bottomAxis = d3.axisBottom(xLinearScale);

  // create y-scale and axis
  var yLinearScale = d3.scaleLinear()
    .range([chartHeight, 0])        // chart limits (from top to bottom)
    .domain([0, d3.max(healthData, d => d.obesity)]);   // y scale limits
  var leftAxis = d3.axisLeft(yLinearScale);
  
  // append x-axis
  var newXAxis = chartGroup.append("g")
  .classed("x-axis", true)
  .attr("transform", `translate(0, ${chartHeight})`)
  .call(bottomAxis);

  // append y-axis
  chartGroup.append("g")
    .classed("axis", true)
    .call(leftAxis);      // no translation needed

  // append y-axis text (not dynamic)
  chartGroup.append("text")
  .attr("transform", "rotate(-90)")
  .attr("y", 0 - margin.left)
  .attr("x", 0 - (chartHeight / 2))
  .attr("dy", "1em")
  .classed("axis-text", true)
  .text("Obese (%)");

  // append circle group
  var circlesGroup = chartGroup.selectAll("circle")
    .data(healthData)
    .enter()
    .append("circle")
    .attr("r", 8)  // to avoid overlap
    .attr("cx", d => xLinearScale(d[defaultXAxis]))  // poverty or age
    .attr("cy", d => yLinearScale(d.obesity))  // obesity remains on y-axis
    .attr("class", "stateCircle") // grab the pre-set CSS styling
    .attr("opacity", ".8");   // alpha = .08

  // create tooltip
  var circlesGroup = createToolTip(defaultXAxis, circlesGroup);


  // // append state abbreviations as text
  // circlesGroup.append("text");

  // circlesGroup.selectAll("text")
  // .data(healthData)
  // .enter()
  // .attr("x", d => xLinearScale(d[defaultXAxis]))  // poverty or age
  // .attr("y", d => yLinearScale(d.obesity))  // obesity remains on y-axis
  // .text(d => d.abbr)
  // .attr("class", "stateText");  // css styling

  // x-axis selection and event listeners -----------------------------------

  // group the x-axis labels
  var xAxisLabels = chartGroup.append("g")
    .attr("transform", `translate(${chartWidth / 2}, ${chartHeight + 20})`);

  var povertyLabel = xAxisLabels
    .append("text")
    .text("In Poverty (%)")   // x-axis text
    .attr("x", 0)
    .attr("y", 20)
    .attr("value", "poverty") 
    .classed("active", true);    // this label is the default

  var ageLabel = xAxisLabels
    .append("text")
    .text("Age (Median)")   // x-axis text
    .attr("x", 0)
    .attr("y", 40)
    .attr("value", "age") 
    .classed("inactive", true);  // this label begins inactive

  // event listener for new x-axis variable
  // perform updates all at once upon the click
  xAxisLabels.selectAll("text")
    .on("click", function() {

      // get value of selection
      var selection = d3.select(this)
        .attr("value");

      // if the default axis changes, we will update the visual
      if (selection !== defaultXAxis) {

        defaultXAxis = selection;  // define current selection

        // update all of the below for new x-axis selection
        xLinearScale = updateXScale(healthData, defaultXAxis); // new scale
        newXAxis = transitionAxes(xLinearScale, newXAxis);  // new x-axis
        circlesGroup = transitionCircles(circlesGroup, xLinearScale, defaultXAxis);  // circles
        circlesGroup = createToolTip(defaultXAxis, circlesGroup);   // tooltips

        // change the text on the x-axis, depending on the selection
        if (defaultXAxis === "poverty") {
          // poverty label active, age label inactive
          povertyLabel
          .classed("active", true)
          .classed("inactive", false);
          ageLabel
          .classed("active", false)
          .classed("inactive", true);
        }
        else {
          // poverty label inactive, age label active
          povertyLabel
          .classed("active", false)
          .classed("inactive", true);
          ageLabel
          .classed("active", true)
          .classed("inactive", false);
        }

      }

    });

}).catch(function(error) {
  console.log(error);
});
