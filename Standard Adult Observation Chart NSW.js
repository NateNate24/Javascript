var myApp = Vitro.RegisterApp(appActivityId);

myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Actioned(myApp_Actioned);
myApp.Events.Unload(myApp_Unload);
// Set the page added event
myApp.PageManager.Events.Added(Pages_Added);
// Set the page displayed event
myApp.PageManager.Events.Displayed(Pages_Displayed);

// register pages
var pgQE = myApp.RegisterPage("page1");
var pgObs = myApp.RegisterPage("page2");
var pgObs2 = myApp.RegisterPage("page3");
var pgInterv = myApp.RegisterPage("page4");
var pgEsc = myApp.RegisterPage("page5");

// repeater length constants
var NUM_OBS_REPS = 21;
var NUM_FREQUENCY_REPS = 4;
var NUM_MOD_REPS = 4;
var NUM_INT_REPS = 4;
var NUM_ADDIT_OBS_REPS = 7;

// Pain contstants
var PAIN_SEVERE = 7;
var PAIN_MODERATE = 4;
var PAIN_MILD = 1;
var PAIN_NIL = 0;
var REST_CODE = "R";
var MOVEMENT_CODE = "M";
var RESTMOVEMENT_CODE = "RM";

// page dimensions
var QE_WIDTH = "561";
var QE_HEIGHT = "371";

// page dimensions
var OBS_WIDTH = "794";
var OBS_HEIGHT = "1123";

// action button names
var BTN_OBS = "Add New Obs";
var BTN_PROG_NOTES = "Progress Notes";
var BTN_CEASE = "Cease";

// default page names
var PAGE_NAME_OBS = "Observation Page 1";
var PAGE_NAME_OBS2 = "Observation Page 2";
var PAGE_NAME_INT = "ACC and Interv";

// get colour defaults
var COLOURS =  Vitro.Elements.Colours;
var CUSTOMCOLOURS = {
   SOLID_LIGHTRED: "255, 255, 120, 120",
   SOLID_LIGHTGREY: "128,217,217, 217",
   SOLID_LIGHTYELLOW: "255, 252, 237, 108",
   SOLID_RED: "255, 255, 0, 0",
   SOLID_BLACK: "255, 0, 0, 0",
   SOLID_BLUE: "255, 0, 112, 192",
   SOLID_PURPLE: "255, 208, 195, 221",
   SOLID_PINK: "255, 249, 193, 166",
   SOLID_YELLOW: "255, 253, 236, 108",
   POPUP_ORANGE: "255, 241, 169, 131",
   POPUP_LIGHTBLUE: "255, 218, 233, 247",
   POPUP_BLUE: "255, 165, 201, 235",
   POPUP_RED: "255, 255, 105, 105",
   POPUP_LIGHTPINK: "255, 242, 206, 237"


};
// key to check which textbox is required for displaying chart value
var GREATER = "Greater";
var LESSER = "Lesser";
// store colour names
var YELLOW = "yellow";
var PINK = "pink";

// other obs warning messages
var BGL_WARNING_MESSAGE = "If patient requires regular observations, refer to Diabetes Obs Chart. \n\nFor most patients the target BGL \nrange is 5-10mmol/L, \npregnancy is an exception. \nRefer to pages 3 and 4 for \nMO order, Insulin Chart and \nlocal clinical policy for escalation \nprocedure however titled.";						  
var BOWELS_WARNING_MESSAGE = "If patient requires regular observations, refer to relevant charts.";
var MODS_WARNING_MESSAGE = "There is an open \nAltered Calling Criteria (ACC) – \nrefer to pages 3 for MO order \nand 4, to local clinical policy for \nescalation procedure however titled.";							
var ZONE_WARNING_MESSAGE = "Patient has any Yellow or \nRed Zone observations or \nan open Altered Calling Criteria (ACC) \n– refer to pages 3, 4 and \nto local clinical policy for \nescalation procedure however titled.";
var POPUP_CHARTS_FONTFAMILY = "Lucida Sans Unicode";

// side to show warning popup on
var alignRight = false;
var alignLeft = false;
// flag to check if activity has been sealed previously
var wasSealed = false;
// flag to check active intervention when signed
var interventionDone = false;

var ceaseCallbackFunction = function(appStatus) {
	
    // If status is equal to "Ceased"
    if(appStatus == Vitro.Elements.StringConstants.Ceased) {
        // .Extra api will be used for isUnsealed flag
        myApp.Activity.Extra(false);

		// make sure to hide QE page
		pgQE.Hide(true);
    } 
};
// set action button defaults
Vitro.Elements.SetActionButtonVisibility(myApp);
// Create Cease Action Button and implementation
Vitro.Elements.CreateCeaseButton(myApp, null, null, ceaseCallbackFunction);
Vitro.Elements.SetUnsealAction(myApp, appActivityId, function(action, status) {
   // if activity is open and was previously sealed
   if (action === "Open" && status === "Sealed") {
	   wasSealed = true;
   }
   myApp.Clean();
});

// store events for dynamic controls
var popupEvents = {};

// store popup controls
var progNotesPopupObj = null;
var warningPopupObj = null;
var otherObsPopupObj = null;

// create local instance functions from API
var CreateDynamicPanel = Vitro.Elements.CreateDynamicPanel;
var CreateDynamicButton = Vitro.Elements.CreateDynamicButton;
var CreateDynamicImg = Vitro.Elements.CreateDynamicImg;
// change the background coloutr of a control or a list of controls
var ChangeBG = Vitro.Elements.ChangeBG;
// get index of Control in Repeater
var GetRepeaterIndex = Vitro.Elements.GetRepeaterIndex;
// registers a list of controls in a repeater
var RegisterRepeaterControls = Vitro.Elements.RegisterRepeaterControls;
// get users name in different formats
var GetUserName = Vitro.Elements.GetUserName;

// page and column index associated to popup
var pgObsPrevious = pgObs;
var obsIndexPrevious = null;
// page and column index associated to popup
var pgObsCurrent = pgObs;
var obsIndexCurrent = null;
// page and column index associated with next empty obs
var pgObsNext = pgObs;
var obsIndexNext = 0;

// most recent versions of pages
var pgObs2Next = pgObs2;
var pgObs2Previous = pgObs2;
var pgIntervNext = pgInterv;
var pgIntervPrevious = pgInterv;

// index of current row/column
var bglIndex = null;
var bowelIndex = null;
var weightIndex = null;
var additionalObsIndex = null;
var interventionIndex = null;
var modsIndex = null;
var freqIndex = null;

// if user pressed sign and close
var closeAct = false;
var changeToProgNotes = false;
var withInterventionErrors = false;

var isDoctor = Vitro.Elements.GetUserGroup().IsDoctor;
var isSuperUser = Vitro.Elements.GetUserGroup().IsSuperUser;

// custom for this app - super user groups (for action button visibility and strike button visibility)
var page4ModsUserGroups = [Vitro.Elements.UserGroups.Super_User, Vitro.Elements.UserGroups.Doctors];

PartialPageLoading();

// store what colour warning to show
var warningColours = {
   pink: false,
   yellow: false
};

// register controls on escalation page
pgEsc.RegisterControls("imgYellow", "imgPink", "imgPurple", "txtRecentPageIds");

var page1QEAll = pgQE.Controls("dpDate", "dpTime", "txtResp", "txtSaturation", "txtFlowRate", "ddDevice", "txtPulse",
"ddRythm", "chkIrregular", "txtBPSittingSystolic", "txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic",
"txtTemp", "ddlConciousness", "txtPainScoreRest", "txtPainScoreMovement", "txtPainScoreBoth", "chkIntervention", "chkStrike");

var page1QETextboxes = pgQE.Controls("txtResp", "txtSaturation", "txtFlowRate", "txtPulse", "txtBPSittingSystolic",
"txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic", "txtTemp", "txtPainScoreRest", "txtPainScoreMovement", "txtPainScoreBoth");

// used for setting value in chart based off of range
// stores if point lands in warning colour and if textbox needed for display
var chartPoints = {
   "respiratory": {
	   "0": {index: 1, text: LESSER, colour: PINK},
	   "5": {index: 2, colour: YELLOW},
	   "10": {index: 3},
	   "15": {index: 4},
	   "20": {index: 5},
	   "25": {index: 6, colour: YELLOW},
	   "30": {index: 7, colour: PINK},
	   "35": {index: 8, text: GREATER, colour: PINK}
   },
   "saturation": {
	   "0": {index: 1, text: LESSER, colour: PINK},
	   "85": {index: 2, colour: PINK},
	   "90": {index: 3, colour: YELLOW},
	   "95": {index: 4},
	   "100": {index: 5}
	   
   },
   "flow": {
	   "0": {index: 1},
	   "5": {index: 2, colour: YELLOW},
	   "7": {index: 3, colour: PINK}
   },
   "pulse": {
	   "0": {index: 1, text: LESSER, colour: PINK},
	   "40": {index: 2, colour: YELLOW},
	   "50": {index: 3},
	   "60": {index: 4},
	   "70": {index: 5},
	   "80": {index: 6},
	   "90": {index: 7},
	   "100": {index: 8},
	   "110": {index: 9},
	   "120": {index: 10, colour: YELLOW},
	   "130": {index: 11, colour: YELLOW},
	   "140": {index: 12, colour: PINK},
	   "150": {index: 13, colour: PINK},
	   "160": {index: 14, text: GREATER, colour: PINK}
   },
   "sysBloodpressure": {
	   "0": {index: 30, text: LESSER, colour: PINK},
	   "50": {colour: PINK},
	   "90": {colour: YELLOW},
	   "100": {},
	   "170": {},
	   "180": {colour: YELLOW},
	   "200": {colour: PINK},
	   "219": {index: 230, text: GREATER, colour: PINK},
	   "230": {index: 230, text: GREATER, colour: PINK}
   },
   "bloodpressure": {
	   "0": {index: 40, text: LESSER, colour: PINK},
	   "56": {colour: PINK},
	   "90": {colour: YELLOW},
	   "100": {},
	   "170": {},
	   "180": {colour: YELLOW},
	   "200": {colour: PINK}, 
	   "219": {index: 230, text: GREATER, colour: PINK},
	   "230": {index: 230, text: GREATER, colour: PINK}
   },
   "temperature": {
	   "0": {index: 1, text: LESSER, colour: YELLOW},
	   "34.0": {index: 2, colour: YELLOW},
	   "34.5": {index: 3, colour: YELLOW},
	   "35.0": {index: 4, colour: YELLOW},
	   "35.5": {index: 5},
	   "36.0": {index: 6},
	   "36.5": {index: 7},
	   "37.0": {index: 8},
	   "37.5": {index: 9},
	   "38.0": {index: 10},
	   "38.5": {index: 11, colour: YELLOW},
	   "39.0": {index: 12, colour: YELLOW},
	   "39.5": {index: 13, colour: YELLOW},
	   "40.0": {index: 14, colour: YELLOW},
	   "40.5": {index: 15, colour: YELLOW},
	   "41.0": {index: 16, text: GREATER, colour: YELLOW}	   
   },
   "conciousness": {
	   "0": {index: 1, colour: PINK},
	   "1": {index: 2, colour: PINK},
	   "2": {index: 3, colour: YELLOW},
	   "3": {index: 4, colour: YELLOW},
	   "4": {index: 5}
   },
   "pain": {
	   "0": {index: 1},
	   "1": {index: 2},
	   "4": {index: 3},
	   "7": {index: 4, colour: YELLOW}
   }
};

// -------------------------------------------- Default Events Start --------------------------------------------------//
function Pages_Added(pg) {
   // if quick entry page
   if (pg === pgQE) {
	   // View height size
	   var viewHeight = myApp.Properties.ViewHeight();
	   // set zoom level
	   pg.ZoomTo((viewHeight / QE_HEIGHT) * 0.95);
	   // register controls
	   pg.RegisterControls("panQE", "dpDate", "dpTime", "txtResp", "txtSaturation", "txtFlowRate", "ddDevice", "txtPulse",
	   "chkIrregular", "ddRythm", "txtBPSittingSystolic", "txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic",
	   "txtTemp", "ddlConciousness", "txtPainScoreRest", "txtPainScoreMovement", "txtPainScoreBoth", "chkIntervention", "chkStrike", "txtWarning", "btnSign", "btnSignClose", "btnCancel");
   }
   // if an observation page
   else if (pg === pgObs || myApp.PageManager.Master(pg) === pgObs) {
	   // register controls
	   pg.RegisterControls("chkACC", "charResp", "charSaturation", "charPulse", "charBPSitting",
		   "charBPStanding", "charConciousness", "psResp", "psSaturation", "psPulse",
		   "psIrregular", "bsBPSitting", "bsBPStanding", "psConciousness");
	   RegisterRepeaterControls(pg, ["repObs", "dpDate", "dpTime", "txtRespMore", "txtRespLess", "txtSaturationLess",
		   "txtFlowRateMore", "txtO2Lpm", "txtDevice", "txtRythm","txtPulseMore", "txtPulseLess", "txtBPStandingMore", "txtBPSittingMore",
		   "txtBPStandingLess", "txtBPSittingLess", "txtIntervention", "txtValues", "lblStrike",
		   "txtStrikeSign", "txtSign", "pnlBpMax"
	   ], NUM_OBS_REPS);
   }
   // if observation page 2
   else if (pg === pgObs2 || myApp.PageManager.Master(pg) === pgObs2) {
	   pg.RegisterControls("panAll", "chkACC", "charTemp", "psTemp", "charPain", "psPain");
	   RegisterRepeaterControls(pg, ["repObs", "dpDate", "dpTime", "txtTempMore", "txtTempLess", "txtSign", "txtValues", "lblStrike",
		   "txtStrikeSign", "repBloodGlucose", "txtPainSevere", "txtPainModerate", "txtPainMild", "txtPainNil",
		   "dpBloodGlucoseDate", "dpBloodGlucoseTime", "txtBGL", "dpBowelsDate", "txtBowels"
	   ], NUM_OBS_REPS);
	   	// Additional Observations
		RegisterRepeaterControls(pg, ["repWeight", "dpWeightDate", "txtDailyWeight",
			"repAdditObs", "dpUrinalysisDate", "dpUrinalysisTime", "txtGravity", "txtPh", "txtLeukocytes", "txtBlood", 
			"txtNitrite", "txtKetones", "txtBilirubin", "txtUrobilinogen", "txtProtein", "txtGlucose"
		], NUM_ADDIT_OBS_REPS);
   }
   // if intervention page
   else if (pg === pgInterv || myApp.PageManager.Master(pg) === pgInterv) {
	   // only register controls once (function is called outside of event when app is opened for partially loaded pages)
	   if (pg.Added !== true) {
		   pg.Added = true;
		   pg.RegisterControls("panAll", "chkACC", "cblOtherCharts", "chkAlcoholWithdrawal", "chkPain", "chkAnticoagulant", "chkNeurological",
		   "chkDiabetic", "chkFluidBalance", "chkNeurovascular", "chkOther", "txtOther");
		   // Frequency
		   RegisterRepeaterControls(pg, ["rptFrequency", "dpFrequencyDate", "dpFrequencyTime", "txtFrequencyRequired", "txtDoctorsName", 
		   		"authSignature", "authAttendingMOSignature", "txtStrike1", "txtStrikeInitials"
			], NUM_FREQUENCY_REPS);
		   // Clinical Review Requests 
		   RegisterRepeaterControls(pg, ["repClinicalReview", "dpACCDate", "dpACCTime", "dpNewReviewDateTime", "txtAcuteChronic", "txtYellowZone1", "txtRedZone1",
		   "txtYellowZone2", "txtRedZone2", "txtYellowZone3", "txtRedZone3", "txtYellowZone4", "txtRedZone4", "txtYellowZone5", "txtRedZone5", "txtMedicalName",
			"authNurse1", "authNurse2", "txtStrike2", "txtStrikeInitials2"], NUM_MOD_REPS);

			// Intervention  
			RegisterRepeaterControls(pg, ["repInterventions", "dpInterventionDate", "dpInterventionTime", "txtNotes", "authIntervention", "txtStrike", "txtStrikeInitials3"], NUM_INT_REPS);
			
	   }
   }
}

// get modification controls
function GetModControls(pg, index) {
   return pg.Controls("dpNewReviewDateTime[" + index + "]", "txtAcuteChronic[" + index + "]", "txtYellowZone1[" + index + "]",
	   "txtYellowZone2[" + index + "]", "txtYellowZone3[" + index + "]", "txtYellowZone4[" + index + "]", "txtYellowZone5[" + index + "]",
	   "txtRedZone1[" + index + "]", "txtRedZone2[" + index + "]", "txtRedZone3[" + index + "]", "txtRedZone4[" + index + "]", "txtRedZone5[" + index + "]", 
	   "txtMedicalName[" + index + "]");
}

// function to get Page 3 Section 4 controls
function GetOtherObsControls(pg, index) {
   return pg.Controls("txtGravity[" + index + "]", "txtPh[" + index + "]", "txtLeukocytes[" + index + "]",
   "txtBlood[" + index + "]", "txtNitrite[" + index + "]", "txtKetones[" + index + "]", "txtBilirubin[" + index + "]",
   "txtUrobilinogen[" + index + "]", "txtProtein[" + index + "]", "txtGlucose[" + index + "]");
}

// displayed event function for all pages
function Pages_Displayed(pg) {

if (myApp.Activity.Properties.Status() !== Vitro.STATUS.Sealed) {
	   // if an observation page
	   if (pg === pgObs || myApp.PageManager.Master(pg) === pgObs) {
		   // if page has not been displayed already
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;
			   SetObsEvents(pg);
		   }
	   }
	   // if modification page
	   else if (pg === pgObs2 || myApp.PageManager.Master(pg) === pgObs2) {
		   // only run logic the first time the page is displayed
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;
				// Set BGL row and event 
			   if (pg === pgObs2Next && bglIndex === null) {
					for (var a = 0; a < NUM_OBS_REPS; a++) {
						if (pg.dpBloodGlucoseDate[a].Value() === "") {
							bglIndex = a;
							break;
						}
					}
				}
				
				if (bglIndex !== null) {
					pg.txtBGL[bglIndex].Events.Change(txtBGL_Change);	
					pg.dpBloodGlucoseDate[bglIndex].Events.Change(dpDate_Change);	
					pg.dpBloodGlucoseTime[bglIndex].Events.Change(dpDate_Change);	
					pg.txtBGL[bglIndex].Writeable(false);
					ChangeBG(pg.Controls("dpBloodGlucoseDate[" + bglIndex + "]", "dpBloodGlucoseTime[" + bglIndex + "]", "txtBGL[" + bglIndex + "]"), COLOURS.TRANS_BLUE, false);
				}
				
				// Set bowel row and click event
				if (pg === pgObs2Next && bowelIndex === null) {
					for (var b = 0; b < NUM_OBS_REPS; b++) {
						if (pg.dpBowelsDate[b].Value() === "") {
							bowelIndex = b;
							break;
						}
					}
				}
				
				if (bowelIndex !== null) {
					pg.txtBowels[bowelIndex].Events.Click(BowelsClick);
					pg.dpBowelsDate[bowelIndex].Events.Change(dpDate_Change);		
					pg.txtBowels[bowelIndex].Enable();
					ChangeBG(pg.Controls("dpBowelsDate[" + bowelIndex + "]", "txtBowels[" + bowelIndex + "]"), COLOURS.TRANS_BLUE, false);
				}
				
				// Set weight row and event
				if (pg === pgObs2Next && weightIndex === null) {
					for (var j = 0; j < NUM_OBS_REPS; j++) {
						if (pg.dpWeightDate[j].Value() === "") {
							weightIndex= j;
							break;
						}
					}
				}

				if (weightIndex !== null) {
					pg.txtDailyWeight[weightIndex].Events.Change(txtDailyWeight_Change);
					pg.dpWeightDate[weightIndex].Events.Change(dpDate_Change);
					pg.txtDailyWeight[weightIndex].Writeable(false);
					ChangeBG(pg.Controls("dpWeightDate[" + weightIndex + "]", "txtDailyWeight[" + weightIndex + "]"), COLOURS.TRANS_BLUE, false);						
				}
				
				// if most recent page and additional obs column not set, highlight next empty
			   if (pg === pgObs2Next && additionalObsIndex === null) {
				   for (var k = 0; k < NUM_ADDIT_OBS_REPS; k++) {
					   if (pg.dpUrinalysisDate[k].Value() === "") {
						   additionalObsIndex = k;
						   break;
					   }
				   }

				   // if free row on page, set as editable
				   if (additionalObsIndex !== null) {	
						
						pg.repAdditObs[additionalObsIndex].Properties.Children().Each.Events.Change(AdditObsChange);					
					   
					   pg.txtDailyWeight[additionalObsIndex].Writeable(false);					   				   
					   pg.txtGravity[additionalObsIndex].Writeable(false);
					   pg.txtPh[additionalObsIndex].Writeable(false);
					   pg.txtLeukocytes[additionalObsIndex].Writeable(false);
					   pg.txtBlood[additionalObsIndex].Writeable(false);
					   pg.txtNitrite[additionalObsIndex].Writeable(false);
					   pg.txtKetones[additionalObsIndex].Writeable(false);
					   pg.txtBilirubin[additionalObsIndex].Writeable(false);
					   pg.txtUrobilinogen[additionalObsIndex].Writeable(false);
					   pg.txtProtein[additionalObsIndex].Writeable(false);
					   pg.txtGlucose[additionalObsIndex].Writeable(false);
					   ChangeBG(pg.repAdditObs[additionalObsIndex].Properties.Children(), COLOURS.TRANS_BLUE, false);

				   }
			   }
			  
		   }
	   }
	   // if intervention page
	   else if (pg === pgInterv || myApp.PageManager.Master(pg) === pgInterv) {
		
		   // only run logic the first time the page is displayed
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;
			   SetInterventionEvents(pg);	
			  			   
			   // if most recent page and mod colummn not set, highlight next empty
			   if (pg === pgIntervNext && freqIndex === null) {
				   SetupNextFreqCol();
			   }			   
			   
			   // if most recent page and mod colummn not set, highlight next empty
				if (pg === pgIntervNext && modsIndex === null) {
					SetupNextModCol();
				}		

			// create strike through buttons
			CreateModsSTKButtons(pg);
			// create strike through buttons			
			 CreateInterSTKButtons(pg);
		   }
	   }
	}

}

function myApp_Loaded() {
   
   if (myApp.Activity.Properties.Status() !== Vitro.STATUS.Sealed) {
   	   if (pgObs.Control("txtAge").Value() === "") { 
	   		var pgIds = myApp.Properties.PageIDs();
			for (var pages = 1; pages < pgIds.length; pages++) {
				myApp.Load(pgIds[pages], true);
			}
	   		Vitro.Elements.SetAddressograph(myApp); 
			Vitro.Elements.GetClientLogo(myApp, pgObs.Control("imgClientLogo")); 
			Vitro.Elements.GetClientLogo(myApp, pgObs2.Control("imgClientLogo")); 
			Vitro.Elements.GetClientLogo(myApp, pgInterv.Control("imgClientLogo")); 
			Vitro.Elements.GetClientLogo(myApp, pgEsc.Control("imgClientLogo")); 
	    }
	   OnAppOpen();
	   // show the Escalation page when not sealed
	   pgEsc.Show();
   }
   else {
	   // hide quick entry page
	   pgQE.Hide();
	   // hide escalation page, Set Chartbook Visibility to false, Set Print visibility to false
	   pgEsc.Hide().ChartVisibility(false).PrintVisibility(false);

	   myApp.Clean();

	   if (myApp.Activity.Properties.Status() == Vitro.STATUS.Sealed) {
			// making sure to activate obs page when sealed
			pgObsNext.Activate();
	   }
   }

}

// logic to run before submitting
function SubmitAction(action) {
	if (!withInterventionErrors) {	
		// page 2 - set all obs columns with values to not editable once submitted
			for (var k = 0; k < NUM_OBS_REPS; k++) {
				if (pgObsCurrent.txtValues[k].Value() !== "") {
					var obsCol = JSON.parse(pgObsCurrent.txtValues[k].Value());
					obsCol.canEdit = false;
					pgObsCurrent.txtValues[k].Value(JSON.stringify(obsCol));
					pgObs2Next.txtValues[k].Value(JSON.stringify(obsCol));
				}
			}

			// page 4 - set modificaton signature as readonly if signed    	
				for (var j = 0; j < NUM_FREQUENCY_REPS; j++) {
					if(pgIntervNext.authSignature[j].Value() !== "")
					{	
						pgIntervNext.txtDoctorsName[j].ReadOnly(true);
						pgIntervNext.authSignature[j].ReadOnly(true);
					}
					if(pgIntervNext.authAttendingMOSignature[j].Value() !== "")
					{
						pgIntervNext.authAttendingMOSignature[j].ReadOnly(true);
					}
					
				}
				for (var a = 0; a < NUM_MOD_REPS; a++) { 
					if (pgIntervNext.authNurse1[a].Value() !== "") {
						pgIntervNext.txtMedicalName[a].ReadOnly(true);
						pgIntervNext.authNurse1[a].ReadOnly(true);                
					}
					if (pgIntervNext.authNurse2[a].Value() !== "") {                
						pgIntervNext.authNurse2[a].ReadOnly(true);
					}
				}


			// If any entry has been completed in a row of section 3 of an “Interv. + Other Obs” page since the last submit, make readonly only persist
			for (var i = 0; i < NUM_INT_REPS; i++) {
				if (pgIntervNext.authIntervention[i].Value() !== "" ) {
							// the sign row becomes readonly										
							pgIntervNext.authIntervention[i].ReadOnly(true);	

				}
			}

			// If any entry has been completed in a row of section 3 of an “Interv. + Other Obs” page since the last submit, make readonly only persist
			for (var b = 0; b < NUM_MOD_REPS; b++) {
				if (pgIntervNext.dpACCDate[b].Value() !== "" || pgIntervNext.dpACCTime[b].Value() !== "") {
							
							// if page still default name, set with date
							if (pgIntervNext.Title() === PAGE_NAME_INT) {
								pgIntervNext.Title(PAGE_NAME_INT + " " + Vitro.Elements.GetDateString().ddMM);
							}
				}
			}
		
		// this is the last thing we do before submitting on action
		// store most recent version of each page
		var pageIDs = {
			// next available observation column
			nextObsPage: pgObsNext.Properties.ID(),
			nextColIndex: obsIndexNext,
			// last entered observation column
			prevObsPage: pgObsPrevious.Properties.ID(),
			prevColIndex: obsIndexPrevious,
			// next and last modification page
			curModsPage: pgObs2Next.Properties.ID(),
			prevModsPage: pgObs2Previous.Properties.ID(),
			// next and last intervention page
			curIntervPage: pgIntervNext.Properties.ID(),
			prevIntervPage: pgIntervPrevious.Properties.ID()
		};

		pgEsc.txtRecentPageIds.Value(JSON.stringify(pageIDs));

	}
}

function myApp_Actions(act) {
	
   // need to stop this executing if there are validation errors on activity
   if (interventionIndex !== null && (pgIntervNext.txtNotes[interventionIndex].Value() === "" ||
	   pgIntervNext.authIntervention[interventionIndex].Value() === "")) {
		   // raise validation errors
		   withInterventionErrors = true;
   }
   else {
		withInterventionErrors = false;
	   // on submit action
	   if (act === Vitro.ACTIONS.Submit) {
		   SubmitAction(act);
	   }

	   // on seal action
	   if (act === Vitro.ACTIONS.Seal) {
	       // we need to run the submit action rules on seal if user makes changes without submitting
            SubmitAction(act);
		   // hide quick entry page
		   pgQE.Hide(true);
		   // hide escalation page, Set Chartbook Visibility to false, Set Print visibility to false
		   pgEsc.Hide(true).ChartVisibility(false).PrintVisibility(false);
	   }
   }

}

function myApp_Actioned(act) {
   if (act === Vitro.ACTIONS.Submit && changeToProgNotes === true) {
	   myApp.Action(Vitro.ACTIONS.ChangeApp);
	   return false;
   }
}

function myApp_Unload() {
   Vitro.ReleaseApp(appActivityId);
   myApp = null;
}

// Only load the last page
function PartialPageLoading() {
	
   // Collection of pages
   var pgIds = myApp.Properties.PageIDs();
   // set all pages after the first to partially load
   for (var i = 1; i < pgIds.length; i++) {
	   myApp.Load(pgIds[i], false);
   }
   // open on first page
   myApp.StartPage(pgIds[0]);
}

// when app is opened, set required fields and control properties
function OnAppOpen() {
	
   // set quick entry events
   SetQEEvents();
   // if app has been used before, get most recent version of each page and current empty obs column
   if (pgEsc.txtRecentPageIds.Value() !== "") {
	   var storedIDs = JSON.parse(pgEsc.txtRecentPageIds.Value());
	   // next available observation column
	   pgObsNext = myApp.Page(storedIDs.nextObsPage);
	   obsIndexNext = parseInt(storedIDs.nextColIndex, 10);
	   // last entered observation column
	   pgObsPrevious = myApp.Page(storedIDs.prevObsPage);
	   obsIndexPrevious = parseInt(storedIDs.prevColIndex, 10);
	   // next and last modification page
	   pgObs2Next = myApp.Page(storedIDs.curModsPage);
	   pgObs2Previous = myApp.Page(storedIDs.prevModsPage);
	   // next and last intervention page
	   pgIntervNext = myApp.Page(storedIDs.curIntervPage);
	   pgIntervPrevious = myApp.Page(storedIDs.prevIntervPage);
   }

   // register controls on non-loaded pages for getting and setting control values
   if(pgObs2Previous !== pgObs2Next) {
	   Pages_Added(pgObs2Previous);
   }
   Pages_Added(pgObs2Next);

   if(pgIntervPrevious !== pgIntervNext) {
	   Pages_Added(pgIntervPrevious);
   }
   Pages_Added(pgIntervNext);

   // create action buttons
   CreateObsButton();
   CreateProgNotesButton();
   pgQE.PrintVisibility(false);

   // load obs page for updating (charts cannot be updated on partially loaded pages at the moment)
   myApp.Load(pgObsNext, true);
   myApp.Load(pgObs2Next, true);
   
   var lastObsColumnValue = pgObsNext.Control("txtValues[" + (NUM_OBS_REPS - 1)  + "]").Value();
   // if a doctor or obs column page is full, start on obs page hide QE
   if (isDoctor || lastObsColumnValue != "") {
	   pgObsNext.Activate();
	   pgQE.Hide();

	   if (lastObsColumnValue != "") {
			myApp.Disable(BTN_OBS);
	   }
	   
   }
   // else launch entry popup
   else {
	   LaunchNewObsQuickEntry();
   }
}

// create action button "Add New Obs"
function CreateObsButton() {
   myApp.Custom(BTN_OBS);
   myApp.Events.Action(LaunchNewObsQuickEntry, BTN_OBS);
}
// -------------------------------------------- Default Events End --------------------------------------------------//

// -------------------------------------------- Page 1 Obs Start --------------------------------------------------//
// Page 1 - function to set events on quick entry page
function SetQEEvents() {
   // set button events
   pgQE.btnSign.Events.Click(ObsSignClickEvent);
   pgQE.btnSignClose.Events.Click(ObsSignClickEvent);
   pgQE.btnCancel.Events.Click(ObsCancelClickEvent);

   // set change event for pulse rate
   pgQE.txtPulse.Events.Change(PulseChangeEvent);
   pgQE.ddRythm.Events.Change(RythmChangeEvent); 
   pgQE.txtPainScoreRest.Events.Change(PainChangeEvent);
   pgQE.txtPainScoreMovement.Events.Change(PainChangeEvent);
   pgQE.txtPainScoreBoth.Events.Change(PainChangeEvent);

   // set event triggering on character change instead of focus
   page1QETextboxes.Each.Attribute(Vitro.TEXTBOX.EventOnCharChange, "true");
   // set change event on obs quick entry page controls
   page1QEAll.Each.Events.Change(ObsChangeEvent);   
   
   // set character limit to 6
   page1QETextboxes.Each.Attribute(Vitro.TEXTBOX.CharLimit, "6");
}

// Page 1 - get values from quick entry page and store in an object
function GetQuickEntryVals() {
	
   var valsObj = {};
   valsObj.respiratory = pgQE.txtResp.Value();
   valsObj.saturation = pgQE.txtSaturation.Value();
   valsObj.flowRate = pgQE.txtFlowRate.Value();
   valsObj.device = pgQE.ddDevice.Value();
   valsObj.pulseRate = pgQE.txtPulse.Value();
   valsObj.irregularPulseRate = pgQE.chkIrregular.Value();
   valsObj.rythm = ConvertRythmToInitial(pgQE.ddRythm.Value(), true);
   valsObj.bpStandingSystolic = pgQE.txtBPStandingSystolic.Value();
   valsObj.bpStandingDiastolic = pgQE.txtBPStandingDiastolic.Value();
   valsObj.bpSittingSystolic = pgQE.txtBPSittingSystolic.Value();
   valsObj.bpSittingDiastolic = pgQE.txtBPSittingDiastolic.Value();
   valsObj.temperature = pgQE.txtTemp.Value();
   valsObj.conciousness = ConvertConsciousnessToNum(pgQE.ddlConciousness.Value(), true);
   // make sure if pain both scores has value no values to be stored to rest and movement scores
   if (pgQE.txtPainScoreBoth.Value()) {		
		valsObj.painBoth = pgQE.txtPainScoreBoth.Value();
   } else {
		valsObj.painRest = pgQE.txtPainScoreRest.Value();
		valsObj.painMovement = pgQE.txtPainScoreMovement.Value();
   }

   valsObj.intervention = pgQE.chkIntervention.Value();
   valsObj.strikeInitials = "";
   valsObj.username = Vitro.Users().Property(Vitro.USER.Name);
   return valsObj;
}

// Page 1 - function to clear all Quick Entry fields
function RemoveQuickEntryVals() {
   pgQE.dpDate.Value("");
   pgQE.dpTime.Value("");
   pgQE.txtResp.Value("");
   pgQE.txtSaturation.Value("");
   pgQE.txtFlowRate.Value("");
   pgQE.txtPulse.Value("");
   pgQE.ddDevice.Value("");
   pgQE.chkIrregular.Value(false);
   pgQE.ddRythm.Value("");
   pgQE.txtBPStandingSystolic.Value("");
   pgQE.txtBPStandingDiastolic.Value("");
   pgQE.txtBPSittingSystolic.Value("");
   pgQE.txtBPSittingDiastolic.Value("");
   pgQE.txtTemp.Value("");
   pgQE.ddlConciousness.Value("");
   pgQE.txtPainScoreRest.Value("");
   pgQE.txtPainScoreMovement.Value("");
   pgQE.txtPainScoreBoth.Value("");
   pgQE.chkIntervention.Value(false);
   pgQE.chkStrike.Value(false);
   // clear any warnings
   pgQE.txtWarning.Value("");
}

// Page 1 - function to make all Quick Entry fields writeable
function SetQuickEntryWriteable() {
   pgQE.dpDate.Writeable();
   pgQE.dpTime.Writeable();
   pgQE.txtResp.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtSaturation.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtFlowRate.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtPulse.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.ddDevice.Writeable();
   pgQE.chkIrregular.Writeable();
   pgQE.ddRythm.Writeable();
   pgQE.txtBPStandingSystolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPStandingDiastolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPSittingSystolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPSittingDiastolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtTemp.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.ddlConciousness.Writeable();
   pgQE.txtPainScoreRest.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.chkIntervention.Writeable();
   pgQE.chkStrike.Writeable();
}

// Page 1 - function to sort obs values for a page on chronological order
function SortObsChartOldestToNewest(pg) {
   var obsPageVals = [];

   // add each obs column values to array
   for (var i = 0; i < NUM_OBS_REPS; i++) {
	   if (pg.txtValues[i].Value() !== "") {
		   obsPageVals.push(JSON.parse(pg.txtValues[i].Value()));
		   // this is to keep track of the original date and time columns as they are not part of JSON object
		   obsPageVals[i].date = pgObsCurrent.dpDate[i].Value();
		   obsPageVals[i].time = pgObsCurrent.dpTime[i].Value();
	   }
   }

   var sortedObsPageVals = obsPageVals.slice();

   // sort the the array by date and time in Chronological order
   sortedObsPageVals.sort(function(a, b) {
	   // Turn your strings into dates, and then subtract them
	   // to get a value that is either negative, positive, or zero
	   return new Date(a.date).setHours(0, 0, 0, 0) - new Date(b.date).setHours(0, 0, 0, 0) || new Date(a.time) - new Date(b.time);
   });

   // populate each obs column with values from sorted array
   for (var j = 0; j < sortedObsPageVals.length; j++) {
	   // only update if column values are different
	   if (JSON.stringify(sortedObsPageVals[j]) !== JSON.stringify(obsPageVals[j])) {
		   // if the entry has been struck, set strike on column
		   if (sortedObsPageVals[j].strikeInitials !== "") {
			   pg.lblStrike[j].Show();
			   pg.txtStrikeSign[j].Value(sortedObsPageVals[j].strikeInitials);
		   }
		   // else ensure strike has been cleared from column
		   else {
			   pg.lblStrike[j].Hide();
			   pg.txtStrikeSign[j].Value("");
		   }
		   // add values to obs chart column
		   AddObsValues(j, sortedObsPageVals[j], sortedObsPageVals[j].date, sortedObsPageVals[j].time);
		   pg.txtValues[j].Value(JSON.stringify(sortedObsPageVals[j]));
	   }
   }
}

// Page 1 - Add Quick Entry – Pulse Rate - Change
function PulseChangeEvent(pg, ctrl, oldValue, newValue) {
   // if pulse has a value, enable irregular checkbox
   if (ctrl.Value() !== "") {
	   pg.chkIrregular.Enable();
	   pg.ddRythm.Enable();
   }
   // if pulse is empty, disable and clear irregular
   else {
	   pg.chkIrregular.Value("").Disable();
	   pg.ddRythm.Value("").Disable();
   }
}

// Page 1 - Add Quick Entry – Pulse Rate - Change
function RythmChangeEvent(pg, ctrl, oldValue, newValue) {
	
	// if irregular 
	if (newValue == "Irregular") {
		pg.chkIrregular.Value(true);		
	}
	// if regular uncheck 
	else {
		pg.chkIrregular.Value(false);
		
	}
 }

 // Page 1 - Add Quick Entry – Pain Score textboxes - Change
function PainChangeEvent(pg, ctrl, oldValue, newValue) {
	
	// if pain Rest and movement has a value, disable pain score both
	if (ctrl === pg.txtPainScoreRest || ctrl === pg.txtPainScoreMovement) {
		pg.txtPainScoreBoth.Value("");		
		if ((pg.txtPainScoreRest.Value() && pg.txtPainScoreMovement.Value()) && (parseInt(pg.txtPainScoreRest.Value()) === parseInt(pg.txtPainScoreMovement.Value()))) {
			pg.txtPainScoreRest.Value("");
			pg.txtPainScoreMovement.Value("");
			pg.txtPainScoreBoth.Value(newValue);
		}
	}
	// If pain Both has value clear Rest and movement
	if (ctrl === pg.txtPainScoreBoth) {
		pg.txtPainScoreRest.Value("");
		pg.txtPainScoreMovement.Value("");
	}

 }

 // Check rest and movement scores if both values are in same range of Nil, Mild, Moderate and Severe Pains Scores
function isPainScoreInSameRange(restScore, movementScore) {
    var isNil = (value) => value === PAIN_NIL;
    var isMild = (value) => value >= PAIN_MILD && value < PAIN_MODERATE;
    var isModerate = (value) => value >= PAIN_MODERATE && value < PAIN_SEVERE;
    var isSevere = (value) => value >= PAIN_SEVERE && value <= 10;

	if ((isNil(restScore) && isNil(movementScore)) || (isMild(restScore) && isMild(movementScore)) || 
		(isModerate(restScore) && isModerate(movementScore)) || (isSevere(restScore) && isSevere(movementScore))) {
			return true;
	} 
	else {
			return false;
	}
    
}

// Page 1 - Add Quick Entry - Input Controls - Change
// when any input control in the quick entry page is changed, validate values and check to enable signature
function ObsChangeEvent(pg, ctrl, oldValue, newValue) {
	pgQE.txtWarning.Value("");
   // if control has a value and is a textbox
   if (newValue !== "" && ctrl.Properties.Type() === Vitro.TYPE.Textbox) {
	   // force it to be a positive number
	   if (isNaN(newValue) || newValue < 0) {
		   ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_RED, false);
	   }
	   // O2 saturation must be less than or equal to 100
	   else if (ctrl === pg.txtSaturation && newValue > 100) {
		   ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_RED, false);
		   pgQE.txtWarning.Value("Maximum value is 100");
	   }	   
	   // O2 flow rate must be less than or equal to 15
	   else if (ctrl === pg.txtFlowRate && newValue > 15) {
			ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_RED, false);
			pgQE.txtWarning.Value("Maximum value is 15");
		}
	   // pain must be less than or equal to 10
	   else if ((ctrl === pg.txtPainScoreRest || ctrl === pg.txtPainScoreMovement || ctrl === pg.txtPainScoreBoth) && newValue > 10) {
		   ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_RED, false);
		   pgQE.txtWarning.Value("Maximum value is 10");
	   }
	   // if not reverting value, remove highlight
	   else {
		   ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
	   }
   }
   else if (newValue === "" && ctrl.Properties.Type() === Vitro.TYPE.Textbox) {
        ctrl.Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   }
   // change bg colour of datepickers
   else if (newValue !== "" && ctrl.Properties.Type() === Vitro.TYPE.DateTimePicker) {
		Vitro.Elements.DateTimeValidate(ctrl, newValue, COLOURS.TRANSPARENT);
	   ChangeBG(ctrl, COLOURS.WHITE);
   }   

   // check to enable sign button
   EnableQESign();
   if (ctrl.Properties.ID() === "chkStrike" && !newValue) {
		pg.btnSign.Disable();
		pg.btnSignClose.Disable();
   }
}

// Page 1 - enable quick entry signature if at least one control has a value
function EnableQESign() {
   pgQE.btnSign.Disable();
   pgQE.btnSignClose.Disable();
   var allEmpty = true;
   var isAllValid = true;

   // check if any control has a value and is valid
   page1QEAll.Iterate(function(ctrl)
   {
	   if (ctrl.Properties.Type() === Vitro.TYPE.Textbox || ctrl.Properties.Type() === Vitro.TYPE.DropDown) {
		   if (ctrl.Value() !== "" && ctrl.Value() !== null && ctrl.Value() !== false) {
			   allEmpty = false;
		   }
	   }
	   // check if control has a valid value based on text colour red or black
	   if (ctrl.Properties.Type() === Vitro.TYPE.Textbox) {
		   if (ctrl.Attribute(Vitro.TEXTBOX.TextColour) === CUSTOMCOLOURS.SOLID_RED) {
			   isAllValid = false;
		   }
	   }
   });

   // if they are not all empty, enable sign
   if (allEmpty === false && isAllValid === true) {
	   pgQE.btnSign.Enable();
	    // intervention not clicked and no current mod is active and mod has not been struck, allow sign and close
         var modIndex = GetCurrentMod();

	   if (pgQE.txtResp.Properties.IsReadOnly() === false && pgQE.chkIntervention.Value() === false &&
	   	(modIndex === null || pgIntervPrevious.txtStrikeInitials2[modIndex].Value() !== "")) {
		   // check if activity has previously been sealed
		   if (wasSealed === false) {
			   pgQE.btnSignClose.Enable();
		   }
	   }
   }
}

// Page 1 - Add Quick Entry – Sign + Sign & Close Buttons - Click 
function ObsSignClickEvent(pg, ctrl, xl, yl) {
	
   var showWarning = ShowObsQERequiredWarnings();
   // close popup if no warnings
   if (showWarning === "") {
	   // check if sign and close was clicked (check needed before popup is destroyed)
	   if (ctrl === pg.btnSignClose) {
		   closeAct = true;
	   }
	   // add obs values to page and destroy popup
	   UpdateObsPage();
	   // only set Escalations and Modifications if the entry is not struck through
	   if (pgQE.chkStrike.Value() === false) {
		   var secondPopup = CreateEscalationModificationPopup();
		   // if no modificatons or escalations, check for warnings
		   if (secondPopup === false) {
			   CloseFinalPopup();
		   }
	   }
	   else {
		   pgObsNext.Activate();
	   }
	   // hide QE page
	   pgQE.Hide();
	   CloseQuickEntry();
	   // clear values from QE page
	   RemoveQuickEntryVals();
	   // set all fields writeable on QE page
	   SetQuickEntryWriteable();

	   // disable add obs button if column is full
	   var lastObsColumnValue = pgObsNext.Control("txtValues[" + (NUM_OBS_REPS - 1)  + "]").Value();
	   if (lastObsColumnValue != "") {
			myApp.Disable(BTN_OBS);
	   }

   }
}

// Page 1 - Add  Quick Entry - Cancel Button - Click
function ObsCancelClickEvent(pg, ctrl, xl, yl) {
   // reset warning colours
   ChangeBG(pgQE.txtBPSittingSystolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPSittingDiastolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPStandingSystolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPStandingDiastolic, COLOURS.WHITE);
   pgObsNext.Activate();
   // hide QE page
   pgQE.Hide();
   CloseQuickEntry();
   // clear values from QE page
   RemoveQuickEntryVals();
   // set all fields writeable on QE page
   SetQuickEntryWriteable();

}

// Page 1 - function to close the quick entry page, enable actions and show page navigation
function CloseQuickEntry() {
	EnableDisableActionButtons(true);
	myApp.ScrollTo(0,0);
}

// Enable - Disable Action buttons and page navigations
function EnableDisableActionButtons(state){
	if (state) {
		// enable action buttons		
		myApp.Enable(BTN_PROG_NOTES);
		myApp.Enable(BTN_CEASE);
		myApp.Enable(Vitro.ACTIONS.Submit);
		myApp.Enable(Vitro.ACTIONS.Seal);
		myApp.Enable(Vitro.ACTIONS.Export);
		myApp.Enable(Vitro.ACTIONS.History);
		myApp.Enable(Vitro.ACTIONS.Close);
		// show page navigation
		myApp.PageNavigationVisibility(state);

		// check if the columns is full, dont enable add obbs
		var lastObsColumnValue = pgObsNext.Control("txtValues[" + (NUM_OBS_REPS - 1)  + "]").Value();
		if (lastObsColumnValue == "") {
			myApp.Enable(BTN_OBS);	
		}
	}
	else {
		// disable action buttons
		myApp.Disable(BTN_OBS);
		myApp.Disable(BTN_PROG_NOTES);
		myApp.Disable(BTN_CEASE);
		myApp.Disable(Vitro.ACTIONS.Submit);
		myApp.Disable(Vitro.ACTIONS.Seal);
		myApp.Disable(Vitro.ACTIONS.Export);
		myApp.Disable(Vitro.ACTIONS.History);
		myApp.Disable(Vitro.ACTIONS.Close);
		// hide page navigation
		myApp.PageNavigationVisibility(state);
	}

}

// Page 1 - when sign button is clicked, show warnings for invalid entries
function ShowObsQERequiredWarnings() {
   // reset warning colours
   ChangeBG(pgQE.txtBPSittingSystolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPSittingDiastolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPStandingSystolic, COLOURS.WHITE);
   ChangeBG(pgQE.txtBPStandingDiastolic, COLOURS.WHITE);
   var showWarning = "";
   // if one blood pressure field has a value but not both, show warning
   if ((pgQE.txtBPSittingSystolic.Value() !== "" && pgQE.txtBPSittingDiastolic.Value() === "") ||
	   (pgQE.txtBPSittingSystolic.Value() === "" && pgQE.txtBPSittingDiastolic.Value() !== "")) {
	   showWarning = "Please enter both values for Blood Pressure.\n";
	   // set control colour of empty field to red for warning
	   if (pgQE.txtBPSittingSystolic.Value() === "") {
		   ChangeBG(pgQE.txtBPSittingSystolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
	   if (pgQE.txtBPSittingDiastolic.Value() === "") {
		   ChangeBG(pgQE.txtBPSittingDiastolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
   }
   if ((pgQE.txtBPStandingSystolic.Value() !== "" && pgQE.txtBPStandingDiastolic.Value() === "") ||
	   (pgQE.txtBPStandingSystolic.Value() === "" && pgQE.txtBPStandingDiastolic.Value() !== "")) {
	   showWarning = "Please enter both values for Blood Pressure.\n";
	   // set control colour of empty field to red for warning
	   if (pgQE.txtBPStandingSystolic.Value() === "") {
		   ChangeBG(pgQE.txtBPStandingSystolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
	   if (pgQE.txtBPStandingDiastolic.Value() === "") {
		   ChangeBG(pgQE.txtBPStandingDiastolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
   }
   // if both have values, check if diastolic value is less than or equal to systolic value
   if (pgQE.txtBPSittingSystolic.Value() !== "" && pgQE.txtBPSittingDiastolic.Value() !== "") {
	   if (parseInt(pgQE.txtBPSittingSystolic.Value(), 10) <= parseInt(pgQE.txtBPSittingDiastolic.Value(), 10)) {
		   showWarning += "Systolic Blood Pressure cannot be less than Diastolic.\n";
		   ChangeBG(pgQE.txtBPSittingDiastolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
   }
   if (pgQE.txtBPStandingSystolic.Value() !== "" && pgQE.txtBPStandingDiastolic.Value() !== "") {
	   if (parseInt(pgQE.txtBPStandingSystolic.Value(), 10) <= parseInt(pgQE.txtBPStandingDiastolic.Value(), 10)) {
		   showWarning += "Systolic Blood Pressure cannot be less than Diastolic.\n";
		   ChangeBG(pgQE.txtBPStandingDiastolic, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
   }
   // if either date or time is blank, show warning
   if (pgQE.dpDate.Value() === "" || pgQE.dpDate.Value() === null ||
	   pgQE.dpTime.Value() === "" || pgQE.dpTime.Value() === null) {
	   showWarning += "Please enter both Date and Time.";
	   // set control colour of empty field to red for warning
	   if (pgQE.dpDate.Value() === "" || pgQE.dpDate.Value() === null) {
		   ChangeBG(pgQE.dpDate, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
	   if (pgQE.dpTime.Value() === "" || pgQE.dpTime.Value() === null) {
		   ChangeBG(pgQE.dpTime, CUSTOMCOLOURS.SOLID_LIGHTRED);
	   }
   }
   // set label and return warnings
   pgQE.txtWarning.Value(showWarning);
   return showWarning;
}

// Page 1 - when popup has been signed, update page with new values
function UpdateObsPage() {
	
   // store values from QE page
   var valsObj;
   var curDate = Vitro.Elements.GetDateString();
   var canEdit = CheckIfObsColumnIsEditable(pgObsCurrent, obsIndexCurrent);
   // get date and time values from the Quick Entry Page
   var qeDateVal = Vitro.Elements.GetDateString(pgQE.dpDate.Value()).ddMMyyyy;
   var qeTimeVal = Vitro.Elements.GetDateString(pgQE.dpTime.Value()).HHmm;
   // get date and time values from the current Obs Column on the Obs Page
   var obsDateVal = Vitro.Elements.GetDateString(pgObsCurrent.dpDate[obsIndexCurrent].Value()).ddMMyyyy;
   var obsTimeVal = Vitro.Elements.GetDateString(pgObsCurrent.dpTime[obsIndexCurrent].Value()).HHmm;
   var escalationColourCount;
   // if editing a column
   if (pgObsCurrent.dpDate[obsIndexCurrent].Value() !== "" && (pgObsCurrent === pgObsPrevious || pgObsCurrent === pgObs2Previous) && canEdit === true) {
	   // store values from QE page
	   valsObj = GetQuickEntryVals();
	   // sign and store
	   pgObsCurrent.txtSign[obsIndexCurrent].Value(GetUserName().initials);
	   valsObj.sign = pgObsCurrent.txtSign[obsIndexCurrent].Value();
	   // set the column editable
	   valsObj.canEdit = true;
	   // set JSON stringified Obs values for column
	   pgObsCurrent.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
		// set copy JSON stringified Obs page2 values for column
	   pgObs2Next.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
	   // add values to obs chart column
	   escalationColourCount = AddObsValues(obsIndexCurrent, valsObj, pgQE.dpDate.Value(), pgQE.dpTime.Value());
	   // set escalation colours
	   SetEscalationColours(escalationColourCount);
	   
	   // if the dates and times on the QE and Obs page for the current column differ and obs values are not empty
	   if ((obsDateVal !== "" && obsTimeVal !== "") && (qeDateVal !== obsDateVal || qeTimeVal !== obsTimeVal)) {
		   // arrange all columns on the page in Date and time Chronological order
		   SortObsChartOldestToNewest(pgObsCurrent);
	   }
   }
   // if adding a new column, update position
   else if (obsIndexCurrent === obsIndexNext && !pgQE.chkStrike.Value()) {
	   	   
	   // if there is an empty row on current chart page
	   if (obsIndexNext !== null && obsIndexNext < (NUM_OBS_REPS - 1)) {
		   // rename page if still default name
		   if (pgObsNext.Title() === PAGE_NAME_OBS) {
			   pgObsNext.Title("OBS " + Vitro.Elements.GetDateString().ddMM + " Page 1");
		   }
		   if (pgObs2Next.Title() === PAGE_NAME_OBS2) {
			pgObs2Next.Title("OBS " + Vitro.Elements.GetDateString().ddMM + " Page 2");
		}
		   // increase index
		   obsIndexNext++;
	   }
	  
	   // allow editing of column and reset next empty index
	   pgObsPrevious = pgObsCurrent;
	   obsIndexPrevious = obsIndexCurrent;
	   // store values from QE page
	   valsObj = GetQuickEntryVals();
	   // sign and store
	   pgObsCurrent.txtSign[obsIndexCurrent].Value(GetUserName().initials);
	   valsObj.sign = pgObsCurrent.txtSign[obsIndexCurrent].Value();
	   // set the column editable
	   valsObj.canEdit = true;
	   // set JSON stringified Obs values for column
	   pgObsCurrent.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
	   // set copy JSON stringified page Obs2  values for column
	   pgObs2Next.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
	   // add values to obs chart column
	   escalationColourCount = AddObsValues(obsIndexCurrent, valsObj, pgQE.dpDate.Value(), pgQE.dpTime.Value(), true);
	   // set escalation colours
	   SetEscalationColours(escalationColourCount);
	   // enable intervention row if ticked on QE
	   // EnableInterventionRow(obsIndexCurrent, valsObj, pgQE.dpDate.Value(), pgQE.dpTime.Value());
	   // if the dates and times on the QE and Obs page for the current column differ and obs values are not empty
	   if ((obsDateVal !== "" && obsTimeVal !== "") && (qeDateVal !== obsDateVal || qeTimeVal !== obsTimeVal)) {
		   // arrange all columns on the page in Date and time Chronological order
		   SortObsChartOldestToNewest(pgObsCurrent);
	   }
   }
   // if viewing or striking, dont update chart values
   else if (pgQE.chkStrike.Value()) {
	   // store values from the current column of the current Obs page
	   valsObj = JSON.parse(pgObsCurrent.txtValues[obsIndexCurrent].Value());
	   pgObsCurrent.lblStrike[obsIndexCurrent].Show();
	   pgObsCurrent.txtStrikeSign[obsIndexCurrent].Value(GetUserName().initials + "\n" + curDate.ddMM);
	   pgObs2Next.lblStrike[obsIndexCurrent].Show();
	   pgObs2Next.txtStrikeSign[obsIndexCurrent].Value(GetUserName().initials + "\n" + curDate.ddMM);
	   // store strike initials
	   valsObj.strikeInitials = pgObsCurrent.txtStrikeSign[obsIndexCurrent].Value();
	   // set JSON stringified Obs values for column
	   pgObsCurrent.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
	   pgObs2Next.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
   }
}

// Page 1 - add values from popup to chart 
function AddObsValues(obsIndex, obsVals, colDate, colTime) {
   var colourCount = {
	   yellow: 0,
	   pink: 0
   };
   var pointInfo1;
   var pointInfo2;
   
   // set date and time from Obs column vals
   pgObsCurrent.dpDate[obsIndex].Value(colDate);
   pgObsCurrent.dpTime[obsIndex].Value(colTime);
   pgObs2Next.dpDate[obsIndex].Value(colDate);
   pgObs2Next.dpTime[obsIndex].Value(colTime);

   // store respiratory rate
   pointInfo1 = GetPointInfo(obsVals.respiratory, chartPoints.respiratory);
   UpdatePointSeries(pointInfo1, obsVals.respiratory, pgObsCurrent.psResp, pgObsCurrent.txtRespMore[obsIndex], pgObsCurrent.txtRespLess[obsIndex], obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   // update background colour if max or min values are used for the blood pressure
   if (pgObsCurrent.txtRespMore[obsIndex].Value() !== "") {
	   pgObsCurrent.txtRespMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
   }
   else {
	   pgObsCurrent.txtRespMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObsCurrent.txtRespLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtRespLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
   }
   else {
	   pgObsCurrent.txtRespLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   // store saturation
   pointInfo1 = GetPointInfo(obsVals.saturation, chartPoints.saturation);
   UpdatePointSeries(pointInfo1, obsVals.saturation, pgObsCurrent.psSaturation, null, pgObsCurrent.txtSaturationLess[obsIndex], obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   if (pgObsCurrent.txtSaturationLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtSaturationLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
   }
   else {
	   pgObsCurrent.txtSaturationLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   // store O2 flow rate
	pgObsCurrent.txtO2Lpm[obsIndex].Value(obsVals.flowRate);
   // store Rythm
	pgObsCurrent.txtRythm[obsIndex].Value(obsVals.rythm);

   // store pulse/ heart rate
   pointInfo1 = GetPointInfo(obsVals.pulseRate, chartPoints.pulse);
   UpdatePointSeries(pointInfo1, obsVals.pulseRate, pgObsCurrent.psPulse, pgObsCurrent.txtPulseMore[obsIndex], pgObsCurrent.txtPulseLess[obsIndex], obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   // update irregular if ticked
   var psMore = pgObsCurrent.txtPulseMore[obsIndex].Value();
   var psLess = pgObsCurrent.txtPulseLess[obsIndex].Value();
   if (obsVals.irregularPulseRate === true) {
	   UpdatePointSeries(pointInfo1, obsVals.pulseRate, pgObsCurrent.psIrregular, null, null, obsIndex);
	   if (psMore !== "") {
		   pgObsCurrent.txtPulseMore[obsIndex].Value("X" + psMore);
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   }
	   else {
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
	   if (psLess !== "") {
		   pgObsCurrent.txtPulseLess[obsIndex].Value("X" + psLess);
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   }
	   else {
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
   }
   else {
	   UpdatePointSeries(pointInfo1, "", pgObsCurrent.psIrregular, null, null, obsIndex);
	   if (psMore !== "") {
		   pgObsCurrent.txtPulseMore[obsIndex].Value("●" + psMore);
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   }
	   else {
		   pgObsCurrent.txtPulseMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
	   if (psLess !== "") {
		   pgObsCurrent.txtPulseLess[obsIndex].Value("●" + psLess);
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   }
	   else {
		   pgObsCurrent.txtPulseLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
   }
   // store device acronym
   if (obsVals.device === "Nasal Prongs") {
	   pgObsCurrent.txtDevice[obsIndex].Value("NP");
   }
   else if (obsVals.device === "Room Air") {
	   pgObsCurrent.txtDevice[obsIndex].Value("RA");
   }
   else if (obsVals.device === "Simple Facemask") {
	   pgObsCurrent.txtDevice[obsIndex].Value("FM");
   }
   else if (obsVals.device === "Non Re-breather") {
	   pgObsCurrent.txtDevice[obsIndex].Value("NRB");
   }
   else if (obsVals.device === "Venturi Mask") {
	   pgObsCurrent.txtDevice[obsIndex].Value("VM");
   }
   else {
	   pgObsCurrent.txtDevice[obsIndex].Value(obsVals.device);
   }
   // store standing blood pressure
   pointInfo1 = GetPointInfo(obsVals.bpStandingSystolic, chartPoints.sysBloodpressure);
   pointInfo2 = GetPointInfo(obsVals.bpStandingDiastolic, chartPoints.bloodpressure);
   UpdateBarSeries(pointInfo1, pointInfo2, obsVals.bpStandingSystolic, obsVals.bpStandingDiastolic, pgObsCurrent.bsBPStanding, pgObsCurrent.txtBPStandingMore[obsIndex], pgObsCurrent.txtBPStandingLess[obsIndex], obsIndex);
   // NOTE: Standing blood pressure will not have any colour warnings as per business rules
   // store sitting blood pressure
   pointInfo1 = GetPointInfo(obsVals.bpSittingSystolic, chartPoints.sysBloodpressure);
   pointInfo2 = GetPointInfo(obsVals.bpSittingDiastolic, chartPoints.bloodpressure);
   UpdateBarSeries(pointInfo1, pointInfo2, obsVals.bpSittingSystolic, obsVals.bpSittingDiastolic, pgObsCurrent.bsBPSitting, pgObsCurrent.txtBPSittingMore[obsIndex], pgObsCurrent.txtBPSittingLess[obsIndex], obsIndex);
   // if systolic has a colour warning
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   // update background colour if max or min values are used for the blood pressure
   if (pgObsCurrent.txtBPStandingMore[obsIndex].Value() !== "" || pgObsCurrent.txtBPSittingMore[obsIndex].Value() !== "") {
	   // if the value for Blood pressure sitting max is less than 199 then we set the background colour pink to indicate the escalation
	   if (parseInt(pgObsCurrent.txtBPSittingMore[obsIndex].Value(), 10) <= 199) {
		   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_YELLOW, true);
	   }
	   else {
		   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   }
   }
   else {
	   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObsCurrent.txtBPStandingLess[obsIndex].Value() !== "" || pgObsCurrent.txtBPSittingLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtBPStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
	   pgObsCurrent.txtBPSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PINK, true);
   }
   else {
	   pgObsCurrent.txtBPStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   pgObsCurrent.txtBPSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   
   // store temperature   
   pointInfo1 = GetPointInfo(obsVals.temperature, chartPoints.temperature);
   UpdatePointSeries(pointInfo1, obsVals.temperature, pgObs2Next.psTemp, pgObs2Next.txtTempMore[obsIndex], pgObs2Next.txtTempLess[obsIndex], obsIndex);

   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   if (pgObs2Next.txtTempMore[obsIndex].Value() !== "" || pgObsCurrent.txtBPStandingLess[obsIndex].Value() !== "" ||
   pgObsCurrent.txtBPSittingLess[obsIndex].Value() !== "") {
	pgObs2Next.txtTempMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTYELLOW, true);
   }
   else {
	pgObs2Next.txtTempMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObs2Next.txtTempLess[obsIndex].Value() !== "") {
	pgObs2Next.txtTempLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTYELLOW, true);
   }
   else {
	pgObs2Next.txtTempLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   // store conciousness   
   pointInfo1 = GetPointInfo(obsVals.conciousness, chartPoints.conciousness);
   UpdatePointSeries(pointInfo1, obsVals.conciousness, pgObsCurrent.psConciousness, null, null, obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   // store pain
   colourCount = WritePainScoreObsControl(pgObs2Next, colourCount, obsIndex, obsVals.painRest, obsVals.painMovement, obsVals.painBoth);

   // set sign value
   pgObsCurrent.txtSign[obsIndex].Value(obsVals.sign);
   pgObs2Next.txtSign[obsIndex].Value(obsVals.sign);

   // return colour count array to determine setting of escalation colours
   return colourCount;
}

// Page 1 - sets the escalation colours required for the current Obs entry
function SetEscalationColours(colourCount) {

   // if any pink, show pink
    if (colourCount.pink > 0) {
	   warningColours.pink = true;
   }
   // if any yellow, show yellow
   else if (colourCount.yellow > 0) {
	   warningColours.yellow = true;
   }
}

// Page 4 - enables/disables the next available intervention row on Page 4 Section 3
function EnableInterventionRow(state) {
	if (interventionIndex === null) {		
		// get next free intervention row
		for (var i = 0; i < NUM_INT_REPS; i++) {	
				if (pgIntervNext.authIntervention[i].Value() === "") {
					interventionIndex = i;					
					break;
				}
		}
	}
	   
		if (interventionIndex !== null) {

			if (state) {
				if (!pgIntervNext.authIntervention[interventionIndex].Value()){
					pgIntervNext.txtNotes[interventionIndex].Writeable().Required();
				}				
				Vitro.Elements.SetControlHighlight(pgIntervNext.txtNotes[interventionIndex]);
			}
			else {
				if (!pgIntervNext.authIntervention[interventionIndex].Value()){
					pgIntervNext.txtNotes[interventionIndex].Writeable().Required();
				}			
				
			}		
		}
	
}

// Page 1 - function to update Point Series on Page 2 Obs Chart
function UpdatePointSeries(pointInfo, value, seriesCtrl, txtGreater, txtLess, obsIndex) {
	// clear column
	if (txtGreater !== null) {
		txtGreater.Value("");
	}
	if (txtLess !== null) {
		txtLess.Value("");
	}
	seriesCtrl.Value([
		[obsIndex, null]
	]);
	if (value !== "" && pointInfo !== null) {
		// update chart
		var index = value;
		if (pointInfo.index !== undefined) {
			index = pointInfo.index;
		}
		// update textbox if needed
		if (pointInfo.text === GREATER && txtGreater !== null) {
			txtGreater.Value(value);
		}
		else if (pointInfo.text === LESSER && txtLess !== null) {
			txtLess.Value(value);
		}
		// update chart
		seriesCtrl.Value([
			[obsIndex, index]
		]);
	}
 }

// Page 1 - function to update Bar Series on Page 2 Obs Chart
function UpdateBarSeries(pointInfo1, pointInfo2, value1, value2, seriesCtrl, txtGreater, txtLess, obsIndex) {

   // clear column
   if (txtGreater !== null) {
	   txtGreater.Value("");
   }
   if (txtLess !== null) {
	   txtLess.Value("");
   }
   seriesCtrl.Value([
	   [obsIndex, null, null]
   ]);
   if (value1 !== "" && pointInfo1 !== null) {
	   // update chart
	   var index1 = value1;
	   var index2 = value2;
	   if (pointInfo1.index !== undefined && pointInfo1.index !== 40) {
		   index1 = pointInfo1.index;
	   }
	   if (pointInfo2.index !== undefined) {
		   index2 = pointInfo2.index;
	   }
	   // update textbox if needed
	   if (pointInfo1.text === GREATER && txtGreater !== null) {
		   txtGreater.Value(value1);
	   }
	   if (pointInfo2.text === LESSER && txtLess !== null) {
		   txtLess.Value(value2);
	   }
	   if (pointInfo1.text === LESSER && txtLess !== null) {
            txtLess.Value(value1);
       }
	   // update chart
	   seriesCtrl.Value([
		   [obsIndex, index1, index2]
	   ]);
   }
}

// Page 1 - get index of range on chart
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
		   // if value lands in current range
		   if (((i + 1) < rangeArray.length) && (value >= parseFloat(rangeArray[i]) && value < parseFloat(rangeArray[(i + 1)]))) {
			   pointInfo = infoObj[rangeArray[i]];
			   break;
		   }
		   // if value is in final range
		   else if ((i + 1) === rangeArray.length && value >= parseFloat(rangeArray[i])) {
			   pointInfo = infoObj[rangeArray[i]];
			   break;
		   }
	   }
	   return pointInfo;
   }
   return null;
}
// -------------------------------------------- Page 1 Obs End --------------------------------------------------//

// -------------------------------------------- Page 2 Obs Start --------------------------------------------------//
// Page 2 - events on observation page
function SetObsEvents(pg) {
   for (var i = 0; i < NUM_OBS_REPS; i++) {
	   // we set events on repeater and all textboxes to allow clicking anywhere on chart
	   pg.repObs[i].Events.Click(ObsColumnClicked);
	   pg.txtRespMore[i].Events.Click(ObsColumnClicked);
	   pg.txtRespLess[i].Events.Click(ObsColumnClicked);
	   pg.txtSaturationLess[i].Events.Click(ObsColumnClicked);
	   pg.txtFlowRateMore[i].Events.Click(ObsColumnClicked);
	   pg.txtO2Lpm[i].Events.Click(ObsColumnClicked);
	   pg.txtDevice[i].Events.Click(ObsColumnClicked);
	   pg.txtPulseMore[i].Events.Click(ObsColumnClicked);
	   pg.txtPulseLess[i].Events.Click(ObsColumnClicked);
	   pg.txtBPStandingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtBPSittingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtBPStandingLess[i].Events.Click(ObsColumnClicked);
	   pg.txtBPSittingLess[i].Events.Click(ObsColumnClicked);	
	   pg.txtIntervention[i].Events.Click(ObsColumnClicked);
	   pg.txtValues[i].Events.Click(ObsColumnClicked);
	   pg.txtSign[i].Events.Click(ObsColumnClicked);
	   pg.txtStrikeSign[i].Events.Click(ObsColumnClicked);
	   pgObs2.repObs[i].Events.Click(ObsColumnClicked); 
   }
}

// Page 2 - Observation Page - Section 2 – Column Clicked
function ObsColumnClicked(pg, ctrl, xl, yl) {

   var index = GetRepeaterIndex(ctrl);
   // if popup not open and no intervention waiting to be signed
   if (interventionIndex === null || interventionDone) {
	   // if warning popup open, close it
	   CloseWarningPopup();
	   obsIndexCurrent = index;
	   pgObsCurrent = pgObsNext;
	   // if column has values and strike not visible, check if it can be edited
	   if (pg.dpDate[index].Value() !== "" && pg.lblStrike[index].Properties.IsVisible() === false) {
		   var canEdit = CheckIfObsColumnIsEditable(pg, index);
		   // if editing selected column
		   if ((pg === pgObsPrevious || pg === pgObs2Previous) && canEdit === true) {
			   LaunchEditObsQuickEntry(true);
		   }
		   // if viewing/striking column, launch readonly popup
		   else {
			   LaunchEditObsQuickEntry(false);
		   }
	   }
	   // if blank column, launch add new popup
	   else if (pg.lblStrike[index].Properties.IsVisible() === false) {
		   LaunchNewObsQuickEntry();
	   }
   }
   // show validation error if required field needs to be completed
   else {
	   if (pgIntervNext.txtNotes[interventionIndex].Value() === "") {
		   pgIntervNext.txtNotes[interventionIndex].Invalidate("This field needs to be completed before performing this action", true);
	   }
	   else if (pgIntervNext.authIntervention[interventionIndex].Value() === "") {
		   pgIntervNext.authIntervention[interventionIndex].Invalidate("This field needs to be completed before performing this action", true);
	   }
   }
}

// Page 2 - function to open the quick entry page and disable all actions and hide navigation
function ActivateQE() {
   pgQE.Show().Activate();
   EnableDisableActionButtons(false);
   
}

// Page 2 - launch obs popup to add new column
function LaunchNewObsQuickEntry() {
   CloseWarningPopup();
   if (interventionIndex === null || interventionDone) {
	   ActivateQE();
	   // store index for update
	   obsIndexCurrent = obsIndexNext;
	   pgObsCurrent = pgObsNext;

	   // default current date and time
	   var today = new Date();
	   pgQE.dpDate.Value(today);
	   pgQE.dpTime.Value(today);

	   // disable strike for new entry
	   pgQE.chkStrike.Disable();

	   // sign button only active when user adds an obs
	   pgQE.btnSign.Disable();
	   pgQE.btnSignClose.Disable();

	   pgQE.chkIrregular.Disable();
	   pgQE.ddRythm.Disable();

	   // Set focus on Respiratory Rate textbox
	   setTimeout(function(){ pgQE.txtResp.Focus(); }, 500);
   }
   // show validation error if required field needs to be completed
   else {
	   if (pgIntervNext.txtNotes[interventionIndex].Value() === "") {
		   pgIntervNext.txtNotes[interventionIndex].Invalidate("This field needs to be completed before performing this action", true);
	   }
	   else if (pgIntervNext.authIntervention[interventionIndex].Value() === ""){
		   pgIntervNext.authIntervention[interventionIndex].Invalidate("This field needs to be completed before performing this action", true);
	   }
   }
}

// Page 2 - launch obs popup to edit/update existing column
function LaunchEditObsQuickEntry(canEdit) {
	
   ActivateQE();
   // populate with column values
   var valsObj = JSON.parse(pgObsCurrent.txtValues[obsIndexCurrent].Value());
   SetQuickEntryVals(valsObj, pgObsCurrent.dpDate[obsIndexCurrent].Value(), pgObsCurrent.dpTime[obsIndexCurrent].Value());

   // if user can't edit, disable sign and set input controls as readonly
   if (canEdit === false) {
       // disable strike
        pgQE.chkStrike.Disable();
	   // set all input controls as readonly
	   pgQE.dpDate.ReadOnly();
	   pgQE.dpTime.ReadOnly();
	   pgQE.txtResp.ReadOnly();
	   pgQE.txtSaturation.ReadOnly();
	   pgQE.txtFlowRate.ReadOnly();
	   pgQE.txtPulse.ReadOnly();
	   pgQE.ddDevice.ReadOnly();
	   pgQE.ddRythm.ReadOnly();
	   pgQE.chkIrregular.ReadOnly();
	   pgQE.txtBPStandingSystolic.ReadOnly();
	   pgQE.txtBPStandingDiastolic.ReadOnly();
	   pgQE.txtBPSittingSystolic.ReadOnly();
	   pgQE.txtBPSittingDiastolic.ReadOnly();
	   pgQE.txtTemp.ReadOnly();
	   pgQE.ddlConciousness.ReadOnly();
	   pgQE.txtPainScoreRest.ReadOnly();
	   pgQE.txtPainScoreMovement.ReadOnly();
	   pgQE.txtPainScoreBoth.ReadOnly();
	   pgQE.chkIntervention.ReadOnly();

	  // enable strike if user is in the super user group or the one who signed

        var signedUsername = valsObj.username;
        var currentUsername = Vitro.Users().Property(Vitro.USER.Name);

        if (isSuperUser === true || (signedUsername === currentUsername)) {

            pgQE.chkStrike.Enable();

        }

	   // disable sign unless they strike
	   pgQE.btnSign.Disable();
	   pgQE.btnSignClose.Disable();
   }
   // if user can edit
   else {
	
	   // disable strike
	   pgQE.chkStrike.Disable();
	   // if pulse rate empty, disable rhythm dropdown
	   if (pgQE.txtPulse.Value() === "") {
		   pgQE.chkIrregular.Disable();
		   pgQE.ddRythm.Disable();
	   }
	   else {
		   pgQE.ddRythm.Enable();
	   }

	   // sign button only active when user adds an obs
	   pgQE.btnSign.Enable();
	   // check if activity has previously been sealed
	   if (wasSealed === false) {
		   pgQE.btnSignClose.Enable();
	   }

	   // Set focus on Respiratory Rate textbox
	   setTimeout(function(){ pgQE.txtResp.Focus(); }, 500);
   }
}

// Page 2 - update quick entry page with values from stored object (from column in Obs page)
function SetQuickEntryVals(valsObj, dpDate, dpTime) {
	
   pgQE.dpDate.Value(dpDate);
   pgQE.dpTime.Value(dpTime);
   pgQE.txtResp.Value(valsObj.respiratory);
   pgQE.txtSaturation.Value(valsObj.saturation);
   pgQE.txtFlowRate.Value(valsObj.flowRate);
   pgQE.txtPulse.Value(valsObj.pulseRate);
   pgQE.ddDevice.Value(valsObj.device);
   pgQE.ddRythm.Value(ConvertRythmToInitial(valsObj.rythm, false));
   pgQE.chkIrregular.Value(valsObj.irregularPulseRate);
   pgQE.txtBPStandingSystolic.Value(valsObj.bpStandingSystolic);
   pgQE.txtBPStandingDiastolic.Value(valsObj.bpStandingDiastolic);
   pgQE.txtBPSittingSystolic.Value(valsObj.bpSittingSystolic);
   pgQE.txtBPSittingDiastolic.Value(valsObj.bpSittingDiastolic);
   pgQE.txtTemp.Value(valsObj.temperature);
   pgQE.ddlConciousness.Value(ConvertConsciousnessToNum(valsObj.conciousness, false));
   pgQE.txtPainScoreRest.Value(valsObj.painRest);   
   pgQE.txtPainScoreMovement.Value(valsObj.painMovement);   
   pgQE.txtPainScoreBoth.Value(valsObj.painBoth);   
   pgQE.chkIntervention.Value(valsObj.intervention);
}

// Convert rythm values to initial or initial to rythm values
function ConvertRythmToInitial(reference, state){
	var val = "";
	 
	if (state == true)
	{
		switch (reference)
		{
			case "Regular" :
			val = "R";
			break;
 
			case "Irregular" :
			val = "I";
			break;
		}
	}
	else
	{
		switch (reference)
		{
			case "R" :
				val = "Regular";
			break;
 
			case "I" :
				val = "Irregular";
			break;
		}
	}
 
	return val;
 }
 

// Convert consciousness values to numbers or numbers to consciousness values
function ConvertConsciousnessToNum(reference, state){
   var val = "";
	
   if (state == true)
   {
	   switch (reference)
	   {
			case "U - Unresponsive" :
				val = 0;
			break;

		   	case "P - Rousable only by Pain (Conduct GCS)" :
			   val = 1;
		   	break;

		  	case "V - Rousable by Voice (Conduct GCS)" :
			   val = 2;
		   	break;

		   	case "C - New Confusion/Change in Behaviour" :
			   val = 3;
		   	break;

		   	case "A - Alert" :
			   val = 4;
		   	break;
	   }
   }
   else
   {
	   switch (reference)
	   {
		   case 0 :
			   val = "U - Unresponsive";
		   break;

		   case 1 :
			   val = "P - Rousable only by Pain (Conduct GCS)";
		   break;

		   case 2 :
			   val = "V - Rousable by Voice (Conduct GCS)";
		   break;

		   case 3 :
			   val = "C - New Confusion/Change in Behaviour";
		   break;

		   case 4 :
			   val = "A - Alert";
		   break;
	   }
   }

   return val;
}

// Write value on Pain score control to plot to obs
function WritePainScoreObsControl(pg, colourCount, index, painRest, painMovement, painBoth) {
		
		pg.txtPainSevere[index].Value("");
		pg.txtPainModerate[index].Value("");
		pg.txtPainMild[index].Value("");
		pg.txtPainNil[index].Value("");

		 
		// Plot REST score to the controls of obs chart with their corresponding ranges
		if (painRest) {
			if (parseInt(painRest) >= PAIN_SEVERE && parseInt(painRest) <= 10) {			
				pg.txtPainSevere[index].Value(painRest + REST_CODE);	
				colourCount[YELLOW]++;			
			}
			else if (parseInt(painRest) >= PAIN_MODERATE && parseInt(painRest) < PAIN_SEVERE) {	
				pg.txtPainModerate[index].Value(painRest + REST_CODE);		
			}
			else if (parseInt(painRest) >= PAIN_MILD && parseInt(painRest) < PAIN_MODERATE ) {		
				pg.txtPainMild[index].Value(painRest + REST_CODE);		
			}
			else {			
				pg.txtPainNil[index].Value(painRest + REST_CODE);			
			}
		}
		
		// Plot MOVEMENT score to the controls of obs chart with their corresponding ranges
		if (painMovement) {
			if (parseInt(painMovement) >= PAIN_SEVERE && parseInt(painMovement) <= 10) {			
				pg.txtPainSevere[index].Value(painMovement + MOVEMENT_CODE);	
				colourCount[YELLOW]++;				
			}
			else if (parseInt(painMovement) >= PAIN_MODERATE && parseInt(painMovement) < PAIN_SEVERE) {	
				pg.txtPainModerate[index].Value(painMovement + MOVEMENT_CODE);		
			}
			else if (parseInt(painMovement) >= PAIN_MILD && parseInt(painMovement) < PAIN_MODERATE) {		
				pg.txtPainMild[index].Value(painMovement + MOVEMENT_CODE);	
			}
			else {			
				pg.txtPainNil[index].Value(painMovement + MOVEMENT_CODE);			
			}
		}

		// if there are values in rest and movement and values are in same range but not equal
		if((painRest && painMovement) && isPainScoreInSameRange(painRest, painMovement)) {
			pg.txtPainSevere[index].Value("");
			pg.txtPainModerate[index].Value("");
			pg.txtPainMild[index].Value("");
			pg.txtPainNil[index].Value("");

			if (parseInt(painRest) >= PAIN_SEVERE && parseInt(painRest) <= 10) {			
				pg.txtPainSevere[index].Value(painRest + REST_CODE + painMovement + MOVEMENT_CODE);		
				colourCount[YELLOW]++;			
			}
			else if (parseInt(painRest) >= PAIN_MODERATE && parseInt(painRest) < PAIN_SEVERE) {	
				pg.txtPainModerate[index].Value(painRest + REST_CODE + painMovement + MOVEMENT_CODE);		
			}
			else if (parseInt(painRest) >= PAIN_MILD && parseInt(painRest) < PAIN_MODERATE ) {		
				pg.txtPainMild[index].Value(painRest + REST_CODE + painMovement + MOVEMENT_CODE);		
			}
			else {			
				pg.txtPainNil[index].Value(painRest + REST_CODE + painMovement + MOVEMENT_CODE);			
			}

		} 
		
		// Plot BOTH (Rest Movement) to the obs chart with their ranges
		if (painBoth) {
			if (parseInt(painBoth) >= PAIN_SEVERE && parseInt(painBoth) <= 10)  {
				pg.txtPainSevere[index].Value(painBoth + RESTMOVEMENT_CODE);
				colourCount[YELLOW]++;	
			}
			else if (parseInt(painBoth) >= PAIN_MODERATE && parseInt(painBoth) < PAIN_SEVERE) {
				pg.txtPainModerate[index].Value(painBoth + RESTMOVEMENT_CODE);
			}
			else if (parseInt(painBoth) >= PAIN_MILD && parseInt(painBoth) < PAIN_MODERATE) {
				pg.txtPainMild[index].Value(painBoth + RESTMOVEMENT_CODE);
			}
			else {
				 pg.txtPainNil[index].Value(painBoth + RESTMOVEMENT_CODE);
			}			
		}		
	
	return colourCount;
}

// Page 2 - Obs Chart - function to check if column is editable
function CheckIfObsColumnIsEditable(pg, colIndex) {
   if (pg.txtValues[colIndex].Value() !== "") {
	   var obsColValues = JSON.parse(pg.txtValues[colIndex].Value());
	   return obsColValues.canEdit;
   }
   else {
	   return true;
   }
}

// Page 2 - Launch Escalation/Modification Popup
// creates all escalations and modifcation notifications for the most recent obs column
function CreateEscalationModificationPopup() {
  
   var modIndex = GetCurrentMod(); 
   var fIndex = GetCurrentFrequency();

   // if warning or unstruck modification needed
   if ((warningColours.yellow || warningColours.pink) || (fIndex !== null && pgIntervNext.txtStrikeInitials[fIndex].Value() === "") || (modIndex !== null && pgIntervPrevious.txtStrikeInitials2[modIndex].Value() === "")) {
	   warningPopupObj = {};
	   var modsPanelWidth = "280";
	   var modsPanelHeight = "235";
	   // update the width of the mods panel to accommodate any escalations starting from the widest
	   if (warningColours.pink || warningColours.yellow) {
		   modsPanelWidth = "350";
	   }

	   // panels
	   warningPopupObj.panBG = CreateDynamicPanel(pgObsCurrent, OBS_WIDTH, OBS_HEIGHT, false, COLOURS.TRANSPARENT);
	   warningPopupObj.panPopup = CreateDynamicPanel(pgObsCurrent, modsPanelWidth, modsPanelHeight, false, COLOURS.TRANSPARENT, warningPopupObj.panBG);

	   var yPos = null;

	   // create escalation popup if needed
	   yPos = ShowEscalations(yPos);

	   // add modifications if theres active freq or acc mods on page 4
		if (pgObsCurrent.chkACC.Value() === true) {
			var modCtrls = GetModControls(pgIntervNext, modIndex);
			yPos = ShowModifications(modCtrls, yPos, modIndex);
		}

	   // create close button
	   warningPopupObj.btnOk = CreateDynamicButton(pgObsCurrent, ("0, " + yPos), "150", "30", "11", "Ok", warningPopupObj.panPopup);
	   popupEvents.okClickEvent = warningPopupObj.btnOk.Events.Click(CloseFinalPopup);

	   // set panel final height
	   var panH = yPos + parseInt(warningPopupObj.btnOk.Attribute(Vitro.CONTROL.Height), 10) + 5;
	   warningPopupObj.panPopup.Attribute(Vitro.CONTROL.Height, panH.toString());

	   // if index is in first half of the page, align popup to right
	   if (obsIndexCurrent <= (NUM_OBS_REPS / 2)) {
		   alignLeft = false;
		   alignRight = true;
	   }
	   // if index is in second half of page, align popup to left
	   else {
		   alignLeft = true;
		   alignRight = false;
	   }
	   myApp.Load(pgObsCurrent, true);
	   PositionPopup();
	   pgObsCurrent.Activate();

	   // set events
	   popupEvents = {
		   evScroll: pgObsCurrent.Events.Scrolled(PositionPopup),
		   evZoom: pgObsCurrent.Events.Zoomed(PositionPopup),
		   evResize: Vitro.Events.Resized(PositionPopup)
	   };

	   return true;
   }

   return false;
}

// Page 2 - function to display message listing latest Modifications as defined on the Mods page
function ShowModifications(modCtrls, yPos, modIndex) {
  
	if (yPos === null) {
	   yPos = 10;
	}
	 
	warningPopupObj.panModifications = CreateDynamicPanel(pgObsCurrent, "290", "130", true, CUSTOMCOLOURS.POPUP_BLUE, warningPopupObj.panPopup);
	warningPopupObj.lblModification = CreateDynamicLabel(pgObsCurrent, "5,10", "280", "120", "Center", MODS_WARNING_MESSAGE, warningPopupObj.panModifications);
	warningPopupObj.panModifications.Attribute(Vitro.CONTROL.Position, "0," + yPos);
	
	warningPopupObj.lblModification.Attribute(Vitro.CONTROL.FontStyle, "Italic");
	// warningPopupObj.lblModification.Attribute(Vitro.CONTROL.FontSize, "12");
	warningPopupObj.lblModification.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);

	yPos += parseInt(warningPopupObj.panModifications.Attribute(Vitro.CONTROL.Height), 10) + 10;
	
	EnableDisableActionButtons(false);
	return yPos;
}

// Page 2 - create warning popup showing colour images
function ShowEscalations(yPos) {
   if (yPos === null) {
	   yPos = 10;
   }
   var pPos = "0,0";
   
   // if any warning needed
   if (warningColours.yellow || warningColours.pink) {
	   // create warning popups
		warningPopupObj.imgZone = CreateDynamicPanel(pgObsCurrent, "290", "140", true, CUSTOMCOLOURS.POPUP_RED, warningPopupObj.panPopup);
		warningPopupObj.lblZone = CreateDynamicLabel(pgObsCurrent, ("5, " + yPos), "280", "130", "Center", ZONE_WARNING_MESSAGE, warningPopupObj.imgZone);		
				
		warningPopupObj.lblZone.Attribute(Vitro.CONTROL.FontStyle, "Italic");
		// warningPopupObj.lblZone.Attribute(Vitro.CONTROL.FontSize, "12");
		warningPopupObj.lblZone.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);
		
		yPos += parseInt(warningPopupObj.imgZone.Attribute(Vitro.CONTROL.Height), 10);

		EnableDisableActionButtons(false);
   }

   return yPos;
}

// Page 2 - Escalation / Modification Popup - “Ok” Button - Click
function CloseFinalPopup(pg, ctrl) {

   CloseWarningPopup();
   // if no extra popup required and user pressed sign and close
   if (closeAct) {
   		// clear values from QE page
		RemoveQuickEntryVals();
		// set all fields writeable on QE page
		SetQuickEntryWriteable();
	   SubmitAction();
	   myApp.Action(Vitro.ACTIONS.Submit);
   }
   if (ctrl != null && pg.chkACC.Value()) {
		pgInterv.Activate();
   }
   else if (ctrl != null && (warningColours.pink || warningColours.yellow)) {
		pgEsc.Activate();
		if (warningColours.pink) {
			myApp.ScrollTo(0, 700);
		}
		else {
			myApp.ScrollTo(0, 0);
		}	   
   }
   // if nothing to do after closing popup, direct to obs page
   else {
		pgObsCurrent.Activate();	   
   }

   // reset colour warnings
  	warningColours = {
		pink: false,
		yellow: false
	};
}

// Page 2 - function to close the warning popup
function CloseWarningPopup() {
   ClosePopup();
   // destroy popup
   if (warningPopupObj !== null) {
	   pgObsCurrent.DestroyControl(warningPopupObj.panBG);
   }
   warningPopupObj = null;
}
// -------------------------------------------- Page 2 Obs End --------------------------------------------------//

// -------------------------------------------- Page 3 Obs2 Start --------------------------------------------------//

// Page 3 - Other Obs Page - Section 4, Bowels open TextBoxes - Click
function BowelsClick(pg, ctrl, xlocation, ylocation) {
	
	var index = GetRepeaterIndex(ctrl);
	 
	// If the column is a previous OR current column
	// AND If the date on the column is blank or the current day
	//if (index <= bowelIndex && (pg.dpBowelsDate[index].Value() === "" || pg.dpBowelsDate[index].Value() === curDate.ddMM)) {
		// update date and time when control has been updated if there is no value
		if (pg.dpBowelsDate[index].Value() === "") {		
			pg.dpBowelsDate[index].Value(new Date()).Writeable();			
		}
		SetBowels(pg, index);
		if (ctrl.Properties.IsEnabled()) {
			switch (ctrl.Value()) {
				case "":
					ctrl.Value("BO");
					break;
				case "BO":
					ctrl.Value("BNO");
					break;
				case "BNO":
					ctrl.Value("");
					break;
			}
		}
		// if new value is empty
		if (ctrl.Value() === "") {		
			pg.dpBowelsDate[index].Value("");		
			// enable Bowel Textbox on the column
			pg.txtBowels[index].Enable();						
		}
		else {
			CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_LIGHTBLUE, BOWELS_WARNING_MESSAGE);
		}
	//}
 }
 
 // Page 3 - Other Obs Page - Section 4, Additional Observations - Change
 function AdditObsChange(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);
	// update date and time when control has been updated if there is no value
	if (newValue) {
		
		if (pg.dpUrinalysisDate[index].Value() === "" && pg.dpUrinalysisTime[index].Value() === "") {	
			pg.dpUrinalysisDate[index].Value(new Date()).Writeable();
			pg.dpUrinalysisTime[index].Value(new Date()).Writeable();
		}
	}

	// SetBowels(pg, index);
 
	// if new value is empty
	if (newValue === "") {
		var otherObsControls = GetOtherObsControls(pg, index);
		// if the column contains no data in all fields, clear date and time fields
		if (Vitro.Elements.GetControlDetails(otherObsControls).AllCleared) {
			pg.dpUrinalysisDate[index].Value("");
			pg.dpUrinalysisTime[index].Value("");
		}
	}
 }

  // Page 3 - BGL textbox - Change
  function txtBGL_Change(pg, ctrl, oldValue, newValue) {
	
	var index = GetRepeaterIndex(ctrl);
	
	if (newValue) {
		pg.dpBloodGlucoseDate[index].Value(new Date()).Writeable();
		pg.dpBloodGlucoseTime[index].Value(new Date()).Writeable();
			
		// create dynamic popup warning for blood glucose
		CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_ORANGE, BGL_WARNING_MESSAGE);
	
	}
	else {
		pg.dpBloodGlucoseDate[index].Value("");
		pg.dpBloodGlucoseTime[index].Value("");
	}
 } 

 // Page 3 - Daily weight textbox - Change
 function txtDailyWeight_Change(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);
	// var curDate = Vitro.Elements.GetDateString();
	if (newValue) {
		pg.dpWeightDate[index].Value(new Date()).Writeable();
		CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_LIGHTBLUE, BOWELS_WARNING_MESSAGE);
	}
	else {
		pg.dpWeightDate[index].Value("");
	}
	
 }
 
 // Page 3 - Date change
 function dpDate_Change(pg, ctrl, oldValue, newValue) {
	Vitro.Elements.DateTimeValidate(ctrl, newValue, COLOURS.TRANSPARENT, null, ctrl);
 }
 
 // Page 3 - Section 3 - set date and time on column. disable bowels if answered on previous column for day
 function SetBowels(pg, index) {
	// if a previous column has the same date and a value in bowels, disable for this column
	for (var i = 0; i < NUM_OBS_REPS; i++) {
		if (i < index && pg.dpBowelsDate[index].Value() === pg.dpBowelsDate[i].Value()) {
			// if a previous column has an value, disable current column  fields
			if (pg.txtBowels[i].Value() !== "") {				
				pg.txtBowels[index].Disable();
			}
		}
	}
 }

  // Page 3 - Create Other Obs Dynamic Popup
  function CreateOtherObsPopup(pg, popupColor, popupMessage) {
	
	var yPos = 10;
	
	// create panel
	otherObsPopupObj = {};
	otherObsPopupObj.panBG = CreateDynamicPanel(pg, OBS_WIDTH, OBS_HEIGHT, false, COLOURS.TRANSPARENT);
	otherObsPopupObj.panPopup = CreateDynamicPanel(pg, "350", "200", false, COLOURS.TRANSPARENT, otherObsPopupObj.panBG);
	// create popup message

	if (popupMessage === BOWELS_WARNING_MESSAGE) {
		otherObsPopupObj.panBGLMessage = CreateDynamicPanel(pg, "290", "70", true, popupColor, otherObsPopupObj.panPopup);
		otherObsPopupObj.lblBGLMessage = CreateDynamicLabel(pg, "5,10", "280", "60", "Center", popupMessage, otherObsPopupObj.panBGLMessage);
	}
	else {
		otherObsPopupObj.panBGLMessage = CreateDynamicPanel(pg, "290", "210", true, popupColor, otherObsPopupObj.panPopup);
		otherObsPopupObj.lblBGLMessage = CreateDynamicLabel(pg, "5,10" , "280", "200", "Center", popupMessage, otherObsPopupObj.panBGLMessage);
	}
		
	otherObsPopupObj.panBGLMessage.Attribute(Vitro.CONTROL.Position, "0," + parseInt(yPos - 5));
	otherObsPopupObj.lblBGLMessage.Attribute(Vitro.CONTROL.FontStyle, "Italic");
	// otherObsPopupObj.lblBGLMessage.Attribute(Vitro.CONTROL.FontSize, "12");
	otherObsPopupObj.lblBGLMessage.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);	

	yPos += parseInt(otherObsPopupObj.lblBGLMessage.Attribute(Vitro.CONTROL.Height), 10);

	// create close button
	otherObsPopupObj.btnOk = CreateDynamicButton(pg, ("70, " + (parseInt(yPos) + 10)), "150", "30", "11", "Ok", otherObsPopupObj.panPopup);
	otherObsPopupObj.btnOk.Attribute(Vitro.CONTROL.ZIndex, "2");
	popupEvents.OkBGLClickEvent = otherObsPopupObj.btnOk.Events.Click(function (pg) {

		//pgModsNext.Activate();
		// destroy popup
		if (otherObsPopupObj !== null) {
			ClosePopup();
			pg.DestroyControl(otherObsPopupObj.panBG);
		}
		otherObsPopupObj = null;
		EnableDisableActionButtons(true);
	});
	EnableDisableActionButtons(false);
	PositionOtherPopup();		

	// set events
	popupEvents = {
		evScroll: pgObs2Next.Events.Scrolled(PositionOtherPopup),
		evZoom: pgObs2Next.Events.Zoomed(PositionOtherPopup),
		evResize: Vitro.Events.Resized(PositionOtherPopup)
	};

}

// -------------------------------------------- Page 3 Obs2 End --------------------------------------------------//

// -------------------------------------------- Page 4 Mods Start --------------------------------------------------//


// Page 4 - Mods Page - Section 3 – clinical TextBoxes - Change
function ModsChange(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   // check if any controls have a value
   var enableSign = false;
   GetModControls(pg, index).Iterate(function (ctrl) {
	
	   if (ctrl.Value() !== "") {
		   enableSign = true;
	   }
	   if (ctrl.Value() === "" && ctrl.Properties.ID() === "txtMedicalName[" + index + "]") {
			ctrl.Required();
			Vitro.Elements.SetControlHighlight(ctrl);
	   }
	   
   });

   // if any have values, enable signatures
   if (enableSign) {
	   ChangeBG(pg.repClinicalReview[index], COLOURS.TRANSPARENT, false);
	   pg.authNurse1[index].Enable().Required();
	   pg.authNurse2[index].Enable();
	   // set previous column signature readonly persist
	   if (index !== 0) {
		   pg.authNurse1[index - 1].ReadOnly(true);
		   if(pg.authNurse2[index - 1].Value()) {
				pg.authNurse2[index - 1].ReadOnly(true);
		   }
	   }

   }
   // if none filled, disable signatures
   else {
	   ChangeBG(pg.repClinicalReview[index], COLOURS.TRANS_BLUE, false);
	   pg.authNurse1[index].Disable().NotRequired();
	   pg.authNurse2[index].Disable().Value("");

	   pg.txtMedicalName[index].NotRequired();
	   ChangeBG(pg.txtMedicalName[index], COLOURS.TRANSPARENT, false);

	   // set previous column signature writeable
	   if (index !== 0) {
		   pg.authNurse1[index - 1].Writeable(true);
		   pg.authNurse2[index - 1].Writeable(false);
	   }

   }
}

// Page 4 - Mods Page - Section 3 - Doctor’s Name textbox - Change
function DocNameChange(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   // if user enters doctor name, enable nurse 2
   if (newValue !== "") {
	   pg.authNurse2[index].Enable(true);
	   Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
   }
   // else disable nurse 2
   else {
	   pg.authNurse2[index].Disable(true);
	   Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
   }
}

// Page 4 - Mods - Section 3 - Nurse 1 Authorisation - Change
function Nurse1Sign(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   // if user signs
   if (newValue !== "") {
	   pg.txtDocName[index].Writeable(false).Required();
	   Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
	   pg.authNurse2[index].Attribute(Vitro.AUTHORISATION.RequiresPassword, "true");
	   // set date and time
	   var curDate = Vitro.Elements.GetDateString();
	   pg.txtDate[index].Value(curDate.ddMMyyyy);
	   pg.txtTime[index].Value(curDate.HHmm);
	   newValue.SignStamp = Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.FirstName).charAt(0) + ". " + Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.LastName);
	   ctrl.Value(newValue);

   }
   // if user clears signature
   else {
	   // clear Doctor name
	   pg.txtDocName[index].Value("");
	   // remove highlighting
	   ChangeBG(pg.txtDocName[index], COLOURS.TRANSPARENT, true);
	   // set Doctor name readonly and not required
	   pg.txtDocName[index].ReadOnly().NotRequired();
	   pg.authNurse2[index].Disable();
	   pg.txtDate[index].Value("");
	   pg.txtTime[index].Value("");
   }
}

// Page 4 - Mods - Section 3 - Nurse 2 Authorisation - Change
function Nurse2Sign(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   ctrl.Validate();
   // if same user signed both, clear and set as invalid
   if (newValue !== "" && newValue.SignerDetails === pg.authNurse1[index].Value().SignerDetails) {
	   ctrl.Value("");
	   ctrl.Invalidate("Modifications must be signed by a second nurse, enter user login credentials for signing of modifications", true);
   }
   // if user signs and is different from nurse 1
   else if (newValue !== "") {
	   // set Signature Authorisation as not required.
	   pg.authSignature[index].NotRequired();
	   // set the following fields in the current column as read only and persist
	   GetModControls(pg, index).Each.ReadOnly(true);
	   pg.txtDocName[index].ReadOnly();
	   pg.authNurse1[index].ReadOnly();
	   // stamp Forename Initial & Surname in Nurse2 Authorisation
	   newValue.SignStamp = Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.FirstName).charAt(0) + ". " + Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.LastName);
	   ctrl.Value(newValue);

	   // if there is a "next" column available on the page, highlight blue and make writeable
	   if (index < 2) {
		   pg.txtOther.Attribute(Vitro.TEXTBOX.CharLimit, "30", true);
		   GetModControls(pg, index + 1).Each.Writeable(false).Attribute(Vitro.TEXTBOX.CharLimit, "7", true);
		   pg.txtConsciouness[index + 1].Attribute(Vitro.TEXTBOX.CharLimit, "16", true);
		   ChangeBG(pg.repMods[index + 1], COLOURS.TRANS_BLUE, false);
	   }
	   // check if page needs name or overflow
	   // SetupModsPage(pg, index);

   }
   // if signature is cleared
   else {
	   // set Signature Authorisation as required
	   pg.authSignature[index].Required();
	   // set the following fields in the current column as writable
	   GetModControls(pg, index).Each.Writeable(false);
	   pg.txtDocName[index].Writeable(false);
	   pg.authNurse1[index].Writeable(false);
	   // check to remove grey highlighting from previous column if nurse 2 sig is less than 24 hours ago
	   // and main sig is less than 48 hours ago and column has not been struck through
	   GetCurrentMod();
	   // if there is a "next" column available on the page, remove highlighting and make readonly
	   if (index < 2) {
		   GetModControls(pg, index + 1).Each.ReadOnly(true);
		   ChangeBG(pg.repMods[index + 1], COLOURS.TRANSPARENT, true);
	   }
   }
}

// Page 4 - Section 2 Frequency Sign 1 - Change
function Frequency_SignatureSign1(pg, ctrl, oldValue, newValue) {
	
	var index = GetRepeaterIndex(ctrl);
	// if user signs
	if (newValue !== "") { 
		// set freqency read only persist
		pg.txtFrequencyRequired[index].ReadOnly(true);                     
		// set date and time
		
		pg.dpFrequencyDate[index].Value(new Date());    
		pg.dpFrequencyTime[index].Value(new Date());  
		newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp;
		pg.txtDoctorsName[index].Value(Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp).Writeable();
		ChangeBG(pg.txtDoctorsName[index], COLOURS.TRANSPARENT, true);
		// Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.FirstName).charAt(0) + "." + Vitro.Users(newValue.SignerDetails).Property(Vitro.USER.LastName);
		ctrl.Value(newValue);

		// if there is a "next" column available on the page, highlight blue and make writeable
		if (index < 3) {
			pg.txtFrequencyRequired[index + 1].Writeable(false);
			ChangeBG(pg.rptFrequency[index + 1], COLOURS.TRANS_BLUE, false);
		}
		 // if page still default name, set with date
		 if (pg.Title() === PAGE_NAME_INT) {
			 pg.Title(PAGE_NAME_INT + " " + Vitro.Elements.GetDateString().ddMM);
		 }
		 
		 pgObsNext.chkACC.Value(true);
		 pgObs2Next.chkACC.Value(true);	   
		 pgIntervNext.chkACC.Value(true);

		 EnableInterventionRow(true);
					 
	}
	// if user clears signature
	else {
		pg.dpFrequencyDate[index].Value(""); 
		pg.dpFrequencyTime[index].Value(""); 
		pg.txtFrequencyRequired[index].Writeable(false);
		 // set previous column transparent
		 if (index !== 0) {
			 ChangeBG(pg.rptFrequency[index - 1], COLOURS.TRANSPARENT, true);
		 }
		// if there is a "next" column available on the page, remove highlighting and make readonly
		if (index < 3) {
			pg.txtFrequencyRequired[index + 1].ReadOnly(true);
			ChangeBG(pg.rptFrequency[index + 1], COLOURS.TRANSPARENT, true);
		}

		pg.txtDoctorsName[index].Value("").Writeable().Required();
		Vitro.Elements.SetControlHighlight(pg.txtDoctorsName[index]);
		
		EnableInterventionRow(false);
		checkACCInterventionColumns(pg);	
	}
 }

 // Page 4 - Section 2 Frequency Sign 2 - Change
function Frequency_SignatureSign2(pg, ctrl, oldValue, newValue) {
	
	var index = GetRepeaterIndex(ctrl);
	// if user signs
	if (newValue !== "") { 		
		
		pg.dpFrequencyDate[index].Value(new Date());    
		pg.dpFrequencyTime[index].Value(new Date());  
		
		newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp;
		ctrl.Value(newValue);
					 
	}
	else {
		// if sign 1 signature has no value
		if (pg.authSignature[index].Value() === "") {
			// clear date and time fields
			pg.dpFrequencyDate[index].Value("");
			pg.dpFrequencyTime[index].Value("");					
			pg.txtFrequencyRequired[index].Writeable();		
			pg.txtDoctorsName[index].Value("").Writeable().Required();
			Vitro.Elements.SetControlHighlight(pg.txtDoctorsName[index]);
		}	
	}
 }

// Page 4 - Mods - Section 3 - Signature 1 Authorisation - Change
function ModSignatureSign1(pg, ctrl, oldValue, newValue) {
	
   var index = GetRepeaterIndex(ctrl);
   // if user signs
   if (newValue !== "") {
		// set date and time
		pg.dpACCDate[index].Value(new Date());
		pg.dpACCTime[index].Value(new Date());			   	   
	   
		   // if doctorname has no value
		   if (pg.txtMedicalName[index].Value() === "") {
			   pg.txtMedicalName[index].Required();
			   Vitro.Elements.SetControlHighlight(pg.txtMedicalName[index]);
		   }
		   	
		   pg.txtMedicalName[index].Value(Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp);		   
		   // set column as readonly
		   GetModControls(pg, index).Each.ReadOnly(true);		
		   Vitro.Elements.SetControlHighlight(pg.txtMedicalName[index]);
		   pg.txtMedicalName[index].Writeable();

		   // if there is a "next" column available on the page, highlight blue and make writeable
		   if (index < 3) {
			  // pg.txtOther.Attribute(Vitro.TEXTBOX.CharLimit, "29", true);
			   GetModControls(pg, index + 1).Each.Writeable(false);			   
			   ChangeBG(pg.repClinicalReview[index + 1], COLOURS.TRANS_BLUE, false);
		   }
		   // check if page needs name or overflow
		   // SetupModsPage(pg, index);
	   
	   newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp;
	   ctrl.Value(newValue);

	   pgObsNext.chkACC.Value(true);
	   pgObs2Next.chkACC.Value(true);	   
	   pgIntervNext.chkACC.Value(true);

	   EnableInterventionRow(true);

   }
   // if user clears signature
   else {
	   // if Nurse 2 signature has no value	   	   
		// clear date and time fields
		if (pg.authNurse2[index].Value() === "") {
			pg.dpACCDate[index].Value("");
			pg.dpACCTime[index].Value("");
			pg.txtMedicalName[index].Value("");
			Vitro.Elements.SetControlHighlight(pg.txtMedicalName[index]);
		}					   

		// set following fields in column writeable
		GetModControls(pg, index).Each.Writeable();
		pg.authNurse1[index].Writeable(false);
		pg.authNurse2[index].Writeable(false);
		// check to remove grey highlighting from previous column if nurse 2 sig is less than 24 hours ago
		// and main sig is less than 48 hours ago and column has not been struck through
		GetCurrentMod();
		// if there is a "next" column available on the page, remove highlighting and make readonly
		if (index < 2) {
		 	GetModControls(pg, index + 1).Each.ReadOnly(true);
			 ChangeBG(pg.repClinicalReview[index + 1], COLOURS.TRANSPARENT, true);
		}		   

	   EnableInterventionRow(false);
	   checkACCInterventionColumns(pg);	

	}	
}

// Page 4 - Mods - Section 3 - Signature 2 Authorisation - Change
function ModSignatureSign2(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);
	// if user signs
	if (newValue !== "") { 			
		
		// set date and time
		pg.dpACCDate[index].Value(new Date());
		pg.dpACCTime[index].Value(new Date());		
		
		newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).SignatureStamp;
		ctrl.Value(newValue);
					 
	}
	else {
		// if Nurse 1 signature has no value
		if (pg.authNurse1[index].Value() === "") {
			// clear date and time fields
			pg.dpACCDate[index].Value("");
			pg.dpACCTime[index].Value("");	
			pg.txtMedicalName[index].Value("");				
			Vitro.Elements.SetControlHighlight(pg.txtMedicalName[index]);
		}	
	}
}
// Page 4 - Mods - STK button for signed columns
function CreateModsSTKButtons(page) {

		   // check if current user is in super user group
	var isModsUser = false;
	for (var j = 0; j < page4ModsUserGroups.length; j++) {
		if (Vitro.Users().InGroup(page4ModsUserGroups[j])) {
		   isModsUser = true;
		   break;
		}
	}

   for (var i = 0; i < NUM_MOD_REPS; i++)
   {
		// Frequency - if doctor signature or nurse signature is signed and not already struck, create STK
	   if ((page.authSignature[i].Value() !== "" || page.authAttendingMOSignature[i].Value() !== "") && page.txtStrike1[i].Properties.IsVisible() === false) {		
	   		CreateObsDynamicStrike(page, page.rptFrequency[i], page.txtStrike1[i], page.txtStrikeInitials[i], true);	
	   }	
	   
	   if ((page.authNurse1[i].Value() !== "" || page.authNurse2[i].Value() !== "") && page.txtStrike2[i].Properties.IsVisible() === false) {		 
			CreateObsDynamicStrike(page, page.repClinicalReview[i], page.txtStrike2[i], page.txtStrikeInitials2[i], true);		   
	   }
   }
}

// when user signs modification, set previous as readonly, name page and check if overflow is needed
function SetupModsPage(pg, index) {
   // if there is a previous column on the page, highlight grey
   if (index !== 0) {
	   ChangeBG(pgIntervPrevious.repClinicalReview[index - 1], CUSTOMCOLOURS.SOLID_LIGHTGREY, true);
   }
   // if previous column on different page, set all columns on page as readonly
   else if (pgIntervPrevious !== pgIntervNext && index === 0) {
	   for (var i = 0; i < NUM_MOD_REPS; i++) {
		   if (pgIntervPrevious.dpACCDate[i].Value() !== "") {
				pgIntervPrevious.repClinicalReview[i].ReadOnly(true);
			   ChangeBG(pgIntervPrevious.repClinicalReview[i], CUSTOMCOLOURS.SOLID_LIGHTGREY, true);
		   }
	   }
   }
   // store page
   pgIntervPrevious = pg;
   // if page still default name, set with date
   if (pg.Title() === PAGE_NAME_INT) {
	   pg.Title(PAGE_NAME_INT + " " + Vitro.Elements.GetDateString().ddMM);
   }
   // if last row and overflow not already created, make new page
   if ((index + 1) === NUM_MOD_REPS && (pgIntervPrevious === pgIntervNext)) {
	   pgIntervNext = myApp.PageManager.Clone(pgObs2);
	   if (pgIntervNext) {
		   //order the page to be before previous one
		   pgIntervNext.Order(pg.Order());
		   // set as not deletable and visible
		   pgIntervNext.Deletable(false);
		   pgIntervNext.Show(true);
		   pgIntervNext.Title(PAGE_NAME_INT);
		   // Populate the patient label (Section 1) on the overflow page with the most recent data through scripting
		   Vitro.Elements.SetAddressograph(myApp, pgIntervNext);
			Vitro.Elements.GetClientLogo(myApp, pgIntervNext.Control("imgClientLogo")); 
		   Pages_Added(pgIntervNext);
		   // Populate data in section 2 of the previous page to section 2 in the overflow page
		   // CopyModsSection2(pg, pgIntervNext);
		   // if not last row, setup next column
		   SetupNextFreqCol();
	   }
   }
}

// Page 4 - Section 2 - check if ACC frequecny is signed
function GetCurrentFrequency() {
	var findex = null;
	for (var i = 0; i < NUM_FREQUENCY_REPS; i++) {
		if (pgIntervNext.authSignature[i].Value()) {
			findex = i;
			break;
		}
	}
	return findex;
}

// Page 4 - Section 2 - setup next available mods column for data entry
function SetupNextFreqCol() {
	
   for (var i = 0; i < NUM_FREQUENCY_REPS; i++) {
	   if (pgIntervNext.dpFrequencyDate[i].Value() === "") {
		   freqIndex = i;
		   break;
	   }
   }
   // if free row on page, set as editable
   if (freqIndex !== null) {	   
		pgIntervNext.Controls("txtFrequencyRequired[" + freqIndex + "]", "txtDoctorsName[" + freqIndex + "]", 
		"authSignature[" + freqIndex + "]", "authAttendingMOSignature[" + freqIndex + "]").Each.Writeable(false);	   	
	    ChangeBG(pgIntervNext.rptFrequency[freqIndex], COLOURS.TRANS_BLUE, false);
   }
}

// Page 4 - Section 3 - setup next available ACC clinical review column for data entry
function SetupNextModCol() {
	
	for (var i = 0; i < NUM_MOD_REPS; i++) {
		if (pgIntervNext.dpACCDate[i].Value() === "") {
			modsIndex = i;
			break;
		}
	}
	// if free row on page, set as editable
	if (modsIndex !== null) {	 
		GetModControls(pgIntervNext, modsIndex).Each.Writeable(false); 
		pgIntervNext.Controls("authNurse1[" + modsIndex + "]", "authNurse2[" + modsIndex + "]").Each.Writeable(false);	 		 
		ChangeBG(pgIntervNext.repClinicalReview[modsIndex], COLOURS.TRANS_BLUE, false);
	}
 }

// Page 4 - Section 3 - function to get the current Mods Column and mark previous column inactive
function GetCurrentMod() { 
	
   var curDate = new Date();
   var prevModIndex = null;
   var sigDate;
   var hourDiff;
   for (var i = 0; i < NUM_MOD_REPS; i++) {
	   if (pgIntervPrevious.authNurse1[i].Value() !== "" || pgIntervPrevious.authNurse2[i].Value() !== "") {
		   prevModIndex = i;
	   }
   }
   if (prevModIndex !== null) {
	   var sigVal = pgIntervPrevious.authNurse1[prevModIndex].Value();	
	   if (sigVal !== "") {
		   sigDate = Vitro.Elements.ParseStringToDate(sigVal.SignDate);
		   hourDiff = Math.abs(curDate.getTime() - sigDate.getTime()) / 3600000;
		   if (hourDiff < 48) {
			   // if previous column has not been struck through
			   if (pgIntervPrevious.txtStrikeInitials2[prevModIndex].Value() === "") {
				   ChangeBG(pgIntervPrevious.repClinicalReview[prevModIndex], COLOURS.TRANSPARENT, true);
			   }
			   return prevModIndex;
		   }
	   }
	   // if signature blank, check nurse 2
	   else {
		   var nurseSigVal = pgIntervPrevious.authNurse2[prevModIndex].Value();
		   if (nurseSigVal !== "") {
			   sigDate = Vitro.Elements.ParseStringToDate(nurseSigVal.SignDate);
			   hourDiff = Math.abs(curDate.getTime() - sigDate.getTime()) / 3600000;
			   if (hourDiff < 24) {
				   // if previous column has not been struck through	
				   if (pgIntervPrevious.txtStrikeInitials2[prevModIndex].Value() === "") {
					   ChangeBG(pgIntervPrevious.repClinicalReview[prevModIndex], COLOURS.TRANSPARENT, true);
				   }
				   return prevModIndex;
			   }
		   }
	   }
   }
   return null;
}

// Page 4 - Section 2 - function to copy all section to values to latest Mods page
function CopyModsSection2(oldPage, newPage) {
   newPage.chkAlcoholWithdrawal.Value(oldPage.chkAlcoholWithdrawal.Value());
   newPage.chkPain.Value(oldPage.chkPain.Value());
   newPage.chkAnticoagulant.Value(oldPage.chkAnticoagulant.Value());
   newPage.chkNeurological.Value(oldPage.chkNeurological.Value());
   newPage.chkDiabetic.Value(oldPage.chkDiabetic.Value());
   newPage.chkFluidBalance.Value(oldPage.chkFluidBalance.Value());
   newPage.chkNeurovascular.Value(oldPage.chkNeurovascular.Value());
   newPage.chkOther.Value(oldPage.chkOther.Value());
   newPage.txtOther.Value(oldPage.txtOther.Value());
}
// -------------------------------------------- Page 4 Mods End --------------------------------------------------//

// -------------------------------------------- Page 4 Interv Start --------------------------------------------------//
// Page 4 - events on intervention + other obs page
function SetInterventionEvents(pg) {

	for (var a = 0; a < NUM_FREQUENCY_REPS; a++) {
		pg.txtFrequencyRequired[a].Events.Change(Frequency_Change);
		pg.txtDoctorsName[a].Events.Change(DoctorsName_Change);
		pg.authSignature[a].Events.Change(Frequency_SignatureSign1);
		pg.authAttendingMOSignature[a].Events.Change(Frequency_SignatureSign2);

	}

	for (var b = 0; b < NUM_MOD_REPS; b++) {
		GetModControls(pg, b).Each.Events.Change(ModsChange);		
		pg.txtMedicalName[b].Events.Change(DoctorsName_Change);
		pg.authNurse1[b].Events.Change(ModSignatureSign1);
		pg.authNurse2[b].Events.Change(ModSignatureSign2);
	}

   for (var i = 0; i < NUM_INT_REPS; i++) {	 
	   pg.txtNotes[i].Events.Change(InterventionChange);
	   pg.authIntervention[i].Events.Change(InterventionSign);
   }

}

// Page 4 - Section 2 Frequency textbox - Change
function Frequency_Change(pg, ctrl, oldVal, newVal) {
	var index = GetRepeaterIndex(ctrl);
	
	if (newVal != "") {
		ChangeBG(pg.rptFrequency[index], COLOURS.TRANSPARENT, false);
		pg.authSignature[index].Enable().Required().Writeable(false);
		pg.authAttendingMOSignature[index].Enable().Writeable(false);		
		pg.txtDoctorsName[index].Writeable().Required();
		Vitro.Elements.SetControlHighlight(pg.txtDoctorsName[index]);

		// set previous column signature readonly persist
		if (index !== 0) {
			pg.authSignature[index - 1].ReadOnly(true);
		}
		// set previous column signature readonly persist if exists on previous page
		else if (index === 0 && pgIntervPrevious !== pgIntervNext) {
			pgIntervPrevious.authSignature[NUM_FREQUENCY_REPS - 1].ReadOnly(true);
		}
	}
	else {
		ChangeBG(pg.rptFrequency[index], COLOURS.TRANS_BLUE, false);
		pg.authSignature[index].Disable().NotRequired();
		pg.authAttendingMOSignature[index].Disable();
		pg.txtDoctorsName[index].NotRequired();
		ChangeBG(pg.txtDoctorsName[index], COLOURS.TRANSPARENT, false);
		// set previous column signature writeable
		if (index !== 0) {
			pg.authSignature[index - 1].Writeable(true);
		}
		// set previous column signature writable if exists on previous page
		else if (index === 0 && pgIntervPrevious!== pgIntervNext) {
			pgIntervPrevious.authSignature[NUM_FREQUENCY_REPS - 1].Writeable(false);
		}
	}
}

// Page 4 - Section 2 Doctors Name - Change
function DoctorsName_Change(pg, ctrl, oldVal, newVal) {
	
	if (!newVal) {
		ctrl.Required();
		Vitro.Elements.SetControlHighlight(ctrl);
	} 	
}

// Page 4 - Section 3 Clinical textboxes - Change
function ClinicalTextboxes_Change(pg, ctrl, oldVal, newVal) {
	var index = GetRepeaterIndex(ctrl);
	
	if (newVal != "") {
		ChangeBG(pg.repClinicalReview[index], COLOURS.TRANSPARENT, false);
		pg.authNurse1[index].Enable().Required().Writeable(false);
		
		// set previous column signature readonly persist
		if (index !== 0) {
			pg.authNurse1[index - 1].ReadOnly(true);
		}
		// set previous column signature readonly persist if exists on previous page
		else if (index === 0 && pgIntervPrevious !== pgIntervNext) {
			pgIntervPrevious.authNurse1[NUM_MOD_REPS - 1].ReadOnly(true);
		}
	}
	else {
		ChangeBG(pg.rptFrequency[index], COLOURS.TRANS_BLUE, false);
		pg.authNurse1[index].Disable().NotRequired().ReadOnly(true);
		
		// set previous column signature writeable
		if (index !== 0) {
			pg.authNurse1[index - 1].Writeable(true);
		}
		// set previous column signature writable if exists on previous page
		else if (index === 0 && pgIntervPrevious!== pgIntervNext) {
			pgIntervPrevious.authNurse1[NUM_MOD_REPS - 1].Writeable(false);
		}
	}
}

// Page 4 - Interv. + Other Obs Page – Section 2 - Document in Case Notes TextBox - Change
function InterventionChange(pg, ctrl, oldvalue, newvalue) {
   var index = GetRepeaterIndex(ctrl);   
   // enable the Initials Authorisation and make required
   if (newvalue !== "") {
		pg.authIntervention[index].Enable().Required();
		pg.dpInterventionDate[index].Value(new Date());
		pg.dpInterventionTime[index].Value(new Date());
	   // Validate control
	   pg.txtNotes[index].Invalidate("", true);
	   pg.txtNotes[index].Validate();
	   pg.txtNotes[index].Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
   // disable the Initials Authorisation and make not required
   } else {
	   pg.authIntervention[index].Disable().NotRequired();
	   pg.dpInterventionDate[index].Value("");
	   pg.dpInterventionTime[index].Value("");
   }
}

// Page 4 - Interv. + Other Obs Page – Section 2 - Initial Authorisation - Change
function InterventionSign(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   // when row signed, set as readonly
   if (newValue !== "") {
	   // set row as readonly
	   pg.txtNotes[index].ReadOnly(true);	  	   
	   interventionDone = true;
	   // set name to be users initials
	   newValue.SignStamp = GetUserName(newValue.SignerDetails).initials;
	   ctrl.Value(newValue);

	   // Validate control
	   pg.authIntervention[index].Invalidate("", true);
	   pg.authIntervention[index].Validate();
	   pg.authIntervention[index].Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);	 
	   withInterventionErrors = false;
   }
   // include else in case of double click (so that there isnt a readonly required signature)
   else {
		pg.dpInterventionDate[index].Value("");
		pg.dpInterventionTime[index].Value("");
		pg.txtNotes[index].Writeable().Value("");
		Vitro.Elements.SetControlHighlight(pg.txtNotes[index]);			
		pg.authIntervention[index].Disable();
		interventionDone = false;
	   
   }
   // check if page needs name or overflow
   // SetupInterventionPage(pg, index, NUM_INT_REPS);
}

// Page 4 - Obs Chart - function to check if column is editable
function SetObsColumnEditibility(pg, colIndex, canEdit) {
   if (pg.txtValues[colIndex].Value() !== "") {
	   var obsColValues = JSON.parse(pg.txtValues[colIndex].Value());
	   obsColValues.canEdit = canEdit;
	   pgObsCurrent.txtValues[colIndex].Value(JSON.stringify(obsColValues));
   }
}

// Page 4 - Interv. + Other Obs Page - Intervention and Clinical Review Requests – Section 2/3 - STK Button – Clicked
// Checks the required controls and creates STK button for signed columns
function CreateInterSTKButtons(page) {
   // setup strike for Intervention with Abnormal Vitals section
   for (var i = 0; i < NUM_INT_REPS; i++) {
	   Vitro.Elements.SetupDynamicStrike(page, page.repInterventions[i], page.authIntervention[i], page.txtStrike[i], page.txtStrikeInitials3[i]);
   }

}

// Page 4 - Section 3 and 4 - create strike button and set event
function CreateObsDynamicStrike(page, panelCtrl, strikeCtrl, strikeInitialsCtrl, willBeHighlighted) {
   // Creates strike buttons for signed authorisation controls.
   // When strike button is clicked callback function is called.
   // Strike control is shown and populated and strike button is destroyed.
   var btnStk = null;
   var init = Vitro.Elements.GetUserDetails().Initial;
   // get position of initial contorl, button will be placed over it
   var buttonPos = strikeInitialsCtrl.Attribute(Vitro.CONTROL.Position);

   // create dynamic button
   btnStk = CreateDynamicButton(page, buttonPos, "45", "18", "9", "STK", panelCtrl);
   btnStk.Attribute(Vitro.CONTROL.ZIndex, "2");

   // set event
   btnStk.Events.Click(function (page, ctrl, x, y) {
   var curDate = Vitro.Elements.GetDateString().ddMM;
	   // show strike and set name
	   strikeCtrl.Show();
	   strikeInitialsCtrl.Value(init + " " + curDate);
	   // Make column read-only persist
	   panelCtrl.ReadOnly(true);
	   if (willBeHighlighted === true) {
		   // Highlight column grey
		   ChangeBG(panelCtrl, CUSTOMCOLOURS.SOLID_LIGHTGREY, true);
	   }
	   // destroy the dynamic strike button
	   page.DestroyControl(ctrl);
	   checkACCInterventionColumns(page);
   });
}

// Page 4 - Check if there current active column for ACC
function checkACCInterventionColumns(page) {
	
	var freqCount = 0;
	var accCount = 0;
	for (var i = 0; i < NUM_MOD_REPS; i++)
	{
		 // Frequency - if doctor signature or nurse signature is signed and not already struck
		if (page.authSignature[i].Value() !== "") {
			freqCount += 1;
			freqIndex = i;
		}
		 
		// ACC - if doctor signature or nurse signature is signed and not already struck, check user
		if (page.authNurse1[i].Value() !== "") {
			accCount += 1;
			modsIndex = i;			
		}
	}
	
	if ((page.authSignature[freqIndex].Value() !== "" && page.txtStrike1[freqIndex].Properties.IsVisible() === false) 
		|| (page.authNurse1[modsIndex].Value() !== "" && page.txtStrike2[modsIndex].Properties.IsVisible() === false)) {
		pgObsNext.chkACC.Value(true);
		pgObs2Next.chkACC.Value(true);	   
		pgIntervNext.chkACC.Value(true);
	} else {
		pgObsNext.chkACC.Value(false);
		pgObs2Next.chkACC.Value(false);	   
		pgIntervNext.chkACC.Value(false);

		if (interventionIndex != null) {
			if (!pgInterv.authIntervention[interventionIndex].Value() && pgInterv.txtNotes[interventionIndex].Properties.IsRequired()) {
				pgInterv.dpInterventionDate[interventionIndex].Value("");
				pgInterv.dpInterventionTime[interventionIndex].Value("");
				pgInterv.txtNotes[interventionIndex].Value("").NotRequired().ReadOnly();	
				pgInterv.authIntervention[interventionIndex].NotRequired().Disable();				
				ChangeBG(pgInterv.txtNotes[interventionIndex], COLOURS.TRANSPARENT, false);
			}
		}
	}	

}

// Page 4 - function to setup new Intervention page
function SetupInterventionPage(pg, index, numReps) {
   // store page
   // if page still default name, set with date
   if (pg.Title() === PAGE_NAME_INT) {
	   pg.Title(PAGE_NAME_INT + " " + Vitro.Elements.GetDateString().ddMM);
   }
   // if last row, make new page
   if ((index + 1) === numReps) {
	   pgIntervPrevious = pg;
	   pgIntervNext = myApp.PageManager.Clone(pgInterv);
	   if (pgIntervNext) {
			//order the page to be before previous one
		   pgIntervNext.Order(pg.Order());
		   // set as not deletable and visible
		   pgIntervNext.Deletable(false);
		   pgIntervNext.Show(true);
		   pgIntervNext.Title(PAGE_NAME_INT);
		   // Populate the patient label (Section 1) on the overflow page with the most recent data through scripting
		   Vitro.Elements.SetAddressograph(myApp, pgIntervNext);
		   Vitro.Elements.GetClientLogo(myApp, pgIntervNext.Control("imgClientLogo")); 

		   Pages_Added(pgIntervNext);
		   MakePreviousInterventionPageSectionsReadonly(pgIntervPrevious);
		   // reset additional Obs index for new page
		   additionalObsIndex = null;
	   }
   }
}

// Page 4 - function to make intervention page sections readonly when new intervention page created
function MakePreviousInterventionPageSectionsReadonly(pg) {
   // if previous page
   if (pg === pgIntervPrevious) {
	   // set all section 3 rows readonly
	   for (var i = 0; i < NUM_MOD_REPS; i++) {
		   // the full row becomes readonly
		   pg.dpReviewDate[i].ReadOnly(true);
		   pg.dpReviewTime[i].ReadOnly(true);
		   pg.cblEntity[i].ReadOnly(true);
		   pg.txtSpecifyReason[i].ReadOnly(true);
	   }

	   // set section 4 column fields readonly and remove highlighting
	   if (additionalObsIndex !== null) {
		   pg.txtWeight[additionalObsIndex].ReadOnly(false);
		   pg.txtBGL[additionalObsIndex].ReadOnly(false);
		   pg.txtGravity[additionalObsIndex].ReadOnly(false);
		   pg.txtPh[additionalObsIndex].ReadOnly(false);
		   pg.txtLeukocytes[additionalObsIndex].ReadOnly(false);
		   pg.txtBlood[additionalObsIndex].ReadOnly(false);
		   pg.txtNitrite[additionalObsIndex].ReadOnly(false);
		   pg.txtKetones[additionalObsIndex].ReadOnly(false);
		   pg.txtBilirubin[additionalObsIndex].ReadOnly(false);
		   pg.txtUrobilinogen[additionalObsIndex].ReadOnly(false);
		   pg.txtProtein[additionalObsIndex].ReadOnly(false);
		   pg.txtGlucose[additionalObsIndex].ReadOnly(false);
		   ChangeBG(pg.repAdditObs[additionalObsIndex].Properties.Children(), COLOURS.TRANSPARENT, false);
	   }
   }
}
// -------------------------------------------- Page 4 Interv End --------------------------------------------------//

// -------------------------------------------- Progress Notes Action Start --------------------------------------------------//
// Progress Notes Custom Button - Action
function CreateProgNotesButton() {
   myApp.Custom(BTN_PROG_NOTES);
   myApp.Events.Action(function () {
	
	   var lastRowIndex = null;
	   for (var i = 0; i < NUM_INT_REPS; i++) {
		   // if intervention on current page is completed and not stuck through
		   if (pgIntervNext.dpInterventionDate[i].Value() !== "" && pgIntervNext.txtStrikeInitials3[i].Value() === "") {
			   lastRowIndex = i;
		   }
	   }

	   // if filled row found, show popup
	   if (lastRowIndex !== null) {		   
			ActivateQE();
		   CreateProgressNotesPopup();
	   }
	   // if no filled row found, just switch app
	   else {
		   ProgNotesNoClickEvent();
	   }

   }, BTN_PROG_NOTES);
}

// Progress Notes Popup
function CreateProgressNotesPopup() {
   if (progNotesPopupObj === null) {
	   progNotesPopupObj = {};
	   // panels
	   progNotesPopupObj.panCover = CreateDynamicPanel(pgQE, "561", "391", true, COLOURS.SOLID_GREY);
	   progNotesPopupObj.panPopup = CreateDynamicPanel(pgQE, "340", "120", true, COLOURS.SOLID_GREY, progNotesPopupObj.panCover);

	   var message = "You are about to submit the Observation Chart and open the Progress Notes.";
	   progNotesPopupObj.lblMessge1 = CreateDynamicLabel(pgQE, "10, 10", "320", "160", "Left", message, progNotesPopupObj.panPopup);
	   message = "Do you want to copy the last intervention in the progress notes?";
	   progNotesPopupObj.lblMessge2 = CreateDynamicLabel(pgQE, "10, 40", "320", "160", "Left", message, progNotesPopupObj.panPopup);

	   // buttons
	   progNotesPopupObj.btnYes = CreateDynamicButton(pgQE, "10, 80", "100", "30", "11", "Yes", progNotesPopupObj.panPopup);
	   progNotesPopupObj.btnNo = CreateDynamicButton(pgQE, "120, 80", "100", "30", "11", "No", progNotesPopupObj.panPopup);
	   progNotesPopupObj.btnCancel = CreateDynamicButton(pgQE, "230, 80", "100", "30", "11", "Cancel", progNotesPopupObj.panPopup);

		// set popup to center of page
	   popupEvents = Vitro.Elements.SetPositionEvents(myApp, pgQE, progNotesPopupObj.panPopup, QE_WIDTH, QE_HEIGHT);

	   // set button events
	   popupEvents.yesClickEvent = progNotesPopupObj.btnYes.Events.Click(ProgNotesYesClickEvent);
	   popupEvents.noCloseClickEvent = progNotesPopupObj.btnNo.Events.Click(ProgNotesNoClickEvent);
	   popupEvents.cancelClickEvent = progNotesPopupObj.btnCancel.Events.Click(ProgNotesCancelClickEvent);
   }
}

// Progress Notes “Confirm Dialog” – “Yes” Button - Click
// when user clicks yes button in progress notes popup, switch to progres notes with intervention text
function ProgNotesYesClickEvent() {
   // get last entered intrvention row
   var lastRowIndex = null;
   var intervRowPg = pgIntervNext;
   for (var i = 0; i < NUM_INT_REPS; i++) {
	   if (pgIntervNext.dpInterventionDate[i].Value() !== ""  && pgIntervNext.txtStrikeInitials3[i].Value() === "") {
		   lastRowIndex = i;
	   }
   }

   // if filled row found, get message
   if (lastRowIndex !== null) {
	   var messageText = "Date: " + intervRowPg.dpInterventionDate[lastRowIndex].Value() + "\n";
	   messageText += "Note: " + intervRowPg.txtNotes[lastRowIndex].Value() + "\n";
	   Vitro.Xaim(Vitro.Elements.ObsChartToProgNotesKey).Initialisation({ obsValues: messageText });
   }
   // get progress notes activity
   Vitro.Elements.GetMostRecentProgressNotes(myApp, function (progNotesAct) {
	   changeToProgNotes = true;
	   SubmitAction();
	   myApp.Existing(progNotesAct.Id);
	   myApp.Action(Vitro.ACTIONS.Submit);
   });
   ClosePopup();
   pgObsNext.Activate();
   pgQE.Hide();
}

// Progress Notes “Confirm Dialog” – “No” Button - Click
// when user clicks no button in progress notes popup, close popup and switch to progres notes
function ProgNotesNoClickEvent() {
   // get progress notes activity and switch to it
   Vitro.Elements.GetMostRecentProgressNotes(myApp, function (progNotesAct) {
	
	   changeToProgNotes = true;
	   SubmitAction();
	   myApp.Existing(progNotesAct.Id);
	   myApp.Action(Vitro.ACTIONS.Submit);
   });
   
   ClosePopup();   
   pgObsNext.Activate();
   pgQE.Hide();
}

// Progress Notes “Confirm Dialog” – “Cancel” Button - Click
// when user clicks cancel button in progress notes popup, close popup and do nothing
function ProgNotesCancelClickEvent() {	 
   changeToProgNotes = false;
   ClosePopup();   
   pgObsNext.Activate();
   pgQE.Hide();
}
// -------------------------------------------- Progress Notes Action End --------------------------------------------------//

function ClosePopup() {
   // remove all events
   for (var obj in popupEvents) {
	   if (popupEvents.hasOwnProperty(obj)) {
		   var eventObj = popupEvents[obj];
		   // if array, remove all events in array
		   if (Object.prototype.toString.call(eventObj) === "[object Array]") {
			   for (var i = 0; i < eventObj.length; i++) {
				   eventObj[i].Remove();
			   }
		   }
		   // otherwise, just remove event
		   else {
			   eventObj.Remove();
		   }
	   }
   }
   popupEvents = {};
   // destroy popup
   if (progNotesPopupObj !== null) {
	   pgQE.DestroyControl(progNotesPopupObj.panCover);
   }
   progNotesPopupObj = null;
   // enable action buttons
   EnableDisableActionButtons(true);
 
}

// create a label with default properties
function CreateDynamicLabel(page, position, width, height, textAlignment, text, parentControl) {
   // set label properties
   var props = {};
   props[Vitro.CONTROL.Position] = position;
   props[Vitro.CONTROL.Width] = width;
   props[Vitro.CONTROL.Height] = height;
   props[Vitro.CONTROL.ZIndex] = "0";
   props[Vitro.CONTROL.Border] = "False";
   props[Vitro.CONTROL.FontFamily] = "Courier New";
   props[Vitro.CONTROL.FontSize] = "13";
   props[Vitro.CONTROL.FontWeight] = "Bold";
   props[Vitro.LABEL.TextAlignment] = textAlignment;
   props[Vitro.LABEL.TextWrapping] = "Wrap";
   props[Vitro.LABEL.Content] = text;
   // create control
   return page.CreateControl(Vitro.TYPE.Label, props, parentControl);
}

// position popup to the left or right of screen
function PositionPopup() {
   // Get the coords
   var scrollY = pgObsCurrent.Properties.ScrollY();
   var zoom = pgObsCurrent.Properties.Zoom();

   // View with and height in form scale
   var viewH = myApp.Properties.ViewHeight() / zoom;

   // Enforce page limits
   if (viewH > OBS_HEIGHT) {
	   viewH = OBS_HEIGHT;
   }

   // Get the dialog size
   var panH = parseInt(warningPopupObj.panPopup.Attribute(Vitro.CONTROL.Height), 10);
   // Calc the position to center
   var posY = Math.round(scrollY / zoom + (viewH - panH) / 2.0);

   // if aligning to the left
   var pos;
   if (alignRight) {
	   pos = (OBS_WIDTH - (parseInt(warningPopupObj.panPopup.Attribute(Vitro.CONTROL.Width), 10) + 5)) + "," + posY;
	   warningPopupObj.panPopup.Attribute(Vitro.CONTROL.Position, pos, false);
   }
   // if aligning to the right
   else if (alignLeft) {
	   pos = "5 ," + posY;
	   warningPopupObj.panPopup.Attribute(Vitro.CONTROL.Position, pos, false);
   }
}

// position popup of other obs 
function PositionOtherPopup() {
	// Get the coords
	var scrollY = pgObs2Next.Properties.ScrollY();
	var zoom = pgObs2Next.Properties.Zoom();
 
	// View with and height in form scale
	var viewH = myApp.Properties.ViewHeight() / zoom;
 
	// Enforce page limits
	if (viewH > OBS_HEIGHT) {
		viewH = OBS_HEIGHT;
	}
 
	// Get the dialog size
	var panH = parseInt(otherObsPopupObj.panPopup.Attribute(Vitro.CONTROL.Height), 10);
	// Calc the position to center
	var posY = Math.round(scrollY / zoom + (viewH - panH) / 2); 

	// if aligning to the left
	var pos;
	
	pos = ((parseInt(OBS_WIDTH) / 2) - (parseInt(otherObsPopupObj.panPopup.Attribute(Vitro.CONTROL.Width), 10) / 2.5)) + "," + posY;
	otherObsPopupObj.panPopup.Attribute(Vitro.CONTROL.Position, pos, false);

 }