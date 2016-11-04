//Constants for the SVG
var margin = {top: 0, right: 0, bottom: 5, left: 5};
var width = document.body.clientWidth - margin.left - margin.right;
var height = 780 - margin.top - margin.bottom;

//---End Insert------

//Append a SVG to the body of the html page. Assign this SVG as an object to svg
var svg = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height);
var svg2 = d3.select("body").append("svg")
    .attr("width", width)
    .attr("height", height-100);

var topTermMode = 0;
//******************* Forced-directed layout    

//Set up the force layout
var force = d3.layout.force()
    .charge(-12)
    //.linkStrength(5)
    .linkDistance(0)
    .gravity(0.01)
    //.friction(0.95)
    .alpha(0.05)
    .size([width, height]);

 var force2 = d3.layout.force()
    .charge(-180)
    .linkDistance(70)
    .gravity(0.15)
    .alpha(0.1)
    .size([width, height]);     

//---Insert-------
var node_drag = d3.behavior.drag()
        .on("dragstart", dragstart)
        .on("drag", dragmove)
        .on("dragend", dragend);

    function dragstart(d, i) {
        force.stop() // stops the force auto positioning before you start dragging
    }

    function dragmove(d, i) {
        d.px += d3.event.dx;
        d.py += d3.event.dy;
        d.x += d3.event.dx;
        d.y += d3.event.dy; 
    }

    function dragend(d, i) {
        d.fixed = true; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        force.resume();
    }

    function releasenode(d) {
        d.fixed = false; // of course set the node to fixed so the force doesn't include the node in its auto positioning stuff
        //force.resume();
    }


var data, data2;
var firstDate = Date.parse("2005-01-01T00:00:00");
var numSecondADay = 24*60*60;
var numSecondAMonth = 30*numSecondADay;
var minYear = 2006;
var maxYear = 2015;
var numMonth = 12*(maxYear-minYear);

var sourceList = {};
var numSource = {};
var maxCount = {}; // contain the max frequency for 4 categories

var nodes;
var numNode, numNode2;

var link;
var links;
var linkArcs;
var termArray, termArray2, termArray3;
var relationship;
var termMaxMax, termMaxMax2;
var terms;
var NodeG; 
var xStep =100;
//var xScale = d3.time.scale().range([0, (width-xStep-100)/numMonth]);
var yScale;
var linkScale;
var searchTerm ="";

var nodeY_byName = {};

var isLensing = false;
var lensingMul = 5;
var lMonth = -lensingMul*2;
var coordinate = [0,0];
var XGAP_ = 8; // gap between months on xAxis

function xScale(m){
    if (isLensing){
        var numLens = 5;
        var maxM = Math.max(0, lMonth-numLens-1);
        var numMonthInLense = (lMonth+numLens-maxM+1);
        
        //compute the new xGap
        var total= numMonth+numMonthInLense*(lensingMul-1);
        var xGap = (XGAP_*numMonth)/total;
        
        if (m<lMonth-numLens)
            return m*xGap;
        else if (m>lMonth+numLens){
            return maxM*xGap+ numMonthInLense*xGap*lensingMul + (m-(lMonth+numLens+1))*xGap;
        }   
        else{
            return maxM*xGap+(m-maxM)*xGap*lensingMul;
        }  
    }
    else{
       return m*XGAP_; 
    }           
}


var area = d3.svg.area()
        .interpolate("cardinal")
        .x(function(d) { return xStep+xScale(d.monthId); })
        .y0(function(d) { return d.yNode-yScale(d.value); })
        .y1(function(d) {  return d.yNode +yScale(d.value); });
  
var optArray = [];   // FOR search box

var numberInputTerms =0;
var listMonth;


 var nodes2 = [];
 var links2 = [];
var nodes2List = {};
var links2List = {};

d3.tsv("data/wikinews.tsv", function(error, data_) {
      if (error) throw error;
    data = data_;
    
    terms = new Object();
    termMaxMax = 1;
    data.forEach(function(d) {
        d.source = d["source"];
        // Process date
        var curDate = Date.parse(d["time"]);
        d.date = new Date(d["time"]);
        var year = d.date.getFullYear();
        var m =  12*(year-minYear) + d.date.getMonth();
        d.m = m;
         
        if (year>=minYear && year<=maxYear){
            // Add source to sourceList
            if (!sourceList[d.source])
                sourceList[d.source]=1;
            else
                sourceList[d.source]++;    
        }

        if (d["person"] != ""){
            var list = d["person"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "person";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                    }    
                }    
            }
        }

        if (d["location"] != "" && d["location"] != 1){
            var list = d["location"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "location";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                        
                    }    
                }    
            }
        }
        if (d["organization"] != "" && d["organization"] != 1){
            var list = d["organization"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "organization";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                        
                    }    
                }    
            }
        }
        if (d["miscellaneous"] != "" && d["miscellaneous"] != 1){
            var list = d["miscellaneous"].split("|");
            for (var i=0; i<list.length;i++){
                var term = list[i];
                d[term] = 1;
                if (!terms[term]){
                    terms[term] = new Object();
                    terms[term].max = 0;
                    terms[term].maxMonth = -100;   // initialized negative
                    terms[term].category = "miscellaneous";
                }    
                if (!terms[term][m])
                    terms[term][m] = 1;
                else{
                    terms[term][m] ++;
                    if (terms[term][m]>terms[term].max){
                        terms[term].max = terms[term][m];
                        terms[term].maxMonth = m;
                        if (terms[term].max>termMaxMax)
                            termMaxMax = terms[term].max;
                        
                    }    
                }    
            }
        }
        
    });
    console.log("DONE reading the input file = "+data.length); 

    readTermsAndRelationships();  


    for (var i = 0; i < termArray.length/10; i++) {
        optArray.push(termArray[i].term);
    }
    optArray = optArray.sort();
    $(function () {
        $("#search").autocomplete({
            source: optArray
        });
    });
});

function recompute() {
    var bar = document.getElementById('progBar'),
        fallback = document.getElementById('downloadProgress'),
        loaded = 0;

    var load = function() {
        loaded += 1;
        bar.value = loaded;

        /* The below will be visible if the progress tag is not supported */
        $(fallback).empty().append("HTML5 progress tag not supported: ");
        $('#progUpdate').empty().append(loaded + "% loaded");

        if (loaded == 100) {
            clearInterval(beginLoad);
            $('#progUpdate').empty().append("Complete");
        }
    };

    var beginLoad = setInterval(function() {load();}, 10);
    setTimeout(readTermsAndRelationships, 333);
} 


// Compute relationships
function readTermsAndRelationships() {
    data2 = data.filter(function (d, i) {
        if (!searchTerm || searchTerm=="" ) {
            return d;
        }
        else if (d[searchTerm])
            return d;
    });

    var selected  ={}
    if (searchTerm && searchTerm!=""){
        data2.forEach(function(d) {
             for (var term1 in d) {
                if (!selected[term1])
                    selected[term1] = {};
                else{
                    if (!selected[term1].isSelected)
                        selected[term1].isSelected = 1;
                    else
                        selected[term1].isSelected ++;
                }    
           }
        } );
    }

    var removeList = {};   // remove list **************
    
    termArray = [];
    for (var att in terms) {
        var e =  {};
        e.term = att;
        if (removeList[e.term] || (searchTerm && searchTerm!="" && !selected[e.term])) // remove list **************
            continue;
        var maxNet = 0;
        var maxMonth = -1;
        for (var m=1; m<numMonth;m++){
            if (terms[att][m]){
                var previous = 0;
                if (terms[att][m-1])
                    previous = terms[att][m-1];
                var net = (terms[att][m]+1)/(previous+1);
                if (net>maxNet){
                    maxNet=net;
                    maxMonth = m;
                }    
            }
        }
        e.max = maxNet;
        e.maxMonth = maxMonth;
        e.category = terms[att].category;           
        if (e.term==searchTerm){
            e.max = 10000;
            e.isSearchTerm = 1;
        }      
        else if (searchTerm && searchTerm!="" && selected[e.term] && selected[e.term].isSelected){
            e.max = 5000+ selected[e.term].isSelected;
        }    

        termArray.push(e);
    }
    
    termArray.sort(function (a, b) {
      if (a.max < b.max) {
        return 1;
      }
      if (a.max > b.max) {
        return -1;
      }
      return 0;
    });    

    //if (searchTerm)
    numberInputTerms = termArray.length;
   console.log("numberInputTerms="+numberInputTerms) ; 

    // Compute relationship **********************************************************
    numNode = Math.min(100, termArray.length);
    numNode2 = Math.min(numNode*5, termArray.length);
    var selectedTerms = {};
    for (var i=0; i<numNode2;i++){
       selectedTerms[termArray[i].term] = termArray[i].max;
    }
    

    relationship ={};
    relationshipMaxMax =0;
    data2.forEach(function(d) { 
        var year = d.date.getFullYear();
        if (year>=minYear && year<=maxYear){
            var m = d.m;
            for (var term1 in d) {
                if (selectedTerms[term1]){   // if the term is in the selected 100 terms
                    for (var term2 in d) {
                        if (selectedTerms[term2]){   // if the term is in the selected 100 terms
                            if (!relationship[term1+"__"+term2]){
                                relationship[term1+"__"+term2] = new Object();
                                relationship[term1+"__"+term2].max = 1;
                                relationship[term1+"__"+term2].maxMonth =m;
                            }    
                            if (!relationship[term1+"__"+term2][m])
                                relationship[term1+"__"+term2][m] = 1;
                            else{
                                relationship[term1+"__"+term2][m]++;
                                if (relationship[term1+"__"+term2][m]>relationship[term1+"__"+term2].max){
                                    relationship[term1+"__"+term2].max = relationship[term1+"__"+term2][m];
                                    relationship[term1+"__"+term2].maxMonth =m; 
                                    
                                    if (relationship[term1+"__"+term2].max>relationshipMaxMax) // max over time
                                        relationshipMaxMax = relationship[term1+"__"+term2].max;
                                }  
                            }    
                        }
                    }
                }
            }
        }
    });
    debugger;
    console.log("DONE computing realtionships relationshipMaxMax="+relationshipMaxMax);
}




