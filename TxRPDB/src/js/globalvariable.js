// data variable
let basearr=[],basedata={},dp,district_counties,mediaQuery,
    COL_LAT = 'lat',
    COL_LONG = 'lng',
    filter={};

let variable_collection ={
    District:{
        text: 'District',
        id: 'District',
        statistic: undefined,
    },
    County:{
        text: 'County',
        id: 'County',
        statistic: undefined,
    },
    DataType:{
        text: 'Project',
        id: 'DataType',
        statistic: 'group',
    },
    Highway:{
        text: 'Highway',
        id: 'Highway',
        statistic: undefined,
    },
    CCSJ:{
        text: 'CCSJ',
        id: 'CCSJ',
        statistic: undefined,
    },
    ConcreteCAT:{
        text: 'Concrete CAT',
        id: 'ConcreteCAT',
        statistic: undefined,
    },
    ConstYear:{
        text: 'Construction Year',
        id: 'ConstYear',
        statistic: 'date',
    },
    Direction:{
        text: 'Direction',
        id: 'Direction',
        statistic: 'category',
        hide: true,
    },

    Drainage:{
        text: 'Drainage',
        id: 'Drainage',
        statistic: undefined,
    },
    GPSStart:{
        type:'gps',
        text: 'GPS (Start)',
        id: 'GPSStart',
        statistic: undefined,
        hide: true,
    },
    GPSEnd:{
        type:'gps',
        text: 'GPS (End)',
        id: 'GPSEnd',
        statistic: undefined,
        hide: true,
    },
    HorizontalAlign:{
        text: 'Horizontal Alignment',
        id: 'HorizontalAlign',
        statistic: 'category',
    },
    NoOFLanes:{
        text: 'No. of Lanes (Both Directions)',
        id: 'NoOFLanes',
        statistic: 'number',
    },
    PavementType:{
        text: 'Pavement Type',
        id: 'PavementType',
        statistic: 'category',
    },
    RefMarker:{
        text: 'Reference Marker',
        id: 'RefMarker',
        statistic: undefined,
    },
    ShoulderType:{
        text: 'Shoulder Type',
        id: 'ShoulderType',
        statistic: 'category',
    },
    SlabThickness:{
        text: 'Slab Thickness (in.)',
        id: 'SlabThickness',
        statistic: 'number',
    },
    Surfacetexture:{
        text: 'Surface Texture',
        id: 'Surfacetexture',
        statistic: 'category',
    },
    VerticalAlign:{
        text: 'Vertical Alignment',
        id: 'VerticalAlign',
        statistic: 'category',
    }
};
let arr_variable_collection =[];
Object.keys(variable_collection).forEach(d=>{if (!variable_collection[d].hide) arr_variable_collection.push(variable_collection[d])});
arr_variable_collection = sortVariables(arr_variable_collection);
let specificVariables = makeSpecificVariables();
specificVariables = sortVariables(specificVariables);

let project_collection ={
    CRCP: {
        text:"CRCP",
        id:"CRCP",
        sub: ["Level 1 Sections","General Sections"]
    },
    CPCD: {
        text:"CPCD",
        id:"CPCD",
        sub: ["CPCD"]
    },
    ExperimentalSections: {
        text:"Experimental Sections",
        id:"ExperimentalSections",
        sub: ["Coarse Aggregate Effects","LTPP Sections","Steel Percentage Effects","Construction Season Effects"]
    },
    SpecialSections: {
        text:"Special Sections",
        id:"Special Sections",
        sub: ["Fast Track Pavement","Bonded Overlay","Unbonded Overlay","Whitetopping","Precast Pavement","Cast-in-Place Prestressed Pavement","Recycled Concrete Pavement","RCC Pavement"]
    }
};
let project_name = Object.keys(project_collection).map(k => project_collection[k]['text']);
let colors = d3.scaleOrdinal(d3.schemeCategory10).domain(project_name);

let project_feature = {
    "Level 1 Sections": ["Deflections","LTE","Cracks","Pictures"],
    "all":["Plans","Reports","Pictures"]
}
let project_feature_collection = {
    Deflections:{
        text: "Deflections",
        id: "Deflections",
        show: queryfromsource
    },
    LTE:{
        text: "Load Transfer Efficiency",
        id: "LTE",
        show: queryfromsource
    },
    Cracks:{
        text: "Crack Information",
        id: "Cracks",
        show: queryfromsource
    },
    Pictures:{
        text: "Pictures",
        id: "Pictures",
        show: queryfromsource
    },
    Plans:{
        text: "Plans",
        id: "Plans",
        show: queryfromsource
    },
    Reports:{
        text: "Reports",
        id: "Reports",
        show: queryfromsource
    }
}

let filters =[];
let yearRangeFilter = {
    min : 0,
    max : 0,
    from: 0,
    to: 2100
};

// map

let us,us_dis;
let map_conf ={
    margin: {top: 0, right: 0, bottom: 0, left: 0},
    width: window.innerWidth,
    height: window.innerHeight,
    scalezoom: 1,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    },
    plotCountyOption = true;
// menu

let schemaSvg_option = {
    margin: {top: 2, right: 10, bottom: 15, left: 130},
    width: 420,
    height: 600,
    scalezoom: 1,
    widthView: function(){return this.width*this.scalezoom},
    heightView: function(){return this.height*this.scalezoom},
    widthG: function(){return this.widthView()-this.margin.left-this.margin.right},
    heightG: function(){return this.heightView()-this.margin.top-this.margin.bottom},
    barcolor: '#000000',
};

let Colors = [
    "#1F77B4",
    "#FF7F0E",
    "#2CA02C",
    "#D62728",
    "#9467BD",
    "#8C564B",
    "#E377C2",
    "#7F7F7F",
    "#BCBD22",
    "#17BECF",
    "#008b8b",
    "#a9a9a9",
    "#006400",
    "#bdb76b",
    "#8b008b",
    "#556b2f",
    "#ff8c00",
    "#9932cc",
    "#8b0000",
    "#e9967a",
    "#9400d3",
    "#ff00ff",
    "#ffd700",
    "#008000",
    "#4b0082",
    "#f0e68c",
    "#add8e6",
    "#e0ffff",
    "#90ee90",
    "#d3d3d3",
    "#ffb6c1",
    "#ffffe0",
    "#00ff00",
    "#ff00ff",
    "#800000",
    "#000080",
    "#808000",
    "#ffa500"
];

let sectionProjectMap = {}