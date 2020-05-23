let plotType = 'heatmap';
let plotTypeSelection = 'contour';
let corScale;
let data = null;
let avgData = null;
let profiles = ["Profile1", "Profile2", "Profile3"];
let defaultProfileIndex = 0;
// Hao edit
// let letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M"];
let letters = ["A", "B", "C", "D", "E", "F"];
// let letters = ["A", "B", "C", "D", "E", "F", "G", "H"];
// let digits = ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"];
let digits = ["01", "02", "03", "04", "05", "06", "07", "08", "09"];
// let digits = ["01", "02", "03", "04", "05", "06", "07"];
let columns = [
    'Grid ID',
    'Al Concentration',
    'Ca Concentration',
    'Cr Concentration',
    'Cu Concentration',
    'Fe Concentration',
    'K Concentration',
    'Mn Concentration',
    'Nb Concentration',
    'Ni Concentration',
    'Pb Concentration',
    'Rb Concentration',
    'S Concentration',
    'Si Concentration',
    'Sr Concentration',
    'Th Concentration',
    'Ti Concentration',
    'V Concentration',
    'Y Concentration',
    'Zn Concentration',
    'Zr Concentration'];
let allElements = [];
let defaultElementIndexes = [1, 0];
let theOptions = [];
let currentColumnNames = [];
let xContour = null;
let yContour = null;
let elmConcentrations = [];
let contourData = [];

let theProfile = null;

//Default color scales
let colorScales = contourColorScales[profiles[defaultProfileIndex]];
//The level color scale index (0, 1, 2 for 5 levels, 10 levels, and 20 levels correspondingly).
let colorLevelsScaleIndex = 2;