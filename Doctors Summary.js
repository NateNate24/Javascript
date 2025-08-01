Vitro.Version("2.7");

var myApp = Vitro.RegisterApp(appActivityId);
myApp.Events.Loaded(StartTheApp);
myApp.Events.Unload(myApp_Unload);
myApp.PageManager.Events.Displayed(SetZoom);

// Page variables
var pgObsChart = myApp.Page("pgObsChart");
var pgNeuro = myApp.Page("pgNeuro");
var pgVitals = myApp.Page("pgVitals");
var pgFluidSummary = myApp.Page("pgFluidSummary");
var pgFluidChart = myApp.Page("pgFluidChart");
var pgMedsChart = myApp.Page("pgMedsChart");
var pgWoundChart = myApp.Page("pgWoundChart");
var pgChestChart = myApp.Page("pgChestChart");

// Action Buttons  * Space for text formatting on button
var Obs_Chart = "Obs    Chart";
var Neuro_Chart = "Neuro Chart";
var Fluids_Chart = "Fluids Chart";
var Meds_Chart = "Meds Chart";
var Wound_Chart = "Wound Obs";
var Chest_Chart = "Chest Drain";

// Var's to get activities
var PatId = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));
var EpId = parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID));

// Gets the app actitivies
function Activities_Check(activityName) {
	var appID = Vitro.Workflow.GetApp(activityName);   
	return Vitro.Workflow.GetActivities(PatId, EpId, appID, Vitro.STATUS.Submitted);
}

var Obs_App_Name = "";
var Adult = "Adult Vital Sign Chart";
var Paedia12 = "Paediatric Vital Signs Chart 12 plus years";
var Paedia5 = "Paediatric Vital Signs Chart 5-11 years";
var Paedia1 = "Paediatric Vital Signs Chart 1-4 years";
var Paedia0 = "Paediatric Vital Signs Chart 0-11 months";
if (Activities_Check(Adult).length > 0) {
	Obs_App_Name = Adult;
}
else if (Activities_Check(Paedia12).length > 0) {
	Obs_App_Name = Paedia12;
}
else if (Activities_Check(Paedia5).length > 0) {
	Obs_App_Name = Paedia5;
}
else if (Activities_Check(Paedia1).length > 0) {
	Obs_App_Name = Paedia1;
}
else if (Activities_Check(Paedia0).length > 0) {
	Obs_App_Name = Paedia0;
}

var Neuro_App_Name = "Neurological Observation Chart";
var Fluid_App_Name = "Fluid Balance Chart (Daily Weight Chart)";
var Meds_App_Name = "Adult Medications Chart";
var Chest_App_Name = "Chest Drainage Chart";
var Wound_App_Name = "Wound Observation Chart";

var Observation_Page = "AdultObs";
var Neuro_Page = "NeuroObs";
var Vitals_Page = "VitalObs";
var Fluid_Summary_Page = "pg2";
var Fluid_Chart_Page = "pg3";
// To do needs to be defined when the meds app is created
var Medications_Chart_Page = "";
var Wound_Chart_Page = "pgChart";
var Chest_Chart_Page = "pgChart";

var Observation_Page_Height = "1123";
var Neuro_Obs_Page_Height = "1123";
var Vitals_Obs_Page_Height = "1123";
var Fluid_Summary_Page_Height = "794";
var Wound_Page_Height = "794";
var Chest_Page_Height = "1123";
var Medications_Chart_Page_Height = "1123";

// Get the App Ids
var Obs_App_Id = Vitro.Workflow.GetApp(Obs_App_Name);
var Neuro_Obs_App_Id = Vitro.Workflow.GetApp(Neuro_App_Name);
var Fluid_App_Id = Vitro.Workflow.GetApp(Fluid_App_Name);
var Meds_App_Id = Vitro.Workflow.GetApp(Meds_App_Name);
var Wound_App_Id = Vitro.Workflow.GetApp(Wound_App_Name);
var Chest_App_Id = Vitro.Workflow.GetApp(Chest_App_Name);

// Wait for the app to load then giddy up and go
function StartTheApp(){
	AppsToExport();
	myApp.Clean();
}

// Set the zoom for every page when displayed
function SetZoom(pg){
	var id = pg.Properties.ID();
	var height = "";
	var viewHeight = myApp.Properties.ViewHeight();
	if(id === pgObsChart.Properties.ID()){
		height = Observation_Page_Height;
    }
    else if(id === pgNeuro.Properties.ID()){
		height = Neuro_Obs_Page_Height;
    }
    else if(id === pgVitals.Properties.ID()){
		height = Vitals_Obs_Page_Height;
	}
	else if(id === pgFluidSummary.Properties.ID() ||  id === pgFluidChart.Properties.ID()){
		height = Fluid_Summary_Page_Height;
	}
	else if(id === pgMedsChart.Properties.ID()){
		height = Medications_Chart_Page_Height;
	}
	else if(id === pgWoundChart.Properties.ID()){
		height = Wound_Page_Height;
	}
	else if(id === pgChestChart.Properties.ID()){
		height = Chest_Page_Height;
	}

	pg.ZoomTo((viewHeight / height) * 0.95);
}

function AppsToExport(){
	new CreateAppExportObj(Obs_Chart, Obs_App_Name, GetActivity(Obs_App_Id));
	new CreateAppExportObj(Neuro_Chart, Neuro_App_Name, GetActivity(Neuro_Obs_App_Id));
	new CreateAppExportObj(Fluids_Chart, Fluid_App_Name, GetActivity(Fluid_App_Id));
	new CreateAppExportObj(Meds_Chart, Meds_App_Name, GetActivity(Meds_App_Id));
	new CreateAppExportObj(Wound_Chart, Wound_App_Name, GetActivity(Wound_App_Id));
	new CreateAppExportObj(Chest_Chart, Chest_App_Name, GetActivity(Chest_App_Id));
}

// Give me a populated object
function CreateAppExportObj(action, name, activity){
	if(activity !== null){
		this.actionName = action;
		this.appName = name;
		this.activity = activity;
		this.actId = activity.Id;
		this.pageIds = FindPages(this.appName, this.actId, this.activity.Deepen().ActivityPages());
		this.CustomAction = myApp.Custom(this.actionName);
		this.Action = myApp.Events.Action(function(){
						myApp.Existing(activity.Id);
						myApp.Action(Vitro.ACTIONS.ChangeApp);
                    }, action);
	}
	else{
		// if the activity is not found hide page
		if(name === Obs_App_Name){
			NextActive_Search(pgObsChart);
			pgObsChart.Hide();
        }
        else if(name === Neuro_App_Name){
			NextActive_Search(pgNeuro);
			pgNeuro.Hide();
			NextActive_Search(pgVitals);
			pgVitals.Hide();
		}
		else if(name === Fluid_App_Name){
			NextActive_Search(pgFluidSummary);
			pgFluidSummary.Hide();
			NextActive_Search(pgFluidChart);
			pgFluidChart.Hide();
		}
		else if(name === Meds_App_Name){
			NextActive_Search(pgMedsChart);
			pgMedsChart.Hide();
		}
		else if(name === Wound_App_Name){
			NextActive_Search(pgWoundChart);
			pgWoundChart.Hide();
		}
		else if(name === Chest_App_Name){
			NextActive_Search(pgChestChart);
			pgChestChart.Hide();
		}
	}
}

// Searches for 
function NextActive_Search(page) {
	var pgIds = myApp.Properties.PageIDs();
	for(var i = 0; i < pgIds.length; i++) {
		if (page.Properties.ID() != pgIds[i] && myApp.Page(pgIds[i]).Properties.IsVisible()) {
			myApp.Page(pgIds[i]).Activate();
			SetZoom(myApp.Page(pgIds[i]));
			break;
		}
	}
}

function FindPages(name, id, pages){
	// Observations Chart
	if(name === Obs_App_Name){
		// page 1 of obs to page 1
		SetValues(GetLatestPage(pages, id, Observation_Page), pgObsChart.Control("imgObsChart"));
    }
    // Neuro Obs
	else if(name === Neuro_App_Name){
		// page 3 of neuro obs to page 2
		SetValues(GetLatestPage(pages, id, Neuro_Page), pgNeuro.Control("imgNeuro"));
		// page 4 of neuro obs to page 3
		SetValues(GetLatestPage(pages, id, Vitals_Page), pgVitals.Control("imgVitals"));
	}
	// Fluid Balance
	else if(name === Fluid_App_Name){
		// page 1 of obs to page 4
		SetValues(GetLatestPage(pages, id, Fluid_Summary_Page), pgFluidSummary.Control("imgFluidBalanceSummary"));
		// page 2 of obs to page 5
		SetValues(GetLatestPage(pages, id, Fluid_Chart_Page), pgFluidChart.Control("imgFluidBalanceChart"));
	}
	// Medications Chart
	else if(name === Meds_App_Name){
		// page 1 of meds to page 6
		SetValues(GetLatestPage(pages, id, Medications_Chart_Page), pgMedsChart.Control("imgMedsChart"));
	}
	// Wound Chart
	else if(name === Wound_App_Name){
		// page 1 of meds to page 7
		SetValues(GetLatestPage(pages, id, Wound_Chart_Page), pgWoundChart.Control("imgWoundChart"));
	}
	// Chest Chart
	else if(name === Chest_App_Name){
		// page 1 of meds to page 8
		SetValues(GetLatestPage(pages, id, Chest_Chart_Page), pgChestChart.Control("imgChestChart"));
	}
}

function SetValues(base_64, ctrl){
	var val = {
        Base64: base_64,
        FileType: ".png",
        IsImageFromURI: false,
        IsImageUriPersisting: false
    };

	// set control
	ctrl.Value(val);
}

// Finds the latest page and returns base_64 string
function GetLatestPage(pages, id, pageName){
	for(var a in pages){
		// find the latest page for pageName
		if(a.indexOf(pageName) !== -1){
			return ExportPage(id, pages[a].Id);
		}
	}
}

// Get activity
function GetActivity(id){
	if(id !== 0){
		var activities = Vitro.Workflow.GetActivities(PatId, EpId, id, Vitro.STATUS.Submitted);
		if(activities.length > 0){
			return activities[0];
		}
		else{
			return null;
		}
	}
	else{
		return null;
	}
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
}

///////////////////////////// Import Pages ////////////////////////////////
// Using integration to export pages
// Make the default URL for web service requests to W/F
var vwfurl = window.location.protocol.toString() + "//" + window.location.hostname.toString();
if (window.location.port != "")
    vwfurl += ":" + window.location.port.toString() + "/";

vwfurl += window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/" +
    "Services/IntegrationService.svc/web/";

function ExportPage(activityId, pageId, callback) {
    var async = (typeof callback === "function");
    // name parameter has to be valid
    if (typeof activityId !== "number" || typeof pageId !== "number") {
        Vitro.Log("ExportPage - Parameters are not valid");
        return null;
    }
    // Should return an Organisation object or null on error
    return ExecuteResponseCallback("ExportPage", {
        "activityId": activityId,
        "pageId": pageId
    }, async, function(ret) {
        if (async) callback(ret);
        else return ret;
    });
}

// Internal to workflow module
// Send request and callback response
// Request and response are converted to/from JSON
function ExecuteResponseCallback(url, params, async, callback) {
    try {
        var xmlHttp = new XMLHttpRequest();
        if (xmlHttp === null) return false;

        // JSON and post to WS
        xmlHttp.open("POST", vwfurl + url, async);
        xmlHttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");

        // If asynchronous
        if (async) {
            // The function to call when a resposne is received
            xmlHttp.onreadystatechange = function() {
                // Only when we get a 200 and a readyState of 4
                if (xmlHttp.readyState == 4 && xmlHttp.status == 200) {
                    // If response received and was blank - service sent a null;
                    if (xmlHttp.responseText === "") callback(null);
                    else callback(JSON.parse(xmlHttp.responseText));
                }
            };
        }

        // Send (stringify is needed)
        if (typeof params === "undefined")
            xmlHttp.send();
        else
            xmlHttp.send(JSON.stringify(params));

        // We wait for the response
        if (!async) {
            // Get the valid response - then un-JSON
            if (xmlHttp.status === 200) {
                // If response received and was blank - service sent a null;
                if (xmlHttp.responseText === "") return callback(null);
                else return callback(JSON.parse(xmlHttp.responseText));
            }
            else {
                return callback(null);
            }
        }

        return true;
    } catch (e) {
        Vitro.Log(e.message);
        return false;
    }
}