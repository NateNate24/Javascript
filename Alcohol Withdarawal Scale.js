var myApp = Vitro.RegisterApp(appActivityId);
Vitro.Version("2.7");

// App level event handlers
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);
// Set the page added event
myApp.PageManager.Events.Added(myPages_Added);
// Set the page displayed event
myApp.PageManager.Events.Displayed(myPages_Displayed);
var status = myApp.Activity.Properties.Status();

var pg1 = myApp.Page("pg1");
var pgIds = myApp.Properties.PageIDs();
var REPEATER_LENGTH = 10;
var index = 0;
var isSuperUser = Vitro.Elements.GetUserGroup().IsSuperUser;
var ADULT_OBSERVATION_CHART = Vitro.Elements.GetObsChart(myApp);
var ADULT_OBS_CUSTOM = "Adult Obs";
var ACTION_OPEN = "Open";
var STATUS_CEASED = "Ceased";
var COLOURS =  Vitro.Elements.Colours;
COLOURS.GREEN = "255, 154, 207, 129";
COLOURS.ORANGE = "255, 252, 186, 73";
COLOURS.RED = "255, 240, 83, 94";
// Replace Highlight colour as per Elements SBR
var COLOURS_COPY = JSON.parse(JSON.stringify(COLOURS));
COLOURS_COPY.TRANS_YELLOW = COLOURS.LEMON;

var pgObsNext = pg1;
// key to check which textbox is required for displaying chart value
var GREATER = "Greater";
var LESSER = "Lesser";
 // default page dimensions (A4)
var PG_WIDTH = 856;
var PG_HEIGHT = 1185;
// store colour names
var YELLOW = "yellow";
var PINK = "pink";

 // Page size info 
var pageInfoObj = {
    "pg1": { height: 1185, width: 856 },
    "pg2": { height: 1056, width: 816 },
    "pg3": { height: 1056, width: 816 }
};
var CUSTOM_ACTION = {	
	CEASE: "Cease",
	ADULT_OBS: "Adult Obs",
};
 
// set action button visibility based on activity status and user group
Vitro.Elements.SetActionButtonVisibility(myApp);
// set action event for unsealing activity.
// after unseal, handle activity reload and action button visibility
Vitro.Elements.SetUnsealAction(myApp, appActivityId, function(action, status) {
    // if activity is open and was previously sealed
    if (action === ACTION_OPEN && (status === Vitro.STATUS.Sealed || status == STATUS_CEASED)) {        
        myApp.Hide(CUSTOM_ACTION.ADULT_OBS);           
    }
	myApp.Clean();
});
// Set Cease rules as per SBR
Vitro.Elements.CreateCeaseButton(myApp, PG_WIDTH, PG_HEIGHT, function(ceaseStatus){
    if (STATUS_CEASED === ceaseStatus) {
        ClearPopulatedDatetime(pgObsNext);
    }
});

// Create Action Progress Notes Button and implementation
Vitro.Elements.CreateProgressNotesButton(myApp, true);

// Create aduult obs custom 
Vitro.Elements.CreateOpenTabAppButton(myApp, ADULT_OBSERVATION_CHART, ADULT_OBS_CUSTOM, undefined, true);

var customActionButtons = [CUSTOM_ACTION.ADULT_OBS, CUSTOM_ACTION.CEASE];

var actionButtons = [Vitro.ACTIONS.Close, 
                    Vitro.ACTIONS.Submit, 
                    CUSTOM_ACTION.ADULT_OBS, 
                    Vitro.ACTIONS.Export, 
                    Vitro.ACTIONS.History, 
                    CUSTOM_ACTION.CEASE, 
                    Vitro.ACTIONS.Seal];

Vitro.Elements.OrderActionButtons(myApp, actionButtons);

// Defer loading all pages
PartialPageLoading();

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

// Default Loaded handler
function myApp_Loaded() {
    
    var index_flag = false;
    if (status !== Vitro.STATUS.Sealed) {
        var page = myApp.Page(pgIds[0]);
        if (page.Properties.ID().indexOf("pg1") !== -1) {
            Vitro.Elements.SetAddressograph(myApp, page);
            Vitro.Elements.GetClientLogo(myApp, page.Control("imgClientLogo"));
            page.Displayed = true;
            pgObsNext = page;
            for (var j = 0; j < REPEATER_LENGTH; j++) {
                // if not yet signed set the active column index
                if (!page.autSign[j].Value() && !index_flag) {
                    page.rptGrid[j].Show().Writeable();
                    page.pnlGrid[j].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE);                              
                    page.dpDate[j].Value(new Date()).Writeable();
                    page.dpTime[j].Value(new Date()).Writeable();
                    page.Title("Obs " + Vitro.Elements.GetDateString().ddMMyy);
                    ShowObsCtrl(page, j, true);
                    index_flag = true;     
                    index = j;                   
                    SetEvents(page);
                    if (!page.txtTotal[index].Value()) {
                        page.autSign[index].ReadOnly();
                    }
                    else{
                        page.txtTotal[index].Hide();
                    }
                }
                else {
                    if (page.autSign[j].Value()) {
                        page.rptGrid[j].ReadOnly(true).Show();
                    }
                    else {
                        page.rptGrid[j].ReadOnly(true).Hide();
                    }
                    
                    page.dpDate[j].ReadOnly(true);
                    page.dpTime[j].ReadOnly(true);
                    Vitro.Elements.SetupDynamicStrike(page, page.rptSTK[j], page.autSign[j], page.txtStk[j], page.txtInitials[j]);                        
                    // Check if last row is signed
                    if (page.autSign[j].Value() && j === REPEATER_LENGTH - 1) {
                        CloneObsPage(page);
                        ShowObsCtrl(pgObsNext, index, true);
                    }
                }
            }
            Vitro.Elements.GetLatestObsEntry(myApp, pgObsNext.txtTemperature[index], pgObsNext.txtPulse[index], pgObsNext.txtRespirations[index], pgObsNext.txtBPSys[index], pgObsNext.txtBPDias[index]);
        }        
    }
}

// Default Actions handler
function myApp_Actions(action) {
    if (action === Vitro.ACTIONS.Submit || action === Vitro.ACTIONS.Seal) { 
        ClearPopulatedDatetime(pgObsNext);
    }  
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
}

// Page Added handler
function myPages_Added(pg) {    
    if (pg.Properties.ID().indexOf("pg1") !== -1) {
        pg.RegisterControls("dpDateLastUsed", "dpTimeLastUsed");
        Vitro.Elements.RegisterRepeaterControls(pg, ["rptGrid", "pnlGrid", "rptSTK", "dpDate", "dpTime", "txtBAL", "ddPerspiration", "ddTremor", "ddAnxiety",
            "ddAgitation", "ddTemperature", "ddHallucinations1", "ddHallucinations2", "ddUnusualThings", "ddOrientation", "txtTotal", 
            "txtTemperature", "txtPulse", "txtRespirations", "txtBPSys", "txtBPDias", "ddConsciousLevel", "ddPupilSizeL", "ddPupilReactionL",
            "ddPupilSizeR", "ddPupilReactionR", "txtInterventions", "autSign", "btnStk", "txtStk", "txtInitials"], REPEATER_LENGTH);
        // set initial readonly columns
        for (var i = 0; i < REPEATER_LENGTH; i++) {
            pg.rptGrid[i].ReadOnly();
            // set dropdown to center
            pg.Controls("ddPerspiration[" + i + "]", "ddTremor[" + i + "]", "ddAnxiety[" + i + "]", "ddAgitation[" + i + "]", "ddTemperature[" + i + "]", "ddHallucinations1[" + i + "]", "ddHallucinations2[" + i + "]", "ddUnusualThings[" + i + "]", "ddOrientation[" + i + "]", "ddConsciousLevel[" + i + "]", "ddPupilSizeL[" + i + "]", "ddPupilReactionL[" + i + "]", "ddPupilSizeR[" + i + "]", "ddPupilReactionR[" + i + "]").Each.Attribute(Vitro.DROPDOWN.TextAlignment, "Center", true);
        }
        Vitro.Elements.SetAddressograph(myApp, pg);
        // date time fields highlight
        Vitro.Elements.SetControlHighlight(pg.dpDateLastUsed, null, COLOURS_COPY);
        Vitro.Elements.SetControlHighlight(pg.dpTimeLastUsed, null, COLOURS_COPY);
    }
}

// displayed event function for all pages
function myPages_Displayed(pg) {
	if (myApp.Activity.Properties.Status() !== Vitro.STATUS.Sealed) {
	    if (pg === pg1 || myApp.PageManager.Master(pg) === pg1) {
	        // if page has not been displayed already
	        if (!pg.Displayed) {
	            pg.Displayed = true;
                Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo"));
                for (var i = 0; i < REPEATER_LENGTH; i++) {
                    Vitro.Elements.SetupDynamicStrike(pg, pg.rptSTK[i], pg.autSign[i], pg.txtStk[i], pg.txtInitials[i]);
                }
	        }
	    }
        else {
            if (!pg.Displayed) {
	            pg.Displayed = true;
                Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo"));
	        }
        }
	}
}

// Sets event handleers for the page controls
function SetEvents(page) {
    var ddColumn_Controls = page.Controls("txtBAL[" + index + "]", "ddPerspiration[" + index + "]", "ddTremor[" + index + "]", 
                            "ddAnxiety[" + index + "]", "ddAgitation[" + index + "]", "ddTemperature[" + index + "]", 
                            "ddHallucinations1[" + index + "]", "ddHallucinations2[" + index + "]", "ddOrientation[" + index + "]");
    page.dpDateLastUsed.Events.Change(DateTimeLastUsed_Change);
    page.dpTimeLastUsed.Events.Change(DateTimeLastUsed_Change);
    page.dpDate[index].Events.Change(DateTimeCol_Change);
    page.dpTime[index].Events.Change(DateTimeCol_Change);
    page.txtInterventions[index].Events.Click(txtInterventions_Click);
    ddColumn_Controls.Each.Events.Change(Total_Compute);
    page.autSign[index].Events.Change(Authorisation_Change);
    page.txtBPSys[index].Events.Change(BP_Check);
    page.txtBPDias[index].Events.Change(BP_Check);
}

// Page 1 Sectin 2 "Date time last used - Change"
function DateTimeLastUsed_Change(pg, ctrl, oldValue, newValue) {    

    Vitro.Elements.DateTimeValidate(ctrl, newValue, COLOURS.TRANSPARENT, null, pg.dpDateLastUsed, pg.dpTimeLastUsed);
    if (pg.dpDateLastUsed.Value()) {
        pg.dpDateLastUsed.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
    if (pg.dpTimeLastUsed.Value()) {
        pg.dpTimeLastUsed.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
}

// Page 1 Section 3 "Date time - Change"
function DateTimeCol_Change(pg, ctrl, oldValue, newValue) {
    var index = Vitro.Elements.GetRepeaterIndex(ctrl);    
    var newDateTimeVal = Vitro.Elements.CombinedDateAndTime(pg.dpDate[index].Value(), pg.dpTime[index].Value());
    if (ctrl.Value()){
        if (ctrl.Properties.ID() === "dpDate[" + index + "]") {
            Vitro.Elements.DateTimeValidate(ctrl, newValue, COLOURS.TRANSPARENT, null, null, pg.dpTime[index]);
        } else{
            Vitro.Elements.DateTimeValidate(ctrl, newDateTimeVal, COLOURS.TRANSPARENT, pg.dpDate[index], pg.dpTime[index]);
        }  

    } 
    else {
        ctrl.Value(new Date());
    }
}

// Page 1 Section 4 “Medication” Textbox - Click
function txtInterventions_Click(page, control) {
    var YES = "Yes";
    var NO = "No";
    if (control.Value() === "") {
        control.Value(YES);
    }
    else if (control.Value() === YES) {
        control.Value(NO);
    }
    else {
        control.Value("");
    }
}

// Computes the total value of the dropdowns
function Total_Compute(page, control, oldValue, newValue) {
    var total = 0;
    var emptyValues = 0;
    page.autSign[index].Writeable().Required();
    var ddColumn_Controls = page.Controls("ddPerspiration[" + index + "]", "ddTremor[" + index + "]", 
        "ddAnxiety[" + index + "]", "ddAgitation[" + index + "]", "ddTemperature[" + index + "]", 
        "ddHallucinations2[" + index + "]", "ddOrientation[" + index + "]");
    
    ddColumn_Controls.Iterate(function (c) {
        if (!isNaN(parseInt(c.Value()))) {
            total = parseInt(total) + parseInt(c.Value());
            c.Validate();
            c.Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
            emptyValues++;

        }
        else {
            page.txtTotal[index].Hide();
            page.autSign[index].ReadOnly().NotRequired();
        }
    });

    if (!page.Control("txtBAL[" + index + "]").Value()) {
        page.autSign[index].ReadOnly().NotRequired();
    }

    page.txtTotal[index].Value(total);
    SetTotalBGColor(page.txtTotal[index], total);
    // When the user has populated a “Score” value in a highlighted column 
    if (emptyValues > 0) {
        // Set the highlighted column as required
        ddColumn_Controls.Each.Required();
        page.txtTotal[index].Show();
        page.Control("txtBAL["+ index +"]").Required();
    }
    else {
        // Set the highlighted column as not required 
        ddColumn_Controls.Each.NotRequired().Validate();
        page.Control("txtBAL["+ index +"]").NotRequired().Validate();
        page.txtTotal[index].Hide();
    }
}

// Set Total Background Color 
function SetTotalBGColor(ctrl, total) {
    // IF TOTAL ≥ 0 and ≤ 10
    if (parseInt(total) >= 0 && parseInt(total) < 5) {
        // Set TOTAL textbox background to GREEN 
        ctrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.GREEN, true);
    } 
    else if (parseInt(total) >= 5 && parseInt(total) <= 14) {
       // Set TOTAL textbox background to YELLOW 
       ctrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.ORANGE, true); 
    }
    else if (parseInt(total) > 14) {
        // Set TOTAL textbox background to RED 
       ctrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.RED, true); 
    } 
    else {
       // Set TOTAL textbox background to Transparent
       ctrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true); 
    }
}

// Sign event change
function Authorisation_Change(page, control, oldValue, newValue) {
    var index = Vitro.Elements.GetRepeaterIndex(control);
    
    if (newValue) {
        newValue.SignStamp = Vitro.Elements.GetUserName(newValue.SignerDetails).initials;
        control.Value(newValue);
        page.pnlGrid[index].Properties.Children().Iterate(function (c) { 
            
            if (c.Properties.ID().indexOf("autSign") !== -1) {
                c.Writeable();
            }
            else if (c.Properties.ID().indexOf("txtInterventions") !== -1) { 
                c.Disable(true); 
            }
            else {
                c.ReadOnly(true);
            }
        });
        control.Validate();
    }
    else {
        page.pnlGrid[index].Properties.Children().Iterate(function (c) { 
            
            if (c.Properties.ID().indexOf("autSign") !== -1) {
                c.Writeable();
            }
            else if (c.Properties.ID().indexOf("txtInterventions") !== -1 || c.Properties.ID().indexOf("txtTotal") !== -1
            || c.Properties.ID().indexOf("txtTemperature") !== -1 || c.Properties.ID().indexOf("txtRespirations") !== -1
            || c.Properties.ID().indexOf("txtPulse") !== -1 || c.Properties.ID().indexOf("txtBPSys") !== -1 
            || c.Properties.ID().indexOf("txtBPDias") !== -1 || c.Properties.ID().indexOf("txtStk") !== -1) { 
                c.Enable(true); 
            }
            else {
                c.Writeable(true);
            }
        });
    }
}

// Check BP values
function BP_Check(page, control, oldValue, newValue) {
    if ((page.txtBPSys[index].Value() && page.txtBPDias[index].Value()) && (parseInt(page.txtBPSys[index].Value()) < parseInt(page.txtBPDias[index].Value()))) {
        page.txtBPDias[index].Value("");
    }
}

// Clone Obs page 1
function CloneObsPage(page) {
    pgObsNext = myApp.PageManager.Clone(page);
    if (pgObsNext) {        
        // set order and set as not deletable and visible and title 
        pgObsNext.Order(page.Order()).Deletable(false).Show(true).Title("Obs " + Vitro.Elements.GetDateString().ddMMyy);        
        myPages_Added(pgObsNext);
        index = 0;
        for (var i = 0; i < REPEATER_LENGTH; i++) {
            pgObsNext.rptGrid[i].ReadOnly().Hide();
        }
        pgObsNext.rptGrid[index].Writeable().Show();
        pgObsNext.pnlGrid[index].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE);        
        pgObsNext.dpDate[index].Value(new Date()).Writeable();
        pgObsNext.dpTime[index].Value(new Date()).Writeable();  
        SetEvents(pgObsNext);
        if (!pgObsNext.txtTotal[index].Value()) {
            pgObsNext.autSign[index].ReadOnly();
        }
        // set previous page date and time to readonly
        page.dpDateLastUsed.ReadOnly(true);
        page.dpTimeLastUsed.ReadOnly(true);

        pgObsNext.Activate();

    }
}

// Check if theres entry in any column if none clear autopopulated datetime
function ClearPopulatedDatetime(page){
    var requiredControls = page.Controls("txtBAL[" + index + "]", "ddPerspiration[" + index + "]", "ddTremor[" + index + "]", 
        "ddAnxiety[" + index + "]", "ddAgitation[" + index + "]", "ddTemperature[" + index + "]", "ddHallucinations2[" + index + "]", 
        "ddOrientation[" + index + "]");
    var columnCtrls = page.Controls("ddPerspiration[" + index + "]", "ddTremor[" + index + "]", 
        "ddAnxiety[" + index + "]", "ddAgitation[" + index + "]", "ddTemperature[" + index + "]", 
        "ddHallucinations1[" + index + "]", "ddHallucinations2[" + index + "]", "ddOrientation[" + index + "]", 
        "txtTemperature[" + index + "]", "txtPulse[" + index + "]", "txtRespirations[" + index + "]",
        "txtBPSys[" + index + "]", "txtBPDias[" + index + "]", "ddConsciousLevel[" + index + "]", 
        "ddPupilSizeL[" + index + "]", "ddPupilReactionL[" + index + "]", "ddPupilSizeR[" + index + "]", 
        "txtInterventions[" + index + "]");
    var isValid = true;
    requiredControls.Iterate(function(c){
        if(c.Properties.IsRequired() && c.Value() === "") {
            isValid = false;
        }
    });
    if (page.dpDateLastUsed.Value() && page.dpTimeLastUsed.Value() && page.autSign[index].Properties.IsReadOnly() && isValid) {
        page.txtTotal[index].Value("").Attribute(Vitro.TEXTBOX.BackgroundColour, COLOURS.TRANSPARENT, true);
        if (!Vitro.Elements.GetControlDetails(columnCtrls).HasAnyCtrlsValue) {             
                page.dpDate[index].Value("");
                page.dpTime[index].Value("");
        } 
        else {
            // check if column is not yet signed then clear all values 
            if (!page.autSign[index].Value()){
                page.dpDate[index].Value("");
                page.dpTime[index].Value("");
                ShowObsCtrl(page, index, false);                
            }
        }
    }
}

// Show readonly obs controls
function ShowObsCtrl(page, idx, state) {
    if (state) {    
        page.txtTemperature[idx].Show();
        page.txtPulse[idx].Show();
        page.txtRespirations[idx].Show();
        page.txtBPSys[idx].Show();
        page.txtBPDias[idx].Show();
    }
    else {
        page.txtTemperature[idx].Hide();
        page.txtPulse[idx].Hide();
        page.txtRespirations[idx].Hide();
        page.txtBPSys[idx].Hide();
        page.txtBPDias[idx].Hide();   
    }
}
