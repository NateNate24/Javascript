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
var pgMods = myApp.RegisterPage("page2");
var pgInterv = myApp.RegisterPage("page3");
var pgObs = myApp.RegisterPage("page4");
var pgEsc = myApp.RegisterPage("page5");

// repeater length constants
var NUM_OBS_REPS = 15;
var NUM_FREQUENCY_REPS = 4;
var NUM_MOD_REPS = 4;
var NUM_INT_REPS = 4;
var NUM_CLINIC_REPS = 3;
var NUM_ADDIT_OBS_REPS = 7;

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
var PAGE_NAME_OBS = "Phys Obs";
var PAGE_NAME_INT = "General + Obs";
var PAGE_NAME_MODS = "Order & Mods";

// get colour defaults
var COLOURS =  Vitro.Elements.Colours;
var CUSTOMCOLOURS = {
   SOLID_LIGHTRED: "255, 255, 120, 120",
   SOLID_LIGHTGREY: "128,217,217, 217",
   SOLID_RED: "255, 255, 0, 0",
   SOLID_BLACK: "255, 0, 0, 0",
   SOLID_BLUE: "255, 0, 112, 192",   
   SOLID_LIGHTPINK: "255, 251, 205, 190",
   SOLID_YELLOW: "255, 255, 250, 200",
   SOLID_LIGHTSALMON: "255, 255, 231, 207",
   SOLID_SALMON: "255, 249, 206, 190",
   SOLID_PURPLE: "255, 208, 195, 221",
   POPUP_ORANGE: "255, 246, 185, 164",
   POPUP_YELLOW: "255, 255, 255, 175",
   POPUP_LIGHTBLUE: "255, 206, 225, 242",
   POPUP_LIGHTPURPLE: "255, 215, 204, 226",
   POPUP_BLUE: "255, 165, 201, 235",
   POPUP_RED: "255, 255, 105, 105",
   POPUP_LIGHTGREEN: "255, 201, 232, 166"

};

// Set up OData query actions
var OData = Vitro.Elements.OData.Toolset();
var arrHyperlinkActIDResults = [];
// List of apps in mods page to check if activities exist and add hyperlink , to be moved to API
var APPLIST_TO_HYPERLINK = ["Alcohol Withdrawal Scale", 
							"Amphetamine Withdrawal Scale", 
							"Benzodiazepine Withdrawal Scale",
							"Cannabis Withdrawal Scale (CWS)",
							"Subjective Opioid Withdrawal Scale (SOWS)",
							"Diabetes Observation Chart",
							"Wound Care Chart",
							"Fluid Balance Chart (FBC)",
							"Food and Fluid Chart (FFC)",
							"Neuro Observation Chart",
							"Bowel Chart",
							"Weight Chart",
							"Pain Management Chart"
							];

// other obs warning messages
var BGL_WARNING_MESSAGE = "If patient requires regular observations, refer to Diabetes Obs Chart. \n\nFor most patients the target \nBGL range is 5-10mmol/L, \npregnancy is an exception. \nRefer to: tabs 'Order & Mods' \nfor MO order, 'Escalation', \nas well as Insulin Chart and \nlocal clinical policy for escalation \nprocedure however titled.";						  
var BOWELS_WARNING_MESSAGE = "If patient requires regular observations, refer to relevant charts.";
var MODS_WARNING_MESSAGE = "There is an open Modification -\nrefer to: tabs 'Order & Mods' \nfor MO order, and 'Escalation', \nand to local clinical policy for \nescalation procedure however titled.";							
var ESC_WARNING_MESSAGE = "Patient has any shaded area \n(Score 1 to Emergency) observations \nor an open Modification – refer to: \ntabs 'Order & Mods' and 'Escalation', \nand to local clinical policy for \nescalation procedure however titled.";
var PAIN_WARNING_MESSAGE = "If patient pain level observations \nrequire or there is an open\nModification. Refer to: \ntabs 'Order & Mods' and 'Escalation', \nand to local clinical policy for \nescalation procedure however titled.";
var POPUP_CHARTS_FONTFAMILY = "Lucida Sans Unicode";

// key to check which textbox is required for displaying chart value
var GREATER = "Greater";
var LESSER = "Lesser";
// store colour names
var YELLOW = "yellow";
var PINK = "pink";
var PURPLE = "purple";
var SALMON = "salmon";
var WHITE = "white";
// side to show warning popup on
var alignRight = false;
var alignLeft = false;
// flag to check if activity has been sealed previously
var wasSealed = false;
// flag to check active intervention when signed
var interventionDone = false;
// flag to show pain warning message
var showPainPopup = false;

var ceaseCallbackFunction = function(appStatus) {
    // If status is equal to "Ceased"
    if(appStatus == Vitro.Elements.StringConstants.Ceased) {
        // .Extra api will be used for isUnsealed flag
        myApp.Activity.Extra(false);
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
var pgModsNext = pgMods;
var pgModsPrevious = pgMods;
var pgIntervNext = pgInterv;
var pgIntervPrevious = pgInterv;

// index of current row/column
var bglIndex = null;
var clinicIndex = null;
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
var page2ModsUserGroups = [Vitro.Elements.UserGroups.Super_User, Vitro.Elements.UserGroups.Doctors];

// PartialPageLoading();

// store what colour warning to show
var warningColours = {
   pink: false,
   yellow: false,
   salmon: false,
   purple: false,
   white: false
};

// register controls on escalation page
pgEsc.RegisterControls("imgYellow", "imgPink", "imgPurple", "imgWhite", "imgSalmon", "txtRecentPageIds");

var page1QEAll = pgQE.Controls("dpDate", "dpTime", "txtResp", "txtSaturation", "txtFlowRate", "txtHeartRateStanding", "txtHeartRateSitting",
"ddRythmLying", "ddRythmStanding", "chkLyingIrregular", "txtBPSittingSystolic", "txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic",
"txtTemp", "ddlConciousness", "txtPainStanding", "txtPainSitting", "chkIntervention", "chkStrike");

var page1QETextboxes = pgQE.Controls("txtResp", "txtSaturation", "txtFlowRate",  "txtHeartRateStanding", "txtHeartRateSitting", "txtBPSittingSystolic",
"txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic", "txtTemp", "txtPainStanding", "txtPainSitting");

// store the controls to hyperlink on mods
var hyperlinkCtrls = pgMods.RegisterControls("lblAlcoholWithdrawalScale", "lblAmphetamineWithdrawalScale", "lblBenzodiazepineWithdrawalScale", "lblCannabisWithdrawalScale", "lblOpioidWithdrawalScale",
	"lblDiabetesObsChart", "lblWoundCare", "lblFluidBalanceChart", "lblFoodAndFluidChart", "lblNeuroObsChart", "lblWeightChart", "lblBowelChart", "lblPainManagement");

var CTRL_LINK_APPS = {
        "lblAlcoholWithdrawalScale": APPLIST_TO_HYPERLINK[0],
        "lblAmphetamineWithdrawalScale": APPLIST_TO_HYPERLINK[1],
        "lblBenzodiazepineWithdrawalScale": APPLIST_TO_HYPERLINK[2],
        "lblCannabisWithdrawalScale": APPLIST_TO_HYPERLINK[3],
        "lblOpioidWithdrawalScale": APPLIST_TO_HYPERLINK[4],
        "lblDiabetesObsChart": APPLIST_TO_HYPERLINK[5],
        "lblWoundCare": APPLIST_TO_HYPERLINK[6],
        "lblFluidBalanceChart": APPLIST_TO_HYPERLINK[7],
        "lblFoodAndFluidChart": APPLIST_TO_HYPERLINK[8],
        "lblNeuroObsChart": APPLIST_TO_HYPERLINK[9],
        "lblWeightChart": APPLIST_TO_HYPERLINK[10],
        "lblBowelChart": APPLIST_TO_HYPERLINK[11],
        "lblPainManagement": APPLIST_TO_HYPERLINK[12]        
    }

// used for setting value in chart based off of range
// stores if point lands in warning colour and if textbox needed for display
var chartPoints = { 
   "respiratory": {
	   "0": {index: 1, text: LESSER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},
	   "5": {index: 2, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "10": {index: 3, colour: WHITE, mews: 0, mewsColor: COLOURS.TRANSPARENT},
	   "15": {index: 4,  colour: WHITE, mews: 0, mewsColor: COLOURS.TRANSPARENT},
	   "20": {index: 5, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "25": {index: 6, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "30": {index: 7, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "35": {index: 8, text: GREATER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE}
   },
   "saturation": {
	   "0": {index: 1, text: LESSER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},
	   "85": {index: 2, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "87": {index: 3, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},	   
	   "90": {index: 4, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "93": {index: 5, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "95": {index: 6, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "98": {index: 7, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT}   
	   
   },
   "flow": {
	   "0": {index: 1, text: LESSER, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "4": {index: 2, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "7": {index: 3, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "10": {index: 4, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "13": {index: 5, text: GREATER, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK}
   },
   "pulse": {
	   "0": {index: 1, text: LESSER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},
	   "40": {index: 2, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "50": {index: 3, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "60": {index: 4, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "70": {index: 5, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "80": {index: 6, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "90": {index: 7, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "100": {index: 8, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "110": {index: 9, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "120": {index: 10, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "130": {index: 11, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "140": {index: 12, text: GREATER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE}	   
   },
   "sysBloodpressure": {
	   "0": {index: 40, text: LESSER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "50": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "60": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "70": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "80": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "90": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "100": {colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "110": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "120": {colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "150": {colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "160": {colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "170": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "190": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},	  
	   "200": {index: 200, text: GREATER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE}
   },
   "bloodpressure": {
	   "0": {index: 40, text: LESSER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	
	   "50": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "60": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "70": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "80": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	   
	   "90": {colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},	    
	   "100": {colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "110": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "120": {colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "150": {colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "160": {colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "170": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "190": {colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},	  
	   "200": {index: 200, text: GREATER, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE}
   },
   "temperature": {
	   "0": {index: 1, text: LESSER, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "35.5": {index: 2, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "36.0": {index: 3, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "36.5": {index: 4, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "37.0": {index: 5, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "37.5": {index: 6, colour: WHITE, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "38.0": {index: 7, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW},
	   "38.5": {index: 8, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "39.1": {index: 9, text: GREATER, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON}	  
   },
   "conciousness": {
	   "0": {index: 1, colour: PURPLE, mews: "", mewsColor: CUSTOMCOLOURS.SOLID_PURPLE},
	   "1": {index: 2, colour: PINK, mews: 4, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTPINK},
	   "2": {index: 3, colour: SALMON, mews: 3, mewsColor: CUSTOMCOLOURS.SOLID_LIGHTSALMON},
	   "3": {index: 4, colour: WHITE, mews: "", mewsColor: CUSTOMCOLOURS.TRANSPARENT}
	   
   },
   "pain": {
	   "0": {index: 1, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "1": {index: 2, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "4": {index: 3, mews: 0, mewsColor: CUSTOMCOLOURS.TRANSPARENT},
	   "7": {index: 4, colour: YELLOW, mews: 1, mewsColor: CUSTOMCOLOURS.SOLID_YELLOW}
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
	   pg.RegisterControls("panQE", "dpDate", "dpTime", "txtResp", "txtSaturation", "txtFlowRate", "txtHeartRateStanding",
		"txtHeartRateSitting", "chkLyingIrregular", "chkStandingIrregular", "ddRythmLying", "ddRythmStanding", "txtBPSittingSystolic", "txtBPSittingDiastolic", "txtBPStandingSystolic", "txtBPStandingDiastolic",
	   "txtTemp", "ddlConciousness", "txtPainStanding", "txtPainSitting", "chkIntervention", "chkStrike", "txtWarning", "btnSign", "btnSignClose", "btnCancel");
   }
   // if mods page 2
   else if (pg === pgMods || myApp.PageManager.Master(pg) === pgMods) { 
	   pg.RegisterControls("cblOtherCharts", "chkAlcoholWithdrawal", "chkAmphetamine", "chkBenzodiazepine", "chkCannabis", "chkOpioid", "chkBloodSugar", 
		"chkWoundCare", "chkFluidBalance", "chkNutritional", "chkNeurological", "chkPain", "chkOther1", "chkOther2", "txtPainManagement", "txtOther1", "txtOther2");

		// Frequency
	   RegisterRepeaterControls(pg, ["rptFrequency", "dpFrequencyDate", "dpFrequencyTime", "ddObsFrequency", "txtRationale", "authSignature", "dpReviewDate", "txtStrikeInitials1",
		   "txtStrike1"], NUM_FREQUENCY_REPS);
	
		// Mods
		RegisterRepeaterControls(pg, ["repMods", "txtRespRate", "txtSaturation", "txtFlowRate", "txtSystolicBP", "txtHeartRate", "txtTemperature", "txtConsciousness",
		"txtDocName", "authNurse1", "dpModsDate", "dpModsTime", "txtStrikeInitials2","txtStrike2"], NUM_MOD_REPS);
       
		
   }
   // if intervention page 3
   else if (pg === pgInterv || myApp.PageManager.Master(pg) === pgInterv) {
	   // only register controls once (function is called outside of event when app is opened for partially loaded pages)
	   if (pg.Added !== true) {
		   pg.Added = true;
		   pg.RegisterControls("imgClientLogo", "chPainStanding", "psPainStanding", "chPainSitting", "psPainSitting");
		   // Interventions
		   RegisterRepeaterControls(pg, ["repInterventions", "dpInterventionDate", "dpInterventionTime", "txtNotes", "authIntervention", 
		   		"txtStrike1", "txtStrikeInitials"
			], NUM_INT_REPS);
		   // Clinical Review Requests 
		   RegisterRepeaterControls(pg, ["repClinicalReview", "dpReviewDate", "dpReviewTime", "authClinicalReview", "txtReason", 
			"txtStrike2", "txtStrikeInitials2"], NUM_MOD_REPS);
            // Additional Observations
            RegisterRepeaterControls(pg, ["repBloodGlucose", "dpBloodGlucoseDate", "dpBloodGlucoseTime", "txtBGL", "txtBowelsWeight", 
				"txtBowels", "repAdditObs", "txtGravity", "txtPh", "txtLeukocytes", "txtBlood", 
                "txtNitrite", "txtKetones", "txtBilirubin", "txtUrobilinogen", "txtProtein", "txtGlucose"
            ], NUM_ADDIT_OBS_REPS);
			// Obs pain
			RegisterRepeaterControls(pg, ["repPain", "dpDate", "dpTime", "txtValues", "lblStrike"], NUM_OBS_REPS);
			
	   }
   }
    // if an observation page 4
   else if (pg === pgObs || myApp.PageManager.Master(pg) === pgObs) {
	   // register controls
	   pg.RegisterControls("charResp", "charSaturation", "charFlowRate",  "charBPSitting",
		   "charBPStanding", "chHeartRateStanding", "chHeartRateSitting", "charTemp", "psTemp", "charConciousness", "psResp", 
		   "psSaturation", "psFlowRate", "bsBPSitting", "bsBPStanding", "psHeartRateStanding", "psHeartRateStandingIrregular",
		   "psHeartRateSitting", "psHeartRateSittingIrregular", "psConciousness");
	   RegisterRepeaterControls(pg, ["repObs", "dpDate", "dpTime", "txtRespMore", "txtRespLess", "txtSaturationLess",
		   "txtFlowRateMore", "txtFlowRateLess", "txtRythm", "txtBPStandingMore", "txtBPSittingMore", "txtBPStandingLess", "txtBPSittingLess",
			"txtHRStandingMore", "txtHRSittingMore", "txtHRStandingLess", "txtHRSittingLess", "txtTempMore", "txtTempLess", 
			"txtRespiratoryScore", "txtO2SaturationScore", "txtO2FlowRateScore", "txtSystolicBPScore", "txtHeartRateScore", "txtTemperatureScore",
			"txtConciousnessScore", "txtADDSTotalScore", "txtIntervention", "txtValues", "lblStrike", "txtStrikeSign", "txtSign", "pnlBpMax"
	   ], NUM_OBS_REPS);
   }
}

// get modification controls
function GetModControls(pg, index) {	
   return pg.Controls("txtRespRate[" + index + "]", "txtSaturation[" + index + "]", "txtFlowRate[" + index + "]",
	   "txtSystolicBP[" + index + "]", "txtHeartRate[" + index + "]", "txtTemperature[" + index + "]", "txtConsciousness[" + index + "]");
}

// function to get Page 3 Section 4 controls
function GetOtherObsControls(pg, index) {
   return pg.Controls("txtBGL[" + index + "]", "txtBowelsWeight[" + index + "]", "txtBowels[" + index + "]",
	"txtGravity[" + index + "]", "txtPh[" + index + "]", "txtLeukocytes[" + index + "]",
   "txtBlood[" + index + "]", "txtNitrite[" + index + "]", "txtKetones[" + index + "]", "txtBilirubin[" + index + "]",
   "txtUrobilinogen[" + index + "]", "txtProtein[" + index + "]", "txtGlucose[" + index + "]");
}

// function to return clinical review controls
function GetClinicalControls(pg, index) {
	return pg.Controls("dpReviewDate[" + clinicIndex + "]", "dpReviewTime[" + clinicIndex + "]", 
		"authClinicalReview[" + clinicIndex + "]", "txtReason[" + clinicIndex + "]");
 }

// displayed event function for all pages
function Pages_Displayed(pg) {

if (myApp.Activity.Properties.Status() !== Vitro.STATUS.Sealed) {
	   // if an observation page
	   if (pg === pgObs || myApp.PageManager.Master(pg) === pgObs) {
		   // if page has not been displayed already 
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;

			   Vitro.Elements.SetAddressograph(myApp, pg); 
			   Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo")); 
			   SetObsEvents(pg);
		   }
	   }
	   // if modification page
	   else if (pg === pgMods || myApp.PageManager.Master(pg) === pgMods) {
		   // only run logic the first time the page is displayed
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;		

			   Vitro.Elements.SetAddressograph(myApp, pg); 
			   Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo")); 

			   pg.chkOther1.Events.Change(function(pg, ctrl, oldValue, newValue) {
					if (newValue){
						pg.txtOther1.Enable().Writeable().Required();
						Vitro.Elements.SetControlHighlight(pg.txtOther1);
					}
					else {
						pg.txtOther1.Value("").NotRequired().Disable();
						Vitro.Elements.SetControlHighlight(pg.txtOther1);
					}
			   });

			   pg.chkOther2.Events.Change(function(pg, ctrl, oldValue, newValue) {
				if (newValue){
					pg.txtOther2.Enable().Writeable().Required();
					Vitro.Elements.SetControlHighlight(pg.txtOther2);
				}
				else {
					pg.txtOther2.Value("").NotRequired().Disable();
					Vitro.Elements.SetControlHighlight(pg.txtOther2);
				}
		   		});

				 // if most recent page and mod colummn not set, highlight next empty
			   if (pg === pgModsNext && freqIndex === null) {
					SetupNextFreqCol(pg);				
			   }
			   if (freqIndex !== null) {
					SetFrequencyEvents(pg);		
			   }
			   // if most recent page and mod colummn not set, highlight next empty
				if (pg === pgModsNext && modsIndex === null) {
					SetupNextModCol(pg);
				}

			// create strike through buttons
			CreateModsSTKButtons(pg);				
			SetLabelsToLink();
			
			
			}
	   }
	   // if intervention page
	   else if (pg === pgInterv || myApp.PageManager.Master(pg) === pgInterv) {
		
		   // only run logic the first time the page is displayed
		   if (pg.Displayed !== true) {
			   pg.Displayed = true;

			   Vitro.Elements.SetAddressograph(myApp, pg); 
			   Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo")); 

				SetInterventionEvents(pg);			 
				EnableInterventionRow(true);
			
			   	// Set Clninical review row and event 
				if (pg === pgIntervNext && bglIndex === null) {
					for (var a = 0; a < NUM_CLINIC_REPS; a++) {
						if (pg.authClinicalReview[a].Value() === "") {
							clinicIndex = a;
							break;
						}
					}
				}

				if (clinicIndex !== null) {
					
					var clinicCtrls = GetClinicalControls(pg, clinicIndex);
					clinicCtrls.Each.Events.Change(ClinicCtrls_Change);					
					ChangeBG(clinicCtrls, COLOURS.TRANS_BLUE, false);
					pg.authClinicalReview[clinicIndex].Events.Change(authClinicalReview_Change);
				}

			   	// Set BGL row and event 
				if (pg === pgIntervNext && bglIndex === null) {
					for (var j = 0; j < NUM_OBS_REPS; j++) {
						if (pg.dpBloodGlucoseDate[j].Value() === "") {
							bglIndex = j;
							break;
						}
					}
				}
					
					if (bglIndex !== null) {
						pg.dpBloodGlucoseDate[bglIndex].Events.Change(dpDate_Change);	
						pg.dpBloodGlucoseTime[bglIndex].Events.Change(dpDate_Change);	
						pg.txtBGL[bglIndex].Events.Change(txtBGL_Change);							
						pg.txtBGL[bglIndex].Writeable(false);
						pg.txtBowelsWeight[bglIndex].Events.Change(txtBGL_Change);	
						pg.txtBowelsWeight[bglIndex].Writeable(false);
						pg.txtBowels[bglIndex].Events.Click(BowelsClick);	
						pg.txtBowels[bglIndex].Enable();
						ChangeBG(pg.Controls("dpBloodGlucoseDate[" + bglIndex + "]", "dpBloodGlucoseTime[" + bglIndex + "]", 
						"txtBGL[" + bglIndex + "]", "txtBowelsWeight[" + bglIndex + "]", "txtBowels[" + bglIndex + "]"), COLOURS.TRANS_BLUE, false);

						pg.repAdditObs[bglIndex].Properties.Children().Each.Events.Change(AdditObsChange);											   
						pg.txtGravity[bglIndex].Writeable(false);
						pg.txtPh[bglIndex].Writeable(false);
						pg.txtLeukocytes[bglIndex].Writeable(false);
						pg.txtBlood[bglIndex].Writeable(false);
						pg.txtNitrite[bglIndex].Writeable(false);
						pg.txtKetones[bglIndex].Writeable(false);
						pg.txtBilirubin[bglIndex].Writeable(false);
						pg.txtUrobilinogen[bglIndex].Writeable(false);
						pg.txtProtein[bglIndex].Writeable(false);
						pg.txtGlucose[bglIndex].Writeable(false);
						ChangeBG(pg.repAdditObs[bglIndex].Properties.Children(), COLOURS.TRANS_BLUE, false);
					}			
			// create strike through buttons			
			CreateInterSTKButtons(pg);
			CreateClinicSTKButtons(pg);		
		   }
	   }
	   // Escalation page
	   else if (pg === pgEsc || myApp.PageManager.Master(pg) === pgEsc) {
			if (pg.Displayed !== true) {
				pg.Displayed = true;
				Vitro.Elements.SetAddressograph(myApp, pg); 
				Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo")); 
			}
	   }
	}

}

function myApp_Loaded() {
	
   if (myApp.Activity.Properties.Status() !== Vitro.STATUS.Sealed) {

	   	Vitro.Elements.SetAddressograph(myApp); 
		Vitro.Elements.GetClientLogo(myApp, pgObsNext.Control("imgClientLogo")); 
	   
	   OnAppOpen();
	   // show the Escalation page when not sealed
	   pgEsc.Show();

	  	// fetch activity of patient per apps via odata then put it to array
		LoadAppsOdataLinkArray();
		
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
					pgIntervNext.txtValues[k].Value(JSON.stringify(obsCol));
				}
			}

			// page 4 - set modificaton signature as readonly if signed    	
				for (var j = 0; j < NUM_FREQUENCY_REPS; j++) {
					if(pgModsNext.authSignature[j].Value() !== "")				
					{						
						pgModsNext.authSignature[j].ReadOnly(true);
					}
					
				}
				for (var a = 0; a < NUM_MOD_REPS; a++) { 
					if (pgMods.authNurse1[a].Value() !== "") {
						pgMods.txtDocName[a].ReadOnly(true);
						pgMods.authNurse1[a].ReadOnly(true);                
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
			for (var b = 0; b < NUM_INT_REPS; b++) {
				if (pgIntervNext.dpInterventionDate[b].Value() !== "" || pgIntervNext.dpInterventionTime[b].Value() !== "") {
							
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
			curModsPage: pgModsNext.Properties.ID(),
			prevModsPage: pgModsPrevious.Properties.ID(),
			// next and last intervention page
			curIntervPage: pgIntervNext.Properties.ID(),
			prevIntervPage: pgIntervPrevious.Properties.ID()
		};

		pgEsc.txtRecentPageIds.Value(JSON.stringify(pageIDs));

	}
}

function myApp_Actions(act) {
	
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
	   pgModsNext = myApp.Page(storedIDs.curModsPage);
	   pgModsPrevious = myApp.Page(storedIDs.prevModsPage);
	   // next and last intervention page
	   pgIntervNext = myApp.Page(storedIDs.curIntervPage);
	   pgIntervPrevious = myApp.Page(storedIDs.prevIntervPage);
   }

   // register controls on non-loaded pages for getting and setting control values
   if(pgModsPrevious !== pgModsNext) {
	   Pages_Added(pgModsPrevious);
   }
   Pages_Added(pgModsNext);

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
   myApp.Load(pgModsNext, true);
   
   var lastObsColumnValue = pgObsNext.Control("txtValues[" + (NUM_OBS_REPS - 1)  + "]").Value();
   // if a doctor, start on intervention page
   if (isDoctor  || lastObsColumnValue != "") {
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
   pgQE.txtHeartRateStanding.Events.Change(PulseChangeEvent);
   pgQE.txtHeartRateSitting.Events.Change(PulseChangeEvent); 
   pgQE.ddRythmLying.Events.Change(LyingRythmChangeEvent);  
   pgQE.ddRythmStanding.Events.Change(StandingRythmChangeEvent);  
   pgQE.ddlConciousness.Events.Change(ConsciousnessChangeEvent);
   
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
   valsObj.heartRateStanding = pgQE.txtHeartRateStanding.Value();
   valsObj.heartRateSitting = pgQE.txtHeartRateSitting.Value();
   valsObj.lyingIrregularPulseRate = pgQE.chkLyingIrregular.Value();
   valsObj.standingIrregularPulseRate = pgQE.chkStandingIrregular.Value();
   valsObj.rythmLying = ConvertRythmToInitial(pgQE.ddRythmLying.Value(), true);
   valsObj.rythmStanding = ConvertRythmToInitial(pgQE.ddRythmStanding.Value(), true);
   valsObj.bpStandingSystolic = pgQE.txtBPStandingSystolic.Value();
   valsObj.bpStandingDiastolic = pgQE.txtBPStandingDiastolic.Value();
   valsObj.bpSittingSystolic = pgQE.txtBPSittingSystolic.Value();
   valsObj.bpSittingDiastolic = pgQE.txtBPSittingDiastolic.Value();
   valsObj.temperature = pgQE.txtTemp.Value();
   valsObj.conciousness = ConvertConsciousnessToNum(pgQE.ddlConciousness.Value(), true);
   valsObj.painStanding = pgQE.txtPainStanding.Value();
   valsObj.painSitting = pgQE.txtPainSitting.Value();
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
   pgQE.txtHeartRateStanding.Value("");
   pgQE.txtHeartRateSitting.Value("");   
   pgQE.chkLyingIrregular.Value(false);
   pgQE.chkStandingIrregular.Value(false);
   pgQE.ddRythmLying.Value("").NotRequired();
   pgQE.ddRythmStanding.Value("").NotRequired();
   pgQE.txtBPStandingSystolic.Value("");
   pgQE.txtBPStandingDiastolic.Value("");
   pgQE.txtBPSittingSystolic.Value("");
   pgQE.txtBPSittingDiastolic.Value("");
   pgQE.txtTemp.Value("");
   pgQE.ddlConciousness.Value("");
   pgQE.txtPainStanding.Value("");
   pgQE.txtPainSitting.Value("");
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
   pgQE.txtHeartRateStanding.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtHeartRateSitting.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.chkLyingIrregular.Writeable();
   pgQE.chkStandingIrregular.Writeable();
   pgQE.ddRythmLying.Writeable();
   pgQE.ddRythmStanding.Writeable();
   pgQE.txtBPStandingSystolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPStandingDiastolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPSittingSystolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtBPSittingDiastolic.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtTemp.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.ddlConciousness.Writeable();
   pgQE.txtPainStanding.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
   pgQE.txtPainSitting.Writeable().Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
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
   // if pulse has a value, enable standing irregular checkbox
   if (pg.txtHeartRateStanding.Value() !== "") {	   
	   pg.chkStandingIrregular.Enable();	   
	   pg.ddRythmStanding.Enable();
   }
   // if pulse is empty, disable and clear irregular
   else {	   
	   pg.chkStandingIrregular.Value("").Disable();	   
	   pg.ddRythmStanding.Value("").Disable();
   }

   // if pulse has a value, enable lying irregular checkbox
   if (pg.txtHeartRateSitting.Value() !== "") {
		pg.chkLyingIrregular.Enable();	
		pg.ddRythmLying.Enable();	
	}
	// if pulse is empty, disable and clear irregular
	else {
		pg.chkLyingIrregular.Value("").Disable();	
		pg.ddRythmLying.Value("").Disable();	
	}

}

// Page 1 - Add Quick Entry – Lying Pulse Rate - Change
function LyingRythmChangeEvent(pg, ctrl, oldValue, newValue) {
	
	// if irregular 
	if (newValue == "Irregular") {
		pg.chkLyingIrregular.Value(true);		
	}
	// if regular uncheck 
	else {
		pg.chkLyingIrregular.Value(false);
		
	}

	if (pg.txtHeartRateSitting.Value() && newValue == "") {
		pgQE.txtWarning.Value("Rhythm is required").Show();	
		ctrl.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);	
	} else {				
		ctrl.Attribute(Vitro.CONTROL.BorderColour, COLOURS.SOLID_GREY, false);			
	}
	
 }

 // Page 1 - Add Quick Entry – Standing Pulse Rate - Change
function StandingRythmChangeEvent(pg, ctrl, oldValue, newValue) {
	
	// if irregular 
	if (newValue == "Irregular") {
		pg.chkStandingIrregular.Value(true);		
	}
	// if regular uncheck 
	else {
		pg.chkStandingIrregular.Value(false);
		
	}

	if (pg.txtHeartRateStanding.Value() && newValue == "") {		
		pgQE.txtWarning.Value("Rhythm is required").Show();	
		ctrl.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);	
	} else {
		ctrl.Attribute(Vitro.CONTROL.BorderColour, COLOURS.SOLID_GREY, false);		
	}
		
 }

  // Page 1 - Add Quick Entry – Consciousness - Change
function ConsciousnessChangeEvent(pg, ctrl, oldValue, newValue) {
	
	if (newValue != "") {	
		ctrl.Attribute(Vitro.CONTROL.BorderColour, COLOURS.SOLID_GREY, false);			
	} else {
		ctrl.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);		
	}
		
 }

// Page 1 - Add Quick Entry - Input Controls - Change
// when any input control in the quick entry page is changed, validate values and check to enable signature
function ObsChangeEvent(pg, ctrl, oldValue, newValue) {
	
	pgQE.txtWarning.Value("");
	pg.ddRythmLying.Attribute(Vitro.CONTROL.BorderColour, COLOURS.SOLID_GREY, false);	
	pg.ddRythmStanding.Attribute(Vitro.CONTROL.BorderColour, COLOURS.SOLID_GREY, false);	
	
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
	   // pain standing must be less than or equal to 10
	   else if ((ctrl === pg.txtPainStanding || ctrl === pg.txtPainSitting) && newValue > 10) {
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
   
  	// consciousness must be required
	if (pg.ddlConciousness.Value() === "") {
		pg.ddlConciousness.Attribute(Vitro.CONTROL.Border, "True");					
		pg.ddlConciousness.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);
			
	}
	// heart rate sitting, rythm must be required
	if (pg.txtHeartRateSitting.Value() && pg.ddRythmLying.Value() === "") {					
		pg.ddRythmLying.Attribute(Vitro.CONTROL.Border, "True");					
		pg.ddRythmLying.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);				
		pgQE.txtWarning.Value("Rhythm is required");
	}
	// heart rate standing, rythm must be required
	if (pg.txtHeartRateStanding.Value() && pg.ddRythmStanding.Value() === "") {				
		pg.ddRythmStanding.Attribute(Vitro.CONTROL.Border, "True");					
		pg.ddRythmStanding.Attribute(Vitro.CONTROL.BorderColour, CUSTOMCOLOURS.SOLID_RED, false);			
		pgQE.txtWarning.Value("Rhythm is required");
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
 
   	// double check pain rhythm
   	// if ((pgQE.txtHeartRateSitting.Value() || pgQE.txtHeartRateStanding.Value()) && (pgQE.ddRythmLying.Value() === "" || pgQE.ddRythmStanding.Value() === "")) {
	if ((pgQE.txtHeartRateSitting.Value() && pgQE.ddRythmLying.Value() === "") || (pgQE.txtHeartRateStanding.Value() && pgQE.ddRythmStanding.Value() === "")) {
		isAllValid = false;
	}

	// Conciousness is required
	if (pgQE.ddlConciousness.Value() === "") {
		isAllValid = false;
	}

    // check all warnings 	
	if (pgQE.txtWarning.Value()) {
		isAllValid = false;
	}

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
   ChangeBG(pgQE.dpDate, COLOURS.WHITE);
   ChangeBG(pgQE.dpTime, COLOURS.WHITE);
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
   // enable action buttons
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
   if (pgObsCurrent.dpDate[obsIndexCurrent].Value() !== "" && (pgObsCurrent === pgObsPrevious || pgObsCurrent === pgModsPrevious) && canEdit === true) {
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
	   pgIntervNext.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
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
			   pgObsNext.Title("Phys Obs " + Vitro.Elements.GetDateString().ddMM);
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
	   pgIntervNext.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
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
	  	
	   // store strike initials
	   valsObj.strikeInitials = pgObsCurrent.txtStrikeSign[obsIndexCurrent].Value();
	   // set JSON stringified Obs values for column
	   pgObsCurrent.txtValues[obsIndexCurrent].Value(JSON.stringify(valsObj));
	   pgIntervNext.lblStrike[obsIndexCurrent].Show();
	
   }
}

// Page 1 - add values from popup to chart 
function AddObsValues(obsIndex, obsVals, colDate, colTime) {
	
	var colourCount = {
        yellow: 0,
        pink: 0,
        purple: 0,
		salmon: 0,
		white: 0
    };  
   var pointInfo1;
   var pointInfo2;
   
   // set date and time from Obs column vals
   pgObsCurrent.dpDate[obsIndex].Value(colDate);
   pgObsCurrent.dpTime[obsIndex].Value(colTime);
   pgIntervNext.dpDate[obsIndex].Value(colDate);
   pgIntervNext.dpTime[obsIndex].Value(colTime);
   
   ClearTotalMewsScore(obsIndex);

   // store respiratory rate
   pointInfo1 = GetPointInfo(obsVals.respiratory, chartPoints.respiratory);
   UpdatePointSeries(pointInfo1, obsVals.respiratory, pgObsCurrent.psResp, pgObsCurrent.txtRespMore[obsIndex], pgObsCurrent.txtRespLess[obsIndex], obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   // update background colour if max or min values are used for the blood pressure
   if (pgObsCurrent.txtRespMore[obsIndex].Value() !== "") {
	   pgObsCurrent.txtRespMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
   }
   else {
	   pgObsCurrent.txtRespMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObsCurrent.txtRespLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtRespLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
   }
   else {
	   pgObsCurrent.txtRespLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }

   if (obsVals.respiratory !== "") pgObsCurrent.txtRespiratoryScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);

   // store saturation
   pointInfo1 = GetPointInfo(obsVals.saturation, chartPoints.saturation);
   UpdatePointSeries(pointInfo1, obsVals.saturation, pgObsCurrent.psSaturation, null, pgObsCurrent.txtSaturationLess[obsIndex], obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   if (pgObsCurrent.txtSaturationLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtSaturationLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
   }
   else {
	   pgObsCurrent.txtSaturationLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }

   if (obsVals.saturation !== "") pgObsCurrent.txtO2SaturationScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);
   
   // store O2 flow rate	
	pointInfo1 = GetPointInfo(obsVals.flowRate, chartPoints.flow);
	UpdatePointSeries(pointInfo1, obsVals.flowRate, pgObsCurrent.psFlowRate, pgObsCurrent.txtFlowRateMore[obsIndex], pgObsCurrent.txtFlowRateLess[obsIndex], obsIndex);
	if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
		colourCount[pointInfo1.colour]++;
	}
	if (pgObsCurrent.txtFlowRateMore[obsIndex].Value() !== "") {
		pgObsCurrent.txtFlowRateMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTPINK, true);
	}
	else {
		pgObsCurrent.txtFlowRateMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	}

	if (pgObsCurrent.txtFlowRateLess[obsIndex].Value() !== "") {
		pgObsCurrent.txtFlowRateLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
	}
	else {
		pgObsCurrent.txtFlowRateLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	}

	if (obsVals.flowRate !== "") pgObsCurrent.txtO2FlowRateScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);

   // store Rythm
	pgObsCurrent.txtRythm[obsIndex].Value(obsVals.rythmLying);

	// store standing blood pressure
	var barInfoStanding1 = "";
	var barInfoStanding2 = "";
	var barInfoSitting1 = "";
	var barInfoSitting2 = "";

	barInfoStanding1 = GetPointInfo(obsVals.bpStandingSystolic, chartPoints.sysBloodpressure);
	barInfoStanding2 = GetPointInfo(obsVals.bpStandingDiastolic, chartPoints.bloodpressure);
   UpdateBarSeries(barInfoStanding1, barInfoStanding2, obsVals.bpStandingSystolic, obsVals.bpStandingDiastolic, pgObsCurrent.bsBPStanding, pgObsCurrent.txtBPStandingMore[obsIndex], pgObsCurrent.txtBPStandingLess[obsIndex], obsIndex);
   // NOTE: Standing blood pressure will not have any colour warnings as per business rules
   // store sitting blood pressure
   barInfoSitting1 = GetPointInfo(obsVals.bpSittingSystolic, chartPoints.sysBloodpressure);
   barInfoSitting2 = GetPointInfo(obsVals.bpSittingDiastolic, chartPoints.bloodpressure);
   UpdateBarSeries(barInfoSitting1, barInfoSitting2, obsVals.bpSittingSystolic, obsVals.bpSittingDiastolic, pgObsCurrent.bsBPSitting, pgObsCurrent.txtBPSittingMore[obsIndex], pgObsCurrent.txtBPSittingLess[obsIndex], obsIndex);
   // if systolic has a colour warning
   if (barInfoSitting1 !== null && barInfoSitting1.colour !== undefined) {
	   colourCount[barInfoSitting1.colour]++;
   }
   // update background colour if max or min values are used for the blood pressure
   if (pgObsCurrent.txtBPStandingMore[obsIndex].Value() !== "" || pgObsCurrent.txtBPSittingMore[obsIndex].Value() !== "") {
	   // if the value for Blood pressure sitting max is less than 199 then we set the background colour pink to indicate the escalation
	   if (parseInt(pgObsCurrent.txtBPSittingMore[obsIndex].Value(), 10) <= 199) {
		   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
	   }
	   else {
		   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
	   }
   }
   else {
	   pgObsCurrent.pnlBpMax[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObsCurrent.txtBPStandingLess[obsIndex].Value() !== "" || pgObsCurrent.txtBPSittingLess[obsIndex].Value() !== "") {
	   pgObsCurrent.txtBPStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
	   pgObsCurrent.txtBPSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_PURPLE, true);
   }
   else {
	   pgObsCurrent.txtBPStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   pgObsCurrent.txtBPSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   // add systolic score
   if (obsVals.bpStandingSystolic !== "") {	
		pgObsCurrent.txtSystolicBPScore[obsIndex].Value(barInfoStanding1.mews).Attribute(Vitro.CONTROL.BackgroundColour, barInfoStanding1.mewsColor, true);
	}
   if (obsVals.bpSittingSystolic !== "") {
		pgObsCurrent.txtSystolicBPScore[obsIndex].Value(barInfoSitting1.mews).Attribute(Vitro.CONTROL.BackgroundColour, barInfoSitting1.mewsColor, true);
   } 
   	
    // store heartrate standing 
	pointInfo1 = GetPointInfo(obsVals.heartRateStanding, chartPoints.pulse);
	UpdatePointSeries(pointInfo1, obsVals.heartRateStanding, pgObsCurrent.psHeartRateStanding, pgObsCurrent.txtHRStandingMore[obsIndex], pgObsCurrent.txtHRStandingLess[obsIndex], obsIndex);
	if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
		colourCount[pointInfo1.colour]++;
	}    
	
	// Update if irregular Heart Rate Standing
	var psStandingMore = pgObsCurrent.txtHRStandingMore[obsIndex].Value();
	var psStandingLess = pgObsCurrent.txtHRStandingLess[obsIndex].Value();
	if (obsVals.standingIrregularPulseRate === true) {
		// UpdatePointSeries(pointInfo1, "", pgObsCurrent.psHeartRateStanding, null, null, obsIndex);
		UpdatePointSeries(pointInfo1, obsVals.heartRateStanding, pgObsCurrent.psHeartRateStandingIrregular, pgObsCurrent.txtHRStandingMore[obsIndex], pgObsCurrent.txtHRStandingLess[obsIndex], obsIndex);
		if (psStandingMore !== "") {
			pgObsCurrent.txtHRStandingMore[obsIndex].Value(psStandingMore);
			pgObsCurrent.txtHRStandingMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);		
		 
		}
		else {
			pgObsCurrent.txtHRStandingMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
		}
		if (psStandingLess !== "") {
			pgObsCurrent.txtHRStandingLess[obsIndex].Value(psStandingLess);
			pgObsCurrent.txtHRStandingLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);		
		 
		}
		else {
			pgObsCurrent.txtHRStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
		}
	}
	else {
		 UpdatePointSeries(pointInfo1, "", pgObsCurrent.psHeartRateStandingIrregular, null, null, obsIndex);
		 // UpdatePointSeries(pointInfo1, obsVals.heartRateStanding, pgObsCurrent.psHeartRateStanding, pgObsCurrent.txtHRStandingMore[obsIndex], pgObsCurrent.txtHRStandingLess[obsIndex], obsIndex);
	   
		if (psStandingMore !== "") {
			pgObsCurrent.txtHRStandingMore[obsIndex].Value(psStandingMore);
			pgObsCurrent.txtHRStandingMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);		
		}
		else {
			pgObsCurrent.txtHRStandingMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
		}
		if (psStandingLess !== "") {
			pgObsCurrent.txtHRStandingLess[obsIndex].Value(psStandingLess);
			pgObsCurrent.txtHRStandingLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);
		}
		else {
			pgObsCurrent.txtHRStandingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
		}
	}
 
	 // add standing heartrate score
	 if (obsVals.heartRateStanding !== "") pgObsCurrent.txtHeartRateScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);

	// store heartrate sitting  
	pointInfo1 = GetPointInfo(obsVals.heartRateSitting, chartPoints.pulse);
	UpdatePointSeries(pointInfo1, obsVals.heartRateSitting, pgObsCurrent.psHeartRateSitting, pgObsCurrent.txtHRSittingMore[obsIndex], pgObsCurrent.txtHRSittingLess[obsIndex], obsIndex);	
	if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
		colourCount[pointInfo1.colour]++;
	}

   // Update if irregular Heart Rate Sitting
   var psSittingMore = pgObsCurrent.txtHRSittingMore[obsIndex].Value();
   var psSittingLess = pgObsCurrent.txtHRSittingLess[obsIndex].Value();
   if (obsVals.lyingIrregularPulseRate === true) {
		//UpdatePointSeries(pointInfo1, "", pgObsCurrent.psHeartRateSitting, null, null, obsIndex);
	    UpdatePointSeries(pointInfo1, obsVals.heartRateSitting, pgObsCurrent.psHeartRateSittingIrregular, pgObsCurrent.txtHRSittingMore[obsIndex], pgObsCurrent.txtHRSittingLess[obsIndex], obsIndex);
	   if (psSittingMore !== "") {
		   pgObsCurrent.txtHRSittingMore[obsIndex].Value(psSittingMore);
		   pgObsCurrent.txtHRSittingMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);		
		 
	   }
	   else {
		   pgObsCurrent.txtHRSittingMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
	   if (psSittingLess !== "") {
		   pgObsCurrent.txtHRSittingLess[obsIndex].Value(psSittingLess);
		   pgObsCurrent.txtHRSittingLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLUE, true);		
		
	   }
	   else {
		   pgObsCurrent.txtHRSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
   }
   else {
	   UpdatePointSeries(pointInfo1,  "", pgObsCurrent.psHeartRateSittingIrregular, null, null, obsIndex);
	 //  UpdatePointSeries(pointInfo1, obsVals.heartRateSitting, pgObsCurrent.psHeartRateSitting, pgObsCurrent.txtHRSittingMore[obsIndex], pgObsCurrent.txtHRSittingLess[obsIndex], obsIndex);
	   if (psSittingMore !== "") {
		   pgObsCurrent.txtHRSittingMore[obsIndex].Value(psSittingMore);
		   pgObsCurrent.txtHRSittingMore[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);		
	   }
	   else {
		   pgObsCurrent.txtHRSittingMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
	   if (psSittingLess !== "") {
		   pgObsCurrent.txtHRSittingLess[obsIndex].Value(psSittingLess);
		   pgObsCurrent.txtHRSittingLess[obsIndex].Attribute(Vitro.TEXTBOX.TextColour, CUSTOMCOLOURS.SOLID_BLACK, true);		
	   }
	   else {
		   pgObsCurrent.txtHRSittingLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	   }
   } 
 
    // add sitting heartrate score
	if (obsVals.heartRateSitting !== "") pgObsCurrent.txtHeartRateScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);
    	
   // store temperature   
   pointInfo1 = GetPointInfo(obsVals.temperature, chartPoints.temperature);
   UpdatePointSeries(pointInfo1, obsVals.temperature, pgObsCurrent.psTemp, pgObsCurrent.txtTempMore[obsIndex], pgObsCurrent.txtTempLess[obsIndex], obsIndex);

   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }
   if (pgObsCurrent.txtTempMore[obsIndex].Value() !== "") {
	pgObsCurrent.txtTempMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTSALMON, true);
   }
   else {
	pgObsCurrent.txtTempMore[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }
   if (pgObsCurrent.txtTempLess[obsIndex].Value() !== "") {
	pgObsCurrent.txtTempLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTPINK, true);
   }
   else {
	pgObsCurrent.txtTempLess[obsIndex].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
   }

     // add temp score
	if (obsVals.temperature !== "") pgObsCurrent.txtTemperatureScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);

   // store conciousness   
   pointInfo1 = GetPointInfo(obsVals.conciousness, chartPoints.conciousness);
   UpdatePointSeries(pointInfo1, obsVals.conciousness, pgObsCurrent.psConciousness, null, null, obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
   }

    // add conciousness score
	if (obsVals.conciousness !== "") pgObsCurrent.txtConciousnessScore[obsIndex].Value(pointInfo1.mews).Attribute(Vitro.CONTROL.BackgroundColour, pointInfo1.mewsColor, true);
   
   // store pain movement
   pointInfo1 = GetPointInfo(obsVals.painStanding, chartPoints.pain);
   UpdatePointSeries(pointInfo1, obsVals.painStanding, pgIntervNext.psPainStanding, null, null, obsIndex);
   if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
	   colourCount[pointInfo1.colour]++;
	   showPainPopup = true;
   }

    // store pain rest
	pointInfo1 = GetPointInfo(obsVals.painSitting, chartPoints.pain);
	UpdatePointSeries(pointInfo1, obsVals.painSitting, pgIntervNext.psPainSitting, null, null, obsIndex);
	if (pointInfo1 !== null && pointInfo1.colour !== undefined) {
		 colourCount[pointInfo1.colour]++;
		 showPainPopup = true;
	}

   // set sign value
   pgObsCurrent.txtSign[obsIndex].Value(obsVals.sign);   
   ComputeTotalMEWS(obsIndex);

   // return colour count array to determine setting of escalation colours
   return colourCount;
}

// Page 1 - sets the escalation colours required for the current Obs entry
function SetEscalationColours(colourCount) {

   // if any purple, show purple
   if (colourCount.purple > 0) {
	   warningColours.purple = true;
   }
   // if any pink, show pink
   else if (colourCount.pink > 0) {
	   warningColours.pink = true;
   }
   // if any yellow, show yellow
   else if (colourCount.yellow > 0) {
	   warningColours.yellow = true;
   }
   // if any salmon, show salmon
   else if (colourCount.salmon > 0) {
		warningColours.salmon = true;
   }
   // if any white, show white
   else if (colourCount.white > 0) {
		warningColours.white = true;
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
					pgIntervNext.txtNotes[interventionIndex].Writeable();
				}
				
				ChangeBG(pgIntervNext.dpInterventionDate[interventionIndex], COLOURS.TRANS_BLUE, false);
				ChangeBG(pgIntervNext.dpInterventionTime[interventionIndex], COLOURS.TRANS_BLUE, false);			
				ChangeBG(pgIntervNext.txtNotes[interventionIndex], COLOURS.TRANS_BLUE, false);
				ChangeBG(pgIntervNext.authIntervention[interventionIndex], COLOURS.TRANS_BLUE, false);									
				
			}
			else {
				if (!pgIntervNext.authIntervention[interventionIndex].Value()){
					pgIntervNext.txtNotes[interventionIndex].Writeable();
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
	   pg.txtHRStandingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtHRSittingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtHRStandingLess[i].Events.Click(ObsColumnClicked);
	   pg.txtHRSittingLess[i].Events.Click(ObsColumnClicked);	   
	   pg.txtBPStandingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtBPSittingMore[i].Events.Click(ObsColumnClicked);
	   pg.txtBPStandingLess[i].Events.Click(ObsColumnClicked);
	   pg.txtBPSittingLess[i].Events.Click(ObsColumnClicked);	
	   pg.txtIntervention[i].Events.Click(ObsColumnClicked);
	   pg.txtValues[i].Events.Click(ObsColumnClicked);
	   pg.txtSign[i].Events.Click(ObsColumnClicked);
	   pg.txtStrikeSign[i].Events.Click(ObsColumnClicked);
	//   pgInterv.repPain[i].Events.Click(ObsColumnClicked);
   }
}

// Page 2 - Observation Page - Section 2 – Column Clicked
function ObsColumnClicked(pg, ctrl, xl, yl) {
	
   var index = GetRepeaterIndex(ctrl);
   // if popup not open and no intervention waiting to be signed
 //  if (interventionIndex === null || interventionDone) {
	   // if warning popup open, close it
	   CloseWarningPopup()
	   obsIndexCurrent = index;
	   pgObsCurrent = pgObsNext;
	   // if column has values and strike not visible, check if it can be edited
	   if (pg.dpDate[index].Value() !== "" && pg.lblStrike[index].Properties.IsVisible() === false) {
		   var canEdit = CheckIfObsColumnIsEditable(pg, index);
		   // if editing selected column
		   if ((pg === pgObsPrevious || pg === pgModsPrevious) && canEdit === true) {
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

// Page 2 - function to open the quick entry page and disable all actions and hide navigation
function ActivateQE() {
   pgQE.Show().Activate();
   EnableDisableActionButtons(false);   
}

// Page 4 - launch obs popup to add new column
function LaunchNewObsQuickEntry() {
	
   CloseWarningPopup();
   //if (interventionIndex === null || interventionDone) {
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

	   pgQE.chkLyingIrregular.Disable();
	   pgQE.chkStandingIrregular.Disable();
	   pgQE.ddRythmLying.NotRequired().Disable();
	   pgQE.ddRythmStanding.NotRequired().Disable();
	   // Set focus on Respiratory Rate textbox
	   setTimeout(function(){ pgQE.txtResp.Focus(); }, 500);

}

// Page 4 - launch obs popup to edit/update existing column
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
	   pgQE.txtHeartRateStanding.ReadOnly();
	   pgQE.txtHeartRateSitting.ReadOnly();	   
	   pgQE.ddRythmLying.ReadOnly();
	   pgQE.ddRythmStanding.ReadOnly();
	   pgQE.chkLyingIrregular.ReadOnly();
	   pgQE.chkStandingIrregular.ReadOnly();
	   pgQE.txtBPStandingSystolic.ReadOnly();
	   pgQE.txtBPStandingDiastolic.ReadOnly();
	   pgQE.txtBPSittingSystolic.ReadOnly();
	   pgQE.txtBPSittingDiastolic.ReadOnly();
	   pgQE.txtTemp.ReadOnly();
	   pgQE.ddlConciousness.ReadOnly();
	   pgQE.txtPainStanding.ReadOnly();
	   pgQE.txtPainSitting.ReadOnly();
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
	   // if hear rate empty, disable irregular checkbox
	   if (pgQE.txtHeartRateStanding.Value() === "" || pgQE.txtHeartRateSitting.Value()) {
		   pgQE.chkLyingIrregular.Disable();
		   pgQE.chkStandingIrregular.Disable();
		   pgQE.ddRythmLying.Disable();
		   pgQE.ddRythmStanding.Disable();
	   }
	   else {
		   pgQE.ddRythmLying.Enable();
		   pgQE.ddRythmStanding.Enable();
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

// Page 4 - update quick entry page with values from stored object (from column in Obs page)
function SetQuickEntryVals(valsObj, dpDate, dpTime) {
	
   pgQE.dpDate.Value(dpDate);
   pgQE.dpTime.Value(dpTime);
   pgQE.txtResp.Value(valsObj.respiratory);
   pgQE.txtSaturation.Value(valsObj.saturation);
   pgQE.txtFlowRate.Value(valsObj.flowRate);
   pgQE.txtHeartRateStanding.Value(valsObj.heartRateStanding);
   pgQE.txtHeartRateSitting.Value(valsObj.heartRateSitting);   
   pgQE.ddRythmLying.Value(ConvertRythmToInitial(valsObj.rythmLying, false));
   pgQE.ddRythmStanding.Value(ConvertRythmToInitial(valsObj.rythmStanding, false));
   pgQE.chkLyingIrregular.Value(valsObj.lyingIrregularPulseRate);
   pgQE.chkStandingIrregular.Value(valsObj.standingIrregularPulseRate);
   pgQE.txtBPStandingSystolic.Value(valsObj.bpStandingSystolic);
   pgQE.txtBPStandingDiastolic.Value(valsObj.bpStandingDiastolic);
   pgQE.txtBPSittingSystolic.Value(valsObj.bpSittingSystolic);
   pgQE.txtBPSittingDiastolic.Value(valsObj.bpSittingDiastolic);
   pgQE.txtTemp.Value(valsObj.temperature);
   pgQE.ddlConciousness.Value(ConvertConsciousnessToNum(valsObj.conciousness, false));
   pgQE.txtPainStanding.Value(valsObj.painStanding);
   pgQE.txtPainSitting.Value(valsObj.painSitting);
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
			case "Unresponsive" :
			   val = 0;
		   	break;

		  	case "To Pain" :
			   val = 1;
		   	break;

		   	case "To Voice" :
			   val = 2;
		   	break;

		   	case "Alert" :
			   val = 3;
		   	break;
	   }
   }
   else
   {
	   switch (reference)
	   {
		   case 0 :
			   val = "Unresponsive";
		   break;

		   case 1 :
			   val = "To Pain";
		   break;

		   case 2 :
			   val = "To Voice";
		   break;

		   case 3 :
			   val = "Alert";
		   break;	
	   }
   }

   return val;
}

// Page 4 - Obs Chart - function to check if column is editable
function CheckIfObsColumnIsEditable(pg, colIndex) {
   if (pg.txtValues[colIndex].Value() !== "") {
	   var obsColValues = JSON.parse(pg.txtValues[colIndex].Value());
	   return obsColValues.canEdit;
   }
   else {
	   return true;
   }
}

// Page 4 - Launch Escalation/Modification Popup
// creates all escalations and modifcation notifications for the most recent obs column
function CreateEscalationModificationPopup() {
  
  var withMods = false;		
  // check modifications if signed  
  for (var a = 0; a < NUM_MOD_REPS; a++) {
	  if (pgModsNext.authNurse1[a].Value()){
		  withMods = true;
		  break;
	  }
  }

   // if warning or unstruck modification needed
   if (warningColours.purple || warningColours.pink || warningColours.yellow || warningColours.salmon || withMods) {
	   warningPopupObj = {};
	   var modsPanelWidth = "350";
	   var modsPanelHeight = "235";

	   // panels
	   warningPopupObj.panBG = CreateDynamicPanel(pgObsCurrent, OBS_WIDTH, OBS_HEIGHT, false, COLOURS.TRANSPARENT);
	   warningPopupObj.panPopup = CreateDynamicPanel(pgObsCurrent, modsPanelWidth, modsPanelHeight, false, COLOURS.TRANSPARENT, warningPopupObj.panBG);

	   var yPos = null;			

		// add modifications if theres active mods on page 2
		if (withMods) {			
			yPos = ShowModifications(yPos);
		}

		// show warning message if pain is severe on page 3
		if (showPainPopup) {
			yPos = ShowPainWarning(yPos);
		}
		
		// if any shaded area warning needed
		if (warningColours.purple || warningColours.pink || warningColours.yellow || warningColours.salmon) {
			// create escalation popup if needed
			yPos = ShowEscalations(yPos);
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

// Page 4 - function to display message listing latest Modifications as defined on the Mods page
function ShowModifications(yPos) {
   if (yPos === null) {
	   yPos = 10;
   } 

	warningPopupObj.panModifications = CreateDynamicPanel(pgObsCurrent, "290", "110", true, CUSTOMCOLOURS.POPUP_ORANGE, warningPopupObj.panPopup);
	warningPopupObj.lblModification = CreateDynamicLabel(pgObsCurrent, "5,10", "280", "120", "Center", MODS_WARNING_MESSAGE, warningPopupObj.panModifications);
	warningPopupObj.panModifications.Attribute(Vitro.CONTROL.Position, "0," + yPos);
	
	warningPopupObj.lblModification.Attribute(Vitro.CONTROL.FontStyle, "Italic");	
	warningPopupObj.lblModification.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);

   yPos += parseInt(warningPopupObj.panModifications.Attribute(Vitro.CONTROL.Height), 10) + 5;

   return yPos;
}

// Page 4 - create warning popup showing colour images
function ShowEscalations(yPos) {
   if (yPos === null) {
	   yPos = 10;
   }   
	   
	// create warning popups
	warningPopupObj.imgEsc = CreateDynamicPanel(pgObsCurrent, "290", "140", true, CUSTOMCOLOURS.POPUP_LIGHTPURPLE, warningPopupObj.panPopup);
	warningPopupObj.lblEsc = CreateDynamicLabel(pgObsCurrent, "5, 10", "280", "130", "Center", ESC_WARNING_MESSAGE, warningPopupObj.imgEsc);		
	warningPopupObj.imgEsc.Attribute(Vitro.CONTROL.Position, "0," + yPos);  

	warningPopupObj.lblEsc.Attribute(Vitro.CONTROL.FontStyle, "Italic");	  
	warningPopupObj.lblEsc.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);
	   
	yPos += parseInt(warningPopupObj.imgEsc.Attribute(Vitro.CONTROL.Height), 10) + 5;

	 //  EnableDisableActionButtons(false);

   return yPos;
}

// Page 4 - create warning popup showing pain message
function ShowPainWarning(yPos) {
   if (yPos === null) {
	   yPos = 10;
   }   
     
	// create warning popups
	warningPopupObj.imgPain = CreateDynamicPanel(pgObsCurrent, "290", "140", true, CUSTOMCOLOURS.POPUP_YELLOW, warningPopupObj.panPopup);
	warningPopupObj.lblPain = CreateDynamicLabel(pgObsCurrent, "5, 15", "280", "130", "Center", PAIN_WARNING_MESSAGE, warningPopupObj.imgPain);		
	warningPopupObj.imgPain.Attribute(Vitro.CONTROL.Position, "0," + yPos);

	warningPopupObj.lblPain.Attribute(Vitro.CONTROL.FontStyle, "Italic");	  
	warningPopupObj.lblPain.Attribute(Vitro.CONTROL.FontFamily, POPUP_CHARTS_FONTFAMILY);
	   
	yPos += parseInt(warningPopupObj.imgPain.Attribute(Vitro.CONTROL.Height), 10) + 5;

	//  EnableDisableActionButtons(false);

   return yPos;
}

// Page 4 - Escalation / Modification Popup - “Ok” Button - Click
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
   if (ctrl != null) {
		pgEsc.Activate();
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
	showPainPopup = false;
}

// Page 4 - function to close the warning popup
function CloseWarningPopup() {
   ClosePopup();
   // destroy popup
   if (warningPopupObj !== null) {
	   pgObsCurrent.DestroyControl(warningPopupObj.panBG);
   }
   warningPopupObj = null;
}

// Page 4 - Compute Total Mews
function ComputeTotalMEWS(index) {
       
	var total = 0; 	
	
	if (pgObsCurrent.txtRespiratoryScore[index].Value() != "" && !isNaN(pgObsCurrent.txtRespiratoryScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtRespiratoryScore[index].Value());
	}
	
	if (pgObsCurrent.txtO2SaturationScore[index].Value() != "" && !isNaN(pgObsCurrent.txtO2SaturationScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtO2SaturationScore[index].Value());
	}
	
	if (pgObsCurrent.txtO2FlowRateScore[index].Value() != "" && !isNaN(pgObsCurrent.txtO2FlowRateScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtO2FlowRateScore[index].Value());
	}

	if (pgObsCurrent.txtSystolicBPScore[index].Value() != "" && !isNaN(pgObsCurrent.txtSystolicBPScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtSystolicBPScore[index].Value());
	}

	if (pgObsCurrent.txtHeartRateScore[index].Value() != "" && !isNaN(pgObsCurrent.txtHeartRateScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtHeartRateScore[index].Value());
	}
	
	if (pgObsCurrent.txtTemperatureScore[index].Value() != "" && !isNaN(pgObsCurrent.txtTemperatureScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtTemperatureScore[index].Value());
	}
	
	if (pgObsCurrent.txtConciousnessScore[index].Value() != "" && !isNaN(pgObsCurrent.txtConciousnessScore[index].Value()))
	{		
		total += parseFloat(pgObsCurrent.txtConciousnessScore[index].Value());
	}
	
	// Set BGcolor for total ADDS score as per appendix
	var totalADDSCtrl = pgObsCurrent.txtADDSTotalScore[index];

	if (total >= 1 && total <= 3) {
		totalADDSCtrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	} else if (total >= 4 && total <= 5) {
		totalADDSCtrl.Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_YELLOW, true);
	} else if (total >= 6 && total <= 7) {
		totalADDSCtrl.Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTSALMON, true);
	} else if (total >= 8) {
		totalADDSCtrl.Attribute(Vitro.CONTROL.BackgroundColour, CUSTOMCOLOURS.SOLID_LIGHTPINK, true);
	} else {
		totalADDSCtrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	}	
	
	totalADDSCtrl.Value(total);	
	
 }
 
function ClearTotalMewsScore(index) {
	
	pgObsCurrent.txtRespiratoryScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtO2SaturationScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtO2FlowRateScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtSystolicBPScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtHeartRateScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtTemperatureScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtConciousnessScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	pgObsCurrent.txtADDSTotalScore[index].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
	
}

// -------------------------------------------- Page 4 Obs End --------------------------------------------------//

// -------------------------------------------- Page 3 interv Start --------------------------------------------------//

 // Page 3 - Date change
 function dpDate_Change(pg, ctrl, oldValue, newValue) {
	Vitro.Elements.DateTimeValidate(ctrl, newValue, COLOURS.TRANSPARENT, null, ctrl);
 }

// Page 3 - Other Obs Page - Section 4, Bowels open TextBoxes - Click
function BowelsClick(pg, ctrl, xlocation, ylocation) {
	
	var index = GetRepeaterIndex(ctrl);
	var otherObsControls = GetOtherObsControls(pg, index);
	// If the column is a previous OR current column
	// AND If the date on the column is blank or the current day
	//if (index <= bowelIndex && (pg.dpBowelsDate[index].Value() === "" || pg.dpBowelsDate[index].Value() === curDate.ddMM)) {
		// update date and time when control has been updated if there is no value
		if (pg.dpBloodGlucoseDate[index].Value() === "") {		
			pg.dpBloodGlucoseDate[index].Value(new Date()).Writeable();			
			pg.dpBloodGlucoseTime[index].Value(new Date()).Writeable();		
		}
		// SetBowels(pg, index);
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

			if (Vitro.Elements.GetControlDetails(otherObsControls).AllCleared) {
				pg.dpBloodGlucoseDate[index].Value("");		
				pg.dpBloodGlucoseTime[index].Value("");		
				// enable Bowel Textbox on the column
				pg.txtBowels[index].Enable();
				ChangeBG(otherObsControls, COLOURS.TRANS_BLUE, false);
				ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANS_BLUE, false);	
			}
			
		} 
		else {
			ChangeBG(otherObsControls, COLOURS.TRANSPARENT, false);
			ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANSPARENT, false);
			CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_LIGHTGREEN, BOWELS_WARNING_MESSAGE);
		}
		

 }
 
 // Page 3 - Other Obs Page - Section 4, Additional Observations - Change
 function AdditObsChange(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);
	var otherObsControls = GetOtherObsControls(pg, index);
	// update date and time when control has been updated if there is no value
	if (newValue) {
		
		if (pg.dpBloodGlucoseDate[index].Value() === "" && pg.dpBloodGlucoseTime[index].Value() === "") {	
			pg.dpBloodGlucoseDate[index].Value(new Date());
			pg.dpBloodGlucoseTime[index].Value(new Date());
			
		}
		ChangeBG(otherObsControls, COLOURS.TRANSPARENT, false);
		ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANSPARENT, false);
		
	}

	// SetBowels(pg, index);
 
	// if new value is empty
	if (newValue === "") {
		var otherObsControls = GetOtherObsControls(pg, index);
		// if the column contains no data in all fields, clear date and time fields
		if (Vitro.Elements.GetControlDetails(otherObsControls).AllCleared) {
			pg.dpBloodGlucoseDate[index].Value("");
			pg.dpBloodGlucoseTime[index].Value("");		
			ChangeBG(otherObsControls, COLOURS.TRANS_BLUE, false);	
			ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANS_BLUE, false);			
		}
	}
 }

  // Page 3 - BGL textbox - Change
  function txtBGL_Change(pg, ctrl, oldValue, newValue) {
	
	var index = GetRepeaterIndex(ctrl);
	var otherObsControls = GetOtherObsControls(pg, index);

	if (newValue) {
		pg.dpBloodGlucoseDate[index].Value(new Date()).Writeable();
		pg.dpBloodGlucoseTime[index].Value(new Date()).Writeable();
		ChangeBG(otherObsControls, COLOURS.TRANSPARENT, false);		
		ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANSPARENT, false);

		if (ctrl.Properties.ID().indexOf("txtBGL") != -1) {
			// create dynamic popup warning for blood glucose or weight			
			CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_LIGHTBLUE, BGL_WARNING_MESSAGE);	
		}	
		else {
			CreateOtherObsPopup(pg, CUSTOMCOLOURS.POPUP_LIGHTGREEN, BOWELS_WARNING_MESSAGE);
		}				
		
	}
	else {
	
		if (Vitro.Elements.GetControlDetails(otherObsControls).AllCleared) {
			pg.dpBloodGlucoseDate[index].Value("");		
			pg.dpBloodGlucoseTime[index].Value("");		
			// enable Bowel Textbox on the column
			pg.txtBowels[index].Enable();		
			ChangeBG(otherObsControls, COLOURS.TRANS_BLUE, false);
			ChangeBG(pg.repBloodGlucose[index].Properties.Children(), COLOURS.TRANS_BLUE, false);			
		}
	}
 } 

 // Page 3 - Clinic ctrla - Change
 function ClinicCtrls_Change(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);

	if (newValue) {
		pg.dpReviewDate[index].Value(new Date());
		pg.dpReviewTime[index].Value(new Date());
		pg.authClinicalReview[index].Enable();
		ChangeBG(pg.repClinicalReview[index].Properties.Children(), COLOURS.TRANSPARENT, false);		
	}

	// if new value is empty
	if (newValue === "") {
		var clinicControls = GetClinicalControls(pg, index);
		// if the column contains no data in all fields, clear date and time fields
		if (Vitro.Elements.GetControlDetails(clinicControls).AllCleared) {
			pg.dpReviewDate[index].Value("");
			pg.dpReviewTime[index].Value("");
			pg.authClinicalReview[index].Disable();
			ChangeBG(clinicControls, COLOURS.TRANS_BLUE, false);
		}
	}	
} 

 // Page 3 - clinical review sign - Change
 function authClinicalReview_Change(pg, ctrl, oldValue, newValue) {
	var index = GetRepeaterIndex(ctrl);

	if (newValue) {
		pg.Controls("dpReviewDate[" + index + "]", "dpReviewTime[" + index + "]", "txtReason[" + index + "]").Each.ReadOnly(true);
		newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).Details;
		ctrl.Value(newValue);	
		ctrl.ReadOnly(true);	
	} 
	else {
		pg.Controls("dpReviewDate[" + index + "]", "dpReviewTime[" + index + "]", "txtReason[" + index + "]").Each.Writeable(false);
	}

} 

// Page 3 - Create Other Obs Dynamic Popup
 function CreateOtherObsPopup(pg, popupColor, popupMessage) {
	
	// Always check the popupobj if not null
	// destroy popup so no overlapping of dynamic popups
	if (otherObsPopupObj !== null) {
		ClosePopup();
		pg.DestroyControl(otherObsPopupObj.panBG);
	}
	otherObsPopupObj = null;
	EnableDisableActionButtons(true);

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
		otherObsPopupObj.panBGLMessage = CreateDynamicPanel(pg, "290", "230", true, popupColor, otherObsPopupObj.panPopup);
		otherObsPopupObj.lblBGLMessage = CreateDynamicLabel(pg, "5,10" , "280", "220", "Center", popupMessage, otherObsPopupObj.panBGLMessage);
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
		evScroll: pgIntervNext.Events.Scrolled(PositionOtherPopup),
		evZoom: pgIntervNext.Events.Zoomed(PositionOtherPopup),
		evResize: Vitro.Events.Resized(PositionOtherPopup)
	};

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

 

// -------------------------------------------- Page 3 interv End --------------------------------------------------//

// -------------------------------------------- Page 2 Mods Start --------------------------------------------------//

// Page 2 - Mods Page - Section 3 – clinical TextBoxes - Change
function ModsChange(pg, ctrl, oldValue, newValue) {
	
   var index = GetRepeaterIndex(ctrl);
   // check if any controls have a value
   var enableSign = false;
   GetModControls(pg, index).Iterate(function (ctrl) {
	
	   if (ctrl.Value() !== "") {			
		   enableSign = true;
	   }
	   
   });

   // if any have values, enable signatures
   if (enableSign) {
	   ChangeBG(pg.repMods[index], COLOURS.TRANSPARENT, false);
	
	   pg.authNurse1[index].Enable().Required();	
	   // set previous column signature readonly persist
	   if (index !== 0) {
		   pg.authNurse1[index - 1].ReadOnly(true);		  
	   }

   }
   // if none filled, disable signatures
   else {
	   ChangeBG(pg.repMods[index], COLOURS.TRANS_BLUE, false);
	   pg.authNurse1[index].Disable().NotRequired();	 	

	   // set previous column signature writeable
	   if (index !== 0) {
		   pg.authNurse1[index - 1].Writeable(true);		  
	   }

   }
}

// Page 2 - Mods Page - Section 3 - Doctor’s Name textbox - Change
function DocNameChange(pg, ctrl, oldValue, newValue) {
   var index = GetRepeaterIndex(ctrl);
   // if user enters doctor name, enable nurse 2
   if (newValue !== "") {
	   Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
   }
   else {
	   Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
   }
}

// Page 2 - Section 2 Frequency Sign 1 - Change
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
		

	}
 }

// Page 2 - Mods - STK button for signed columns
function CreateModsSTKButtons(page) {

		   // check if current user is in super user group
	var isModsUser = false;
	for (var j = 0; j < page2ModsUserGroups.length; j++) {
		if (Vitro.Users().InGroup(page2ModsUserGroups[j])) {
		   isModsUser = true;
		   break;
		}
	}

   for (var i = 0; i < NUM_MOD_REPS; i++)
   {
		// Frequency - if doctor signature or nurse signature is signed and not already struck, create STK
	//    if ((page.authSignature[i].Value() !== "") && page.txtStrike1[i].Properties.IsVisible() === false) {		
	//    		CreateObsDynamicStrike(page, page.rptFrequency[i], page.txtStrike1[i], page.txtStrikeInitials[i], true);	
	//    }	
	   
	   if ((page.authNurse1[i].Value() !== "") && page.txtStrike2[i].Properties.IsVisible() === false) {		 
			CreateObsDynamicStrike(page, page.repMods[i], page.txtStrike2[i], page.txtStrikeInitials2[i], true);		   
	   }
   }
}

// when user signs modification, set previous as readonly, name page and check if overflow is needed
function SetupModsPage(pg, index) {

   // if previous column on different page, set all columns on page as readonly
   if (pgModsPrevious !== pgModsNext && index === 0) {
	   for (var i = 0; i < NUM_MOD_REPS; i++) {
		   if (pgModsPrevious.authNurse1[i].Value() !== "") {
				pgModsPrevious.repMods[i].ReadOnly(true);
			// ChangeBG(pgModsPrevious.repMods[i], CUSTOMCOLOURS.SOLID_LIGHTGREY, true);
		   }
	   }
   }
   // store page
   pgModsPrevious = pg;
   // if page still default name, set with date
   if (pg.Title() === PAGE_NAME_MODS) {
	   pg.Title(PAGE_NAME_MODS + " " + Vitro.Elements.GetDateString().ddMM);
   }
  
}

// Page 2 - Section 2 - setup next available mods column for data entry
function SetupNextFreqCol(pg) {
	
   for (var i = 0; i < NUM_FREQUENCY_REPS; i++) {
	   if (pg.authSignature[i].Value() === "") {
		   freqIndex = i;
		   break;
	   }
   }
   // if free row on page, set as editable, highlight next row 
   if (freqIndex !== null) {	   
	
		pg.Controls("ddObsFrequency[" + freqIndex + "]", "txtRationale[" + freqIndex + "]").Each.Writeable(false);	   	
	    ChangeBG(pg.Controls("ddObsFrequency[" + freqIndex + "]", "txtRationale[" + freqIndex + "]"), COLOURS.TRANS_BLUE, false);
		pg.Control("ddObsFrequency[" + freqIndex + "]").Attribute(Vitro.DROPDOWN.TextAlignment, "Center", true);
		
   }
}

// Page 2 - Set events on frequency
function SetFrequencyEvents(pg) {

	for (var i = 0; i < NUM_FREQUENCY_REPS; i++) {	 
		pg.ddObsFrequency[i].Events.Change(Frequency_Change);
		pg.txtRationale[i].Events.Change(Frequency_Change);
		pg.authSignature[i].Events.Change(authSignature_Change);
	}
 
 }

 
// Page 2 - Section 2 Frequency textbox - Change
function Frequency_Change(pg, ctrl, oldVal, newVal) {
	
	var index = GetRepeaterIndex(ctrl);
	
	if (newVal != "") {
		ChangeBG(pg.rptFrequency[index].Properties.Children(), COLOURS.TRANSPARENT, false);
		pg.dpFrequencyDate[index].Value(new Date());
		pg.dpFrequencyTime[index].Value(new Date());
		pg.ddObsFrequency[index].Required();

		if (pg.ddObsFrequency[index].Value() && pg.txtRationale[index].Value()) {
			pg.authSignature[index].Enable().Required().Writeable(false);
		}	

		// set previous column signature readonly persist
		if (index !== 0) {
			pg.authSignature[index - 1].ReadOnly(true);
		}
		// set previous column signature readonly persist if exists on previous page
		else if (index === 0 && pgIntervPrevious !== pgIntervNext) {
			pgModsPrevious.authSignature[NUM_FREQUENCY_REPS - 1].ReadOnly(true);
		}
	}
	else {
		ChangeBG(pg.Controls("ddObsFrequency[" + freqIndex + "]", "txtRationale[" + freqIndex + "]"), COLOURS.TRANS_BLUE, false);
		pg.authSignature[index].Disable().NotRequired();					
		// set previous column signature writeable
		if (index !== 0) {
			pg.authSignature[index - 1].Writeable(true);
		}
		// set previous column signature writable if exists on previous page
		else if (index === 0 && pgModsPrevious!== pgModsNext) {
			pgModsPrevious.authSignature[NUM_FREQUENCY_REPS - 1].Writeable(false);
		}
	}
}

// Page 2 - Section 2 Frequency Sign - Change
function authSignature_Change(pg, ctrl, oldVal, newVal) {
	
	var index = GetRepeaterIndex(ctrl);

	if (newVal) {
		pg.Controls("ddObsFrequency[" + index + "]", "txtRationale[" + index + "]").Each.ReadOnly(true);	
		pg.dpReviewDate[index].Writeable(false);				
		newVal.SignStamp = Vitro.Elements.GetUserDetails(newVal.SignerDetails).SignatureStamp;
		ctrl.Value(newVal);
		SetupNextFreqCol(pg);
		ChangeBG(pg.Controls("ddObsFrequency[" + index + "]", "txtRationale[" + index + "]"), COLOURS.TRANSPARENT, false);
				
		if (interventionIndex !== null) {
			pgIntervNext.txtNotes[interventionIndex].Required();
			Vitro.Elements.SetControlHighlight(pgIntervNext.txtNotes[interventionIndex]);
		}
	} else {
		pg.Controls("ddObsFrequency[" + index + "]", "txtRationale[" + index + "]").Each.Writeable(false);	 
		pg.dpReviewDate[index].ReadOnly().Value("");
		ChangeBG(pg.Controls("ddObsFrequency[" + index + "]", "txtRationale[" + index + "]"), COLOURS.TRANS_BLUE, false);
		
		if (index > 0 && index < NUM_FREQUENCY_REPS) {
			
			ChangeBG(pg.rptFrequency[index + 1].Properties.Children(), COLOURS.TRANSPARENT, false);
		}
	}
}

// Page 2 - Section 3 - setup next available ACC clinical review column for data entry
function SetupNextModCol(pg) {
	
	for (var i = 0; i < NUM_MOD_REPS; i++) {
		if (pg.dpModsDate[i].Value() === "") {
			modsIndex = i;
			break;
		}
	}
	// if free row on page, set as editable
	if (modsIndex !== null) {	 
		GetModControls(pg, modsIndex).Each.Writeable(false); 
		pg.authNurse1[modsIndex].Writeable(false);	 		 
		ChangeBG(pg.repMods[modsIndex], COLOURS.TRANS_BLUE, false);

		GetModControls(pg, modsIndex).Each.Events.Change(ModsChange);

		pg.authNurse1[modsIndex].Events.Change(function(pg, ctrl, oldValue, newValue) {
			var index = GetRepeaterIndex(ctrl);
			if (newValue){
				pg.txtDocName[index].Enable().Writeable();							
				pg.txtDocName[index].Value(Vitro.Elements.GetUserDetails(newValue.SignerDetails).Fullname);
				Vitro.Elements.SetControlHighlight(pg.txtDocName[index]);
				newValue.SignStamp = Vitro.Elements.GetUserDetails(newValue.SignerDetails).Fullname;
				ctrl.Value(newValue);

				pg.dpModsDate[index].Value(new Date());
				pg.dpModsTime[index].Value(new Date());		
				
				GetModControls(pg, index).Each.ReadOnly(true);
				modsIndex = null;
				SetupNextModCol(pg);
				
				SetupModsPage(pg, index);
				if (interventionIndex !== null) {
					pgIntervNext.txtNotes[interventionIndex].Required();
					Vitro.Elements.SetControlHighlight(pgIntervNext.txtNotes[interventionIndex]);
				}
			}
			else {
				pg.txtDocName[index].Value("").NotRequired().ReadOnly();
				ChangeBG(pg.txtDocName[index], COLOURS.TRANSPARENT);
				GetModControls(pg, index).Each.Writeable();
				pg.dpModsDate[index].Value("");
				pg.dpModsTime[index].Value("");		
			}
			
	   });
	}
 }

// Page 2 - Section 3 - function to get the current Mods Column and mark previous column inactive
function GetCurrentMod() { 
	
   var curDate = new Date();
   var prevModIndex = null;
   var sigDate;
   var hourDiff;
   for (var i = 0; i < NUM_MOD_REPS; i++) {
	   if (pgModsNext.authNurse1[i].Value() !== "") {
		   prevModIndex = i;
	   }
   }
   if (prevModIndex !== null) {
	   var sigVal = pgModsPrevious.authNurse1[prevModIndex].Value();	
	   if (sigVal !== "") {
		   sigDate = Vitro.Elements.ParseStringToDate(sigVal.SignDate);
		   hourDiff = Math.abs(curDate.getTime() - sigDate.getTime()) / 3600000;
		   if (hourDiff < 72) {
			   // if previous column has not been struck through
			   if (pgModsPrevious.txtStrikeInitials2[prevModIndex].Value() === "") {
				   ChangeBG(pgModsPrevious.repMods[prevModIndex], COLOURS.TRANSPARENT, true);
			   }
			   return prevModIndex;
		   }
	   }

   }
   return null;
}

// Page 2 - Section 2 - function to copy all section to values to latest Mods page
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
// -------------------------------------------- Page 2 Mods End --------------------------------------------------//

// -------------------------------------------- Page 3 Interv Start --------------------------------------------------//
// Page 3 - events on intervention + other obs page
function SetInterventionEvents(pg) {

   for (var i = 0; i < NUM_INT_REPS; i++) {	 
	   pg.txtNotes[i].Events.Change(InterventionChange);
	   pg.authIntervention[i].Events.Change(InterventionSign);
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

// Page 3 - Interv. – Section 2 - Document in Case Notes TextBox - Change
function InterventionChange(pg, ctrl, oldvalue, newvalue) {
   var index = GetRepeaterIndex(ctrl);   
   // enable the Initials Authorisation and make required
   if (newvalue !== "") {
		pg.authIntervention[index].Enable().Required();
		pg.dpInterventionDate[index].Value(new Date());
		pg.dpInterventionTime[index].Value(new Date());
		ChangeBG(pg.dpInterventionDate[index], COLOURS.TRANSPARENT, true);
		ChangeBG(pg.dpInterventionTime[index], COLOURS.TRANSPARENT, true);
	   // Validate control
	   pg.txtNotes[index].Invalidate("", true);
	   pg.txtNotes[index].Validate();
	   pg.txtNotes[index].Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);			
	   ChangeBG(pg.txtNotes[index], COLOURS.TRANSPARENT, true);
	   ChangeBG(pg.authIntervention[index], COLOURS.TRANSPARENT, true);	

	   
   // disable the Initials Authorisation and make not required
   } else {
	   pg.authIntervention[index].Disable().NotRequired();
	   pg.dpInterventionDate[index].Value("");
	   pg.dpInterventionTime[index].Value("");

	   ChangeBG(pg.dpInterventionDate[interventionIndex], COLOURS.TRANS_BLUE, false);
	   ChangeBG(pg.dpInterventionTime[interventionIndex], COLOURS.TRANS_BLUE, false);			
	   ChangeBG(pg.txtNotes[interventionIndex], COLOURS.TRANS_BLUE, false);
	   ChangeBG(pg.authIntervention[interventionIndex], COLOURS.TRANS_BLUE, false);		
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
	   Vitro.Elements.SetupDynamicStrike(page, page.repInterventions[i], page.authIntervention[i], page.txtStrike1[i], page.txtStrikeInitials[i]);
   }

}

function CreateClinicSTKButtons(page) {
	// setup strike for Intervention with Abnormal Vitals section
	for (var i = 0; i < NUM_CLINIC_REPS; i++) {
		Vitro.Elements.SetupDynamicStrike(page, page.repClinicalReview[i], page.authClinicalReview[i], page.txtStrike2[i], page.txtStrikeInitials2[i]);
	}
 
 }

// Page 4 - Section 3 and 4 - create strike button and set event
function CreateObsDynamicStrike(page, panelCtrl, strikeCtrl, strikeInitialsCtrl, willBeHighlighted) {
   // Creates strike buttons for signed authorisation controls.
   // When strike button is clicked callback function is called.
   // Strike control is shown and populated and strike button is destroyed.
   var btnStk = null;
   var init = Vitro.Users().Property(Vitro.USER.FirstName).charAt(0) + Vitro.Users().Property(Vitro.USER.LastName).charAt(0);
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
	 
   });
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
		   if (pgIntervNext.dpInterventionDate[i].Value() !== "" && pgIntervNext.txtStrikeInitials[i].Value() === "") {
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
	   progNotesPopupObj.lblMessge1 = CreateDynamicLabel(pgQE, "10, 10", "320", "60", "Left", message, progNotesPopupObj.panPopup);
	   message = "Do you want to copy the last intervention in the progress notes?";
	   progNotesPopupObj.lblMessge2 = CreateDynamicLabel(pgQE, "10, 40", "320", "60", "Left", message, progNotesPopupObj.panPopup);

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
	   if (pgIntervNext.dpInterventionDate[i].Value() !== ""  && pgIntervNext.txtStrikeInitials[i].Value() === "") {
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
	var scrollY = pgIntervNext.Properties.ScrollY();
	var zoom = pgIntervNext.Properties.Zoom();
 
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

 // If labels click event
function ApplinkClick(pg, ctrl) {

	var patID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID), 10);	   
	var epID = (myApp.Activity.Properties.Episode(Vitro.EPISODE.ID) === "") ? 0 : parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID), 10);
	var appID = "";	
	var curAct = null;   
	
	appID = Vitro.Workflow.GetApp(CTRL_LINK_APPS[ctrl.Properties.ID()]);	
	
	Vitro.Workflow.GetActivities(patID, epID, appID, Vitro.STATUS.Submitted, function(foundActs) {
		
		// if any activity found, get most recent
		if (foundActs.length > 0) {
			curAct = foundActs[foundActs.length - 1];
			OpenActInNewTab(curAct.Id);

		}
	});
}

// Load apps via odata
function LoadAppsOdataLinkArray() {
	
	var patID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID), 10);	   
	var epID = (myApp.Activity.Properties.Episode(Vitro.EPISODE.ID) === "") ? 0 : parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID), 10);	

	for (var i = 0; i < APPLIST_TO_HYPERLINK.length; i++) {
		GetActivityResultsViaOData(APPLIST_TO_HYPERLINK[i], 1, patID, epID, true, false, false);
	}	

}

function SetLabelsToLink() {
	
	hyperlinkCtrls.Iterate(function(ctrl) {
					
		// if activity Ids are found in array after Odata request iterating controls in order of apps to set as hyperlink					
		if (arrHyperlinkActIDResults.length > 0) {

			for (var i = 0; i < arrHyperlinkActIDResults.length; i++) {
				if (arrHyperlinkActIDResults[i].AppName == CTRL_LINK_APPS[ctrl.Properties.ID()]) {
					ctrl.Enable();
					ctrl.Attribute(Vitro.LABEL.TextColour, CUSTOMCOLOURS.SOLID_BLUE, false);		
					ctrl.Events.Click(ApplinkClick);
				}
			}
		}


	});
}

function OpenActInNewTab(activityId, appName, patMRN, orgID, episodeNum) {
	// get url path
	var path = window.location.href.replace(window.location.hash, "");
	path = path.substr(0, path.lastIndexOf("/") + 1);
	// create token
	var token = Vitro.Workflow.GetToken(Vitro.Users().Property(Vitro.USER.Name));
	var intURL = path + "/Default.aspx?auth=" + token;
	// add app/activity info to url
	var wStr = intURL;
	// if an activity id has been provided
	if (activityId !== null && activityId !== undefined && activityId !== 0 && activityId !== "") {
		wStr += "&Activity=Open";
		wStr += "&activityid=" + activityId;
	}// if an app name has been provided
	else if (appName !== "" && patMRN !== "" && orgID !== "") {
		wStr += "&Activity=New&app=" + appName;
		wStr += "&patient=" + patMRN;
		wStr += "&organisation=" + orgID;
		if (episodeNum && episodeNum !== "") {
			wStr += "&episode=" + episodeNum;
		}
	}
	// if activity info has been added to the url, open it
	if (wStr !== intURL) {
		wStr += "&display=apphost";
		wStr += "&OnExit=Close";
		wStr = encodeURI(wStr);
		// return window object
		return window.open(wStr);
	}
	// return null if window not opened
	return null;
}

// Get activities for patient episode via OData
function GetActivityResultsViaOData(appName, topNum, patID, epID, checkSubmittedStatus, checkSealedStatus, checkCeasedStatus) {
    
	// Get app id
    var appId = Vitro.Workflow.GetApp(appName);

	if (appId !== 0) {
		// odata query to get activities if they exist
			var query = OData.ALL_ACTIVITIES +
			// activities count limit
			OData.query.TOP +  topNum + "&" +
			// filter by app id
			OData.query.FILTER_BY + "AppId" + OData.logical.EQUALS + appId +
			// only for this patient
			OData.logical.AND + "PatientId" + OData.logical.EQUALS + patID +
			// only for this patient episode
			OData.logical.AND + "EpisodeId" + OData.logical.EQUALS + epID +
			// only for activities with status Submitted OR Sealed
			(checkSubmittedStatus === true && checkSealedStatus === true
				? OData.logical.AND + "(Status" + OData.logical.EQUALS + "'Submitted'" + OData.logical.OR + "Status" + OData.logical.EQUALS + "'Sealed')"
				: (checkSubmittedStatus === true && checkCeasedStatus === true
				? OData.logical.AND + "(Status" + OData.logical.EQUALS + "'Submitted'" + OData.logical.OR + "Extra" + OData.logical.EQUALS + "'Ceased')"
				: (checkSubmittedStatus === true
				? OData.logical.AND + "(Status" + OData.logical.EQUALS + "'Submitted')"
				: (checkSealedStatus === true
				? OData.logical.AND + "(Status" + OData.logical.EQUALS + "'Sealed')"
				: (checkCeasedStatus === true
				? OData.logical.AND + "(Extra" + OData.logical.EQUALS + "'Ceased')" : ""))))) +
			"&" +
			// order by control Id descending
			OData.query.ORDER_BY + "Id desc&" +
			// SELECT the following values
			OData.query.SELECT + "Id, AppName";
			 
			// send odata request for processing
		SendODataRequest(query, appName);   
	}
   
}

// function to get all valid entries via OData
function SendODataRequest(query, appName) {
    
    Vitro.Elements.OData.SendRequest(query, function (success, msg) {
		
		// if activity was closed when trying to process the query, exit this callback function
		if (myApp === null) { return; }

		if (success === true) {
			
            var response = JSON.parse(msg);
            var results = response.d;

			if (results[0] !== undefined) {
				arrHyperlinkActIDResults.push(results[0]); 
			}
          
        }
        else {
			
            Vitro.log(msg);
        }
    });
}