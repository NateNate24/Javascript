var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();

// Page height and width
var PG_WIDTH = "894";
var PG_HEIGHT = "1223";
var CLOSE = "Close";

// Action buttons to be displayed as per Standard Business Rules 
Vitro.Elements.SetActionButtonVisibility(myApp);
// Create and set standard Cease functionality 
Vitro.Elements.CreateCeaseButton(myApp, PG_WIDTH, PG_HEIGHT, function(ceaseStatus) {
	// If status is equal to "Ceased"
	if(ceaseStatus == Vitro.Elements.StringConstants.Ceased) 
	{
		CeaseSeal_Callback();
		latestPg1.Hide(true);
	}
});

// Create and set Unseal (Cease/Seal) functionality 
Vitro.Elements.SetUnsealAction(myApp, appActivityId);

// App level event handlers
myApp.Events.Ready(myApp_Ready);
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);
// Set the page added event
myApp.PageManager.Events.Added(Pages_Added);

// latest page 1 overflow
var latestPg1 = GetLatestPage1();

// Page variables
var pg1 = myApp.RegisterPage("pg1");

// User variables
var isSuperUser1 = Vitro.Users().InGroup("Super User");

// CONSTANTS
var APP_NAME = "Blood Glucose and Ketone Chart";
var REP_NUMS = 14;
var MAX_CHART_POINT = 20;
var MIN_CHART_POINT = 0;
var RED_COLOR = "255, 255, 0, 0";
var BLACK_COLOR = "255,0,0,0";
var COLOURS = Vitro.Elements.Colours;

var repeatedCtrls = ["dpDate", "dpTime", "txtBGL", "txtComment", "txtKetone", "authSign", "txtStrike", "txtInitialsDate", "btnSTK"];

var chartPoints = {
	"0": { 
		"0": {index: 1}, "0.1": {index: 1}, "0.2": {index: 2},  "0.3": {index: 3}, "0.4": {index: 4},
		"0.5": {index: 5}, "0.6": {index: 6}, "0.7": {index: 7}, "0.8": {index: 8}, "0.9": {index: 9},
	},
	"1": {
		"1": {index: 10}, "1.1": {index: 11}, "1.2": {index: 12},  "1.3": {index: 13}, "1.4": {index: 14},
		"1.5": {index: 15}, "1.6": {index: 16}, "1.7": {index: 17}, "1.8": {index: 18}, "1.9": {index: 19},
	},
	"2": {
		"2": {index: 20}, "2.1": {index: 21}, "2.2": {index: 22},  "2.3": {index: 23}, "2.4": {index: 24},
		"2.5": {index: 25}, "2.6": {index: 26}, "2.7": {index: 27}, "2.8": {index: 27}, "2.9": {index: 28},
	},
	"3": {
		"3": {index: 29}, "3.1": {index: 30}, "3.2": {index: 31},  "3.3": {index: 32}, "3.4": {index: 33},
		"3.5": {index: 34}, "3.6": {index: 34}, "3.7": {index: 35}, "3.8": {index: 36}, "3.9": {index: 37},
	},
	"4": {
		"4": {index: 38}, "4.1": {index: 39}, "4.2": {index: 40},  "4.3": {index: 40}, "4.4": {index: 41},
		"4.5": {index: 42}, "4.6": {index: 43}, "4.7": {index: 44}, "4.8": {index: 44}, "4.9": {index: 45},
	},
	"5": {
		"5": {index: 48}, "5.1": {index: 49}, "5.2": {index: 50},  "5.3": {index: 51}, "5.4": {index: 52},
		"5.5": {index: 53}, "5.6": {index: 54}, "5.7": {index: 55}, "5.8": {index: 55}, "5.9": {index: 56},
	},
	"6": {
		"6": {index: 57}, "6.1": {index: 58}, "6.2": {index: 59},  "6.3": {index: 60}, "6.4": {index: 61},
		"6.5": {index: 62}, "6.6": {index: 63}, "6.7": {index: 64}, "6.8": {index: 65}, "6.9": {index: 66},
	},
	"7": {
		"7": {index: 67}, "7.1": {index: 68}, "7.2": {index: 69},  "7.3": {index: 70}, "7.4": {index: 71},
		"7.5": {index: 72}, "7.6": {index: 73}, "7.7": {index: 74}, "7.8": {index: 75}, "7.9": {index: 76},
	},
	"8": {
		"8": {index: 77}, "8.1": {index: 78}, "8.2": {index: 79},  "8.3": {index: 80}, "8.4": {index: 81},
		"8.5": {index: 82}, "8.6": {index: 83}, "8.7": {index: 84}, "8.8": {index: 84}, "8.9": {index: 85},
	},
	"9": {
		"9": {index: 86}, "9.1": {index: 87}, "9.2": {index: 88}, "9.3": {index: 89}, "9.4": {index: 90},
		"9.5": {index: 91}, "9.6": {index: 92}, "9.7": {index: 93}, "9.8": {index: 94}, "9.9": {index: 95},
	},
	"10": {
		"10": {index: 96}, "10.1": {index: 97}, "10.2": {index: 98},  "10.3": {index: 99}, "10.4": {index: 99},
		"10.5": {index: 100}, "10.6": {index: 101}, "10.7": {index: 102}, "10.8": {index: 103}, "10.9": {index: 104},
	},
	"11": {
		"11": {index: 105}, "11.1": {index: 106}, "11.2": {index: 107},  "11.3": {index: 108}, "11.4": {index: 109},
		"11.5": {index: 110}, "11.6": {index: 111}, "11.7": {index: 112}, "11.8": {index: 113}, "11.9": {index: 114},
	},
	"12": {
		"12": {index: 115}, "12.1": {index: 116}, "12.2": {index: 117},  "12.3": {index: 117}, "12.4": {index: 118},
		"12.5": {index: 119}, "12.6": {index: 120}, "12.7": {index: 121}, "12.8": {index: 122}, "12.9": {index: 123},
	},
	"13": {
		"13": {index: 124}, "13.1": {index: 125}, "13.2": {index: 126},  "13.3": {index: 127}, "13.4": {index: 128},
		"13.5": {index: 129}, "13.6": {index: 130}, "13.7": {index: 131}, "13.8": {index: 132}, "13.9": {index: 133},
	},
	"14": {
		"14": {index: 134}, "14.1": {index: 136}, "14.2": {index: 137},  "14.3": {index: 137}, "14.4": {index: 138},
		"14.5": {index: 139}, "14.6": {index: 140}, "14.7": {index: 140}, "14.8": {index: 141}, "14.9": {index: 142},
	},
	"15": {
		"15": {index: 143}, "15.1": {index: 144}, "15.2": {index: 145},  "15.3": {index: 146}, "15.4": {index: 147},
		"15.5": {index: 148}, "15.6": {index: 149}, "15.7": {index: 150}, "15.8": {index: 151}, "15.9": {index: 152},
	},	
	"16": {
		"16": {index: 153}, "16.1": {index: 154}, "16.2": {index: 155},  "16.3": {index: 155}, "16.4": {index: 156},
		"16.5": {index: 157}, "16.6": {index: 158}, "16.7": {index: 159}, "16.8": {index: 160}, "16.9": {index: 161},
	},
	"17": {
		"17": {index: 162}, "17.1": {index: 163}, "17.2": {index: 164},  "17.3": {index: 165}, "17.4": {index: 166},
		"17.5": {index: 167}, "17.6": {index: 168}, "17.7": {index: 169}, "17.8": {index: 170}, "17.9": {index: 171},
	},
	"18": {
		"18": {index: 172}, "18.1": {index: 173}, "18.2": {index: 174},  "18.3": {index: 175}, "18.4": {index: 176},
		"18.5": {index: 177}, "18.6": {index: 178}, "18.7": {index: 179}, "18.8": {index: 180}, "18.9": {index: 181},
	},
	"19": {
		"19": {index: 182}, "19.1": {index: 183}, "19.2": {index: 184},  "19.3": {index: 184}, "19.4": {index: 185},
		"19.5": {index: 186}, "19.6": {index: 187}, "19.7": {index: 188}, "19.8": {index: 189}, "19.9": {index: 190},
	},
	"20" : {
		"20": {index: 191}, "20.1": {index: 192}, "20.2": {index: 193},  "20.3": {index: 194}, "20.4": {index: 195},
		"20.5": {index: 196}, "20.6": {index: 197}, "20.7": {index: 198}, "20.8": {index: 199}, "20.9": {index: 200},
	},
	"21" : {
		"21": {index: 201}
	}
};

var routes = ["", "PO", "Subcut", "IV"];
var TXT_WITH_VALUE = false;

// register page 1 controls
RegisterPageControls(latestPg1);
// register repeater controls
Vitro.Elements.RegisterRepeaterControls(latestPg1, repeatedCtrls, REP_NUMS);

// added event function for overflow pages
function Pages_Added(pg) {
	if (pg === pg1 || myApp.PageManager.Master(pg) === pg1)
	{
		// register page 1 controls
		RegisterPageControls(pg);
		// register repeater controls
		Vitro.Elements.RegisterRepeaterControls(pg, repeatedCtrls, REP_NUMS);		

	}
}
	
// Default Ready handler
function myApp_Ready() {

    // Set patient label details
	Vitro.Elements.SetAddressograph(myApp, latestPg1);
	// Call Client Logo Wrap legacy VitroApplication.js function in Typesafe call      
	Vitro.Elements.GetClientLogo(myApp, latestPg1.Control("imgClientLogo"));  
}

// Default Loaded handler
function myApp_Loaded() {
	
	// submitted activity
	if (status != Vitro.STATUS.Sealed)
	{
		// enable next available column and populate date and time
		EnableColumn(latestPg1);

		// show STK?
		ShowSTK_OnLoad();
		
		// Set events
		SetEvents(latestPg1);

		// Set patient label details
		Vitro.Elements.SetAddressograph(myApp, latestPg1);
		// Call Client Logo Wrap legacy VitroApplication.js function in Typesafe call      
		Vitro.Elements.GetClientLogo(myApp, latestPg1.Control("imgClientLogo"));  
	}
	else {
		var pgIds = myApp.Properties.PageIDs();
		var latestPg = myApp.Page(pgIds[0]);
			// check if page is an overflow
		if (latestPg !== pg1)
		{
			// if authorisation control in 1st column of the latest overflow page has no value
			if (latestPg.authSign[0].Value() == "")
			{
				latestPg.Hide(true);

			}
			else {
				latestPg.Show(true).PrintVisibility(true).ChartVisibility(true);
			}
			myApp.Clean();
		}
		
	}
}

// Default Actions handler
function myApp_Actions(action) {
	// Collection of pages
	var pgIds = myApp.Properties.PageIDs();
	if (action == Vitro.ACTIONS.Submit)
	{
		for (var p = 0; p < pgIds.length; p++)
		{
			for (var i = 0; i < REP_NUMS; i++)
			{
				// If BGL, Medication and Route has no value
				if (latestPg1.txtBGL[i].Value() == "" && latestPg1.txtComment[i].Value() == "" && latestPg1.txtKetone[i].Value() == "")
				{
					// Remove value in Date and Time of column
					latestPg1.dpDate[i].Value("");
					latestPg1.dpTime[i].Value("");
				}
				
				// If any signature has value make it read-only
				var pageObj = myApp.Page(pgIds[p]);
				if (pageObj.authSign[i].Value() != "")
				{                    
                    if (Vitro.Elements.CheckRequired(myApp)) {
                        pageObj.authSign[i].ReadOnly(true);
                    }                   					
				}
			}
		}
	}
	
    if (action == Vitro.ACTIONS.Seal)
	{		
		for (var p = 0; p < pgIds.length; p++)
		{
			for (var i = 0; i < REP_NUMS; i++)
			{
				myApp.Page(pgIds[p]).Control("btnSTK[" + i + "]").Hide();
			}
		}
		CeaseSeal_Callback();
	}

	if (action == Vitro.ACTIONS.Unseal) {
		if (myApp.Page(pgIds[0]).Properties.IsVisible() === false)
		{
			myApp.Page(pgIds[0]).Show(true);
		}
		myApp.Page(pgIds[0]).PrintVisibility(true).ChartVisibility(true);
		myApp.Clean();
	}
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
}

// Set Events
function SetEvents(pg) {
	for (var i = 0; i < REP_NUMS; i++)
	{	
		pg.dpDate[i].Events.Change(dpDate_Change);
		pg.dpTime[i].Events.Change(dpDate_Change);
		pg.txtBGL[i].Events.Change(txtBGLKetone_Change);
		pg.txtKetone[i].Events.Change(txtBGLKetone_Change);
		pg.txtComment[i].Events.Change(txtComment_Change);
		pg.authSign[i].Events.Change(authSign_Change);
	}
}

// Date change event
function dpDate_Change(pg, ctrl, oVal, nVal) {
	
	var indx = Vitro.Elements.GetRepeaterIndex(ctrl);	
	
	if (ctrl.Properties.ID() === "dpDate[" + indx + "]") {
		Vitro.Elements.DateTimeValidate(ctrl, nVal, undefined, undefined, undefined, pg.dpTime[indx]);
	} else {
		Vitro.Elements.DateTimeValidate(ctrl, nVal, undefined, undefined, pg.dpDate[indx]);
	}
	
	if (pg.dpDate[indx].Value() && pg.dpTime[indx].Value() && pg.txtBGL[indx].Value()) {
			pg.authSign[indx].Enable().Required();					
	}
	
}

// BGL / Ketone change event
function txtBGLKetone_Change(pg, ctrl, oVal, nVal) {
	
	if(isNaN(nVal)) {
		ctrl.Value(oVal);
	}
	else {
		var indx = Vitro.Elements.GetRepeaterIndex(ctrl);
		if (ctrl.Properties.ID() == "txtBGL[" + indx + "]" && nVal >= 0) {
			var pointInfo = GetPointInfo(nVal, chartPoints);
			plotPoints(pg, pg.psMonitoring, nVal, pointInfo, indx);
		}
	
		if (nVal != "")
		{   
			TXT_WITH_VALUE = true;
			var regexp_lessThan1 = /^(\.\d{1,2})?$/;
			var regexp_greaterThan1 = /^\d+(\.\d{1,2})?$/;
			// if the value of the control is not decimal numbers, the field will be cleared
			if (regexp_lessThan1.test(nVal) !== true && regexp_greaterThan1.test(nVal) !== true) {
				ctrl.Value("");
				TXT_WITH_VALUE = false;				
				
				if (ctrl.Properties.ID() == "txtBGL[" + indx + "]") {					
					var psMonitoring = pg.psMonitoring.Value();
					psMonitoring.push([indx, null]);					
					pg.psMonitoring.Value(psMonitoring);
				}			

			}
			// if BGL/KETONE with value is equal to true
			if (TXT_WITH_VALUE === true) {
				if (ctrl.Properties.ID() == "txtBGL[" + indx + "]") {
					pg.txtBGL[indx].Attribute(Vitro.TEXTBOX.TextColour, BLACK_COLOR, true);
				
					if (Number(nVal) >= 12) {
						CreateMessagePopup(pg, nVal, "BGL");
						pg.txtBGL[indx].Attribute(Vitro.TEXTBOX.TextColour, RED_COLOR, true);
					}
	
					if (Number(nVal) < 4) {
						CreateMessagePopup(pg, nVal, "BGL");
						pg.txtBGL[indx].Attribute(Vitro.TEXTBOX.TextColour, RED_COLOR, true);
					}
				}
				else {			
	
					if (Number(nVal) >= 1) {					
						CreateMessagePopup(pg, nVal, "KETONE");
						pg.txtKetone[indx].Attribute(Vitro.TEXTBOX.TextColour, RED_COLOR, true);
					} else {
						pg.txtKetone[indx].Attribute(Vitro.TEXTBOX.TextColour, BLACK_COLOR, true);
					}
				}
				
				var currDate = new Date();
	
				// display current date
				pg.dpDate[indx].Value(currDate);
				// display current time
				pg.dpTime[indx].Value(currDate);

				// enable column sign
				if ((pg.txtBGL[indx].Value() || pg.txtKetone[indx].Value() || pg.txtComment[indx].Value()) && pg.dpDate[indx].Value() && pg.dpTime[indx].Value()) {
					pg.authSign[indx].Enable().Required();				
				}else{
					pg.authSign[indx].Disable().NotRequired();
				}
			}
			else {

				if (pg.txtBGL[indx].Value() || pg.txtKetone[indx].Value() || pg.txtComment[indx].Value()) {
					pg.authSign[indx].Enable().Required();
				} else {
					pg.authSign[indx].Disable().NotRequired();
					// clear date/time
					pg.dpDate[indx].Value("");
					pg.dpTime[indx].Value("");
				}
			}
		}
		else
		{
			if (pg.txtBGL[indx].Value() || pg.txtKetone[indx].Value() || pg.txtComment[indx].Value()) {
				pg.authSign[indx].Enable().Required();
			} else {
				pg.authSign[indx].Disable().NotRequired();
				// clear date/time
				pg.dpDate[indx].Value("");
				pg.dpTime[indx].Value("");
			}			
		}
	}
	
}

// Comment Textbox change
function txtComment_Change(pg, ctrl, oVal, nVal) {
	
	var indx = Vitro.Elements.GetRepeaterIndex(ctrl);
	var currDate = new Date();
	if (nVal) {
		// display current date
		pg.dpDate[indx].Value(currDate);
		// display current time
		pg.dpTime[indx].Value(currDate);
		pg.authSign[indx].Enable().Required();
	}
	else {
		if (!pg.txtBGL[indx].Value() && !pg.txtKetone[indx].Value()) {
			pg.dpDate[indx].Value("");
			pg.dpTime[indx].Value("");
			pg.authSign[indx].Disable().NotRequired();
		}
	}
}

// Plots the point series value
function plotPoints(page, control, newValue, pointValue, index) {
	var psMonitoring = control.Value();
	if (newValue) {
		psMonitoring.push([index, pointValue.index]);
	}
	else {
		psMonitoring.pop();
		control.Value("");
	}
	control.Value(psMonitoring);

}

// Sign change event
function authSign_Change(pg, ctrl, oVal, nVal) {
	var indx = Vitro.Elements.GetRepeaterIndex(ctrl);
	if (nVal != "")
	{
		if (myApp.Properties.PageIDs().length > 1 && pg.Order() === 1 && indx === 0) {
			if (!myApp.Page(myApp.Properties.PageIDs()[1]).authSign[REP_NUMS - 1].Properties.IsReadOnly()) {
				myApp.Page(myApp.Properties.PageIDs()[1]).authSign[REP_NUMS - 1].ReadOnly();
			}	
		}
		if (indx > 0 && !pg.authSign[indx - 1].Properties.IsReadOnly()) {
			pg.authSign[indx - 1].ReadOnly()
		}
		
		// Populate the authorisation control with the users initials and date & time in the following format –  CC dd/MM HH:MM
		nVal.SignStamp = Vitro.Elements.GetUserDetails().Initial;
		ctrl.Value(nVal);
		// make controls read-only
		pg.dpDate[indx].ReadOnly(true);
		pg.dpTime[indx].ReadOnly(true);
		pg.txtBGL[indx].ReadOnly(true);
		pg.txtKetone[indx].ReadOnly(true);
		pg.txtComment[indx].ReadOnly(true);
		// enable next column
		EnableColumn(pg);
	}
	else
	{
		// make controls writeable
		pg.dpDate[indx].Writeable(true);
		pg.dpTime[indx].Writeable(true);
		pg.txtBGL[indx].Writeable(true);
		pg.txtKetone[indx].Writeable(true);
		pg.txtComment[indx].Writeable(true);
		// disable next column
		// If not last column
		if (indx !== REP_NUMS - 1)
		{
			var nextIndx = indx + 1;
			// Make read-only and clear the value of the next column
			pg.dpDate[nextIndx].ReadOnly(true);
			pg.dpTime[nextIndx].ReadOnly(true);
			pg.txtBGL[nextIndx].ReadOnly(true);
			pg.txtKetone[nextIndx].ReadOnly(true);
			pg.txtComment[nextIndx].ReadOnly(true);
			// remove value of date and time
			pg.dpDate[nextIndx].Value("");
			pg.dpTime[nextIndx].Value("");
			pg.txtBGL[nextIndx].Value("");			
			pg.txtComment[nextIndx].Value("");
			pg.txtKetone[nextIndx].Value("");
			var psMonitoring = pg.psMonitoring.Value();
			if (psMonitoring.length > nextIndx) {
				psMonitoring.pop();
				pg.psMonitoring.Value("");
				pg.psMonitoring.Value(psMonitoring);	
			}
			// Disable and make the signature not required 
			pg.authSign[nextIndx].Disable().NotRequired();
		}
	
	}
	// IF the last column has been completed AND The current page is the latest page 
	if (indx === REP_NUMS - 1 && pg.Order() == 1)
	{
		ClonePg1();
	}
}

// STK click event
function btnSTK_Click(pg, ctrl, x, y) {
	var indx = Vitro.Elements.GetRepeaterIndex(ctrl);
	ctrl.Hide();
	pg.txtStrike[indx].Show();
	var signDetails = Vitro.Elements.GetUserDetails().Initial + "\n" + Vitro.Elements.GetDateString(new Date()).ddMM;
	pg.txtInitialsDate[indx].Value(signDetails).Show();
	pg.authSign[indx].ReadOnly(true);
}
	
// Enable next available column and populate date and time
function EnableColumn(pg) {
	
	for (var i = 0; i < REP_NUMS; i++)
	{
		if (pg.dpDate[i].Value() == "" && pg.dpTime[i].Value() == "")
		{
			pg.dpDate[i].Writeable();
			pg.dpTime[i].Writeable();
			pg.txtBGL[i].Writeable();
			pg.txtKetone[i].Writeable();
			pg.txtComment[i].Writeable();
		
			break;
		}
	}
}

// Show STK
function ShowSTK_OnLoad() {
	// Collection of pages
	var pgIds = myApp.Properties.PageIDs();
	for (var p = 0; p < pgIds.length; p++)
	{
		for (var i = 0; i < REP_NUMS; i++)
		{		
			// column signed AND not strikethrough
			// If any signature has value make it read-only
			var pageObj = myApp.Page(pgIds[p]);
			if (pageObj.authSign[i].Value() != "" && pageObj.txtInitialsDate[i].Value() == "")
			{
				// column sign
				var su = pageObj.authSign[i].Value().SignerDetails;
				var suArr = su.split("\n");
				var signInits = suArr[0];
				// current user
				var userDetailsName = Vitro.Elements.GetUserDetails().Name;
				
				// user is the one who signed column OR is super user
				if (signInits == userDetailsName || isSuperUser1)
				{
					// show STK button
					pageObj.btnSTK[i].Show();
					// set event for stk button click
					pageObj.btnSTK[i].Events.Click(btnSTK_Click);
				}
				else
				{
					// hide STK button
					pageObj.btnSTK[i].Hide();
				}
			}
		}
	}
}

// registers a list of controls in page
function RegisterPageControls(pg) {    
	// Register control names into the Page namespace
	pg.RegisterControls("cblDiabetes", "chkType1", "chkType2", "chkDiabetesY", "chkDiabetesN", "rptMonitoring", "chMonitoring", "psMonitoring");
}

// Function from Obs Chart
// Get index of valu on chart
function GetPointInfo(value, infoObj) {
    if (value !== "" && value !== null) {
        value = parseFloat(value);
        // get list of the lowest value in each range
        var rangeArray = [];
        for (var range in infoObj) {
            if (infoObj.hasOwnProperty(range)) {
                rangeArray.push(range);
            }
        }
        // get point information based on what range the value is in
        var pointInfo = null;
        for (var i = 0; i < rangeArray.length; i++) {
			var arrValObj = infoObj[rangeArray[i]];
			var valArray = [];
			for (var val in arrValObj) {
				valArray.push(val);
	        }
			for (var j = 0; j < valArray.length; j++) {
				// if value lands in current range
	            if (((j + 1) < valArray.length) && (value >= parseFloat(valArray[j]) && value < parseFloat(valArray[(j + 1)]))) {
	                pointInfo = arrValObj[valArray[j]];
	                break;
	            }
	            // if value is in final range
	            else if ((j + 1) === valArray.length && value >= parseFloat(valArray[j])) {
	                pointInfo = arrValObj[valArray[j]];
	                break;
	            }
			}
        }
        return pointInfo;
    }
    return null;
}

// Return the next value in the array parameter.
function InNextArray(value, array)
{
	var ret = "";
	for (var i = 0, len = array.length; i <= len; i++) 
	{
		if (array[i] == value)
		{
			if ((i + 1) < len)
			{
				ret = array[i+1];
			}
			break;
		}
	}	
	return ret;
}

// get latest page 1
function GetLatestPage1() {
    // Collection of pages ID
    var pgIds = myApp.Properties.PageIDs();
	var latestPage1 = pgIds[0];
	return myApp.Page(latestPage1);
}

// clone page 1
function ClonePg1() {
	var addedPage = myApp.PageManager.Clone(pg1);
	// Set cloned page to not deletable, set as page 1
	addedPage.Order(1).Deletable(false).Show(true).Title(APP_NAME).PrintVisibility(true);
	// set title to date of the first column
	myApp.Page(myApp.Properties.PageIDs()[1]).Title(Vitro.Elements.GetDateString(myApp.Page(myApp.Properties.PageIDs()[1]).dpDate[0].Value()).ddMMyy);
	// Reorder and rename previous pages
	// ReorderRenamePreviousPages();
	Pages_Added(addedPage);
	// Make writeable first column and populate date & time
	EnableColumn(addedPage);
	// Set patient label details
	Vitro.Elements.SetAddressograph(myApp, addedPage);
	// Call Client Logo Wrap legacy VitroApplication.js function in Typesafe call      
	Vitro.Elements.GetClientLogo(myApp, addedPage.Control("imgClientLogo"));  

	// set new page as latest page 1
	latestPg1 = addedPage;
	
	// activate new page
	latestPg1.Activate();
		
	// Set events
	SetEvents(latestPg1);

	// Get the previous page
	var previousPgId = 1;
	var pgIds = myApp.Properties.PageIDs();
	var previousPg = myApp.Page(pgIds[previousPgId]);

	// Copy the values of Diabetes checkboxes
	latestPg1.chkDiabetesY.Value(previousPg.chkDiabetesY.Value());
	latestPg1.chkDiabetesN.Value(previousPg.chkDiabetesN.Value());
	latestPg1.chkType1.Value(previousPg.chkType1.Value());
	latestPg1.chkType2.Value(previousPg.chkType2.Value());

	// Fix for issue where older page is editable
	previousPg.chkDiabetesY.ReadOnly(true);
	previousPg.chkDiabetesN.ReadOnly(true);
	previousPg.chkType1.ReadOnly(true);
	previousPg.chkType2.ReadOnly(true);

}

// Reorder from newest to oldest and rename previous pages
function ReorderRenamePreviousPages() {
	var pageIds = myApp.Properties.PageIDs();
	// store in array page IDs
	var pgArr = [];
	for (var x=0; x<pageIds.length; x++)
	{
		pgArr.push(pageIds[x]);
	}
	// sort page IDs alphabetically then reverse it
	pgArr.sort();
	pgArr.reverse();
	
	var orderIndex = pgArr.length;
	
	// except first page
	for (var i = 1; i < pgArr.length; i++)
	{
		// reorder pages from newest to oldest
		var pgItem = myApp.Page(pgArr[i]);
		pgItem.Order(orderIndex);
		orderIndex--;
		
		// set title to date of the first column
		var pgName = Vitro.Elements.GetDateString(pgItem.dpDate[0].Value()).ddMMyy;
		pgItem.Title(pgName);
	}
}

// Cease/Seal callback
function CeaseSeal_Callback() {
	// Collection of pages
	var pgIds = myApp.Properties.PageIDs();
	for (var p = 0; p < pgIds.length; p++)
	{
		for (var i = 0; i < REP_NUMS; i++)
		{
			// clear date & time of column without BGL, Medications and Route values
			if (latestPg1.txtBGL[i].Value() == "" && latestPg1.txtComment[i].Value() == "" && latestPg1.txtKetone[i].Value() == "")
			{
				// Remove value in Date and Time of column
				latestPg1.dpDate[i].Value("");
				latestPg1.dpTime[i].Value("");
			}
			
			// If any signature has value make it read-only
			var pageObj = myApp.Page(pgIds[p]);
			if (pageObj.authSign[i].Value() != "")
			{
				if (Vitro.Elements.CheckRequired(myApp)) {
					pageObj.authSign[i].ReadOnly(true);
				}
			}
		}
	}
	
	for (var p = 0; p < pgIds.length; p++)
		{
			for (var i = 0; i < REP_NUMS; i++)
			{
				myApp.Page(pgIds[p]).Control("btnSTK[" + i + "]").Hide();
			}
	}

	// check if page is an overflow
	if (latestPg1 !== pg1)
	{
		// if authorisation control in 1st column of the latest overflow page has no value
		if (latestPg1.authSign[0].Value() == "")
		{
			myApp.Page(pgIds[0]).Hide(true);
			latestPg1.PrintVisibility(false).ChartVisibility(false);
		}
	}
}

    // create dynamic cease popup
function CreateMessagePopup(page, nVal, txtTYPE) {

    var popup = {};
    // cover page with panel to stop user messing with controls
    popup.panBackground = Vitro.Elements.CreateDynamicPanel(page, PG_WIDTH, PG_HEIGHT, false, COLOURS.TRANSPARENT);
    // create popup panel
    popup.panPopup = Vitro.Elements.CreateDynamicPanel(page, "350", "170", true, "255, 70, 117, 196", popup.panBackground);
    
	// labels  	
	if (nVal >= 12 && txtTYPE == "BGL") {
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 20", "300", "50", "14", "Left", "Bold", "BGL ≥ 12 mmol/L", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 40", "300", "50", "12", "Left", "Normal", "Follow Guidelines (intranet / link)", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 60", "300", "50", "12", "Left", "Normal", "  ○ Consult coordinator/anaesthetist, consider commencing insulin protocol", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 95", "300", "50", "12", "Left", "Normal", "  ○ Document interventions", popup.panPopup);	
	}

	if (nVal < 4 && txtTYPE == "BGL") {
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 20", "300", "50", "14", "Left", "Bold", "BGL < 4 mmol/L", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 40", "300", "50", "12", "Left", "Normal", "Follow Guidelines (intranet / link)", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 60", "300", "50", "12", "Left", "Normal", "  ○ Consult coordinator/anaesthetist", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 80", "300", "50", "12", "Left", "Normal", "  ○ Document interventions", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 100", "300", "50", "12", "Left", "Normal", "  ○ Consider food/glucose administration", popup.panPopup);	
	}
	
	if (nVal >= 1 && txtTYPE == "KETONE") {
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 20", "300", "50", "14", "Left", "Bold", "Ketone ≥ 1 mmol/L", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 40", "300", "50", "12", "Left", "Normal", "Follow Guidelines (intranet / link)", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 60", "300", "50", "12", "Left", "Normal", "  ○ Consult coordinator/anaesthetist", popup.panPopup);
		popup.lblMessage = CreateDynamicMessageLabel(page, "20, 80", "300", "50", "12", "Left", "Normal", "  ○ Document interventions", popup.panPopup);	
	}
	
	popup.btnClose = Vitro.Elements.CreateDynamicButton(page, "250, 130", "75", "25", "14", CLOSE, popup.panPopup);
	
	Vitro.Elements.SetPositionEvents(myApp, page, popup.panPopup, PG_WIDTH, PG_HEIGHT);

	var evBtnClose = popup.btnClose.Events.Click(ClosePopup);
	
	function ClosePopup(page) {		
		// remove popup
		page.DestroyControl(popup.panBackground);
		popup = null;
		evBtnClose.Remove();
	}
	
    return popup;
	
}


// create a label with default properties
function CreateDynamicMessageLabel(page, position, width, height, fontSize, textAlignment, fontWeight, text, parentControl) {
        // set label properties
        var props = {};
        props[Vitro.CONTROL.Position] = position;
        props[Vitro.CONTROL.Width] = width;
        props[Vitro.CONTROL.Height] = height;
        props[Vitro.CONTROL.ZIndex] = "0";
        props[Vitro.CONTROL.Border] = "False";
        props[Vitro.CONTROL.FontFamily] = "Courier New";
        props[Vitro.CONTROL.FontSize] = fontSize;
        props[Vitro.LABEL.TextAlignment] = textAlignment;
        props[Vitro.CONTROL.FontWeight] = fontWeight;
		props[Vitro.LABEL.TextColour] = "255, 255, 255, 255";
        props[Vitro.LABEL.Content] = text;
        // create control
        return page.CreateControl(Vitro.TYPE.Label, props, parentControl);
}
