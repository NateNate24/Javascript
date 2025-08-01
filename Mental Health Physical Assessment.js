var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();

Vitro.Version("2.7");

// (App - Start)
// Action buttons to be displayed
Vitro.Elements.SetActionButtonVisibility(myApp);

// Create Cease Action Button and implementation
Vitro.Elements.CreateCeaseButton(myApp, null, null, null);

// Create Action Progress Notes Button and implementation
Vitro.Elements.CreateProgressNotesButton(myApp, true);

// Set Unseal implementation
Vitro.Elements.SetUnsealAction(myApp, appActivityId);

// App level event handlers
myApp.Events.Ready(myApp_Ready);
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);

var APP_ALERT_SHEET = "Alert Sheet";

// Page variables
var pgAssess = myApp.RegisterPage("pgAssess");

// Regsiter Controls
pgAssess.RegisterControls("txtFamilyHistory", "txtPreviousInvestigations", "txtGeneralAppearance", "txtPupils",  "txtFundi", "txtCNS", "txtENT", "txtCardiovascular", "txtKnownAllergies", "txtPast", "txtPresent", "txtRespiratory", "txtAbdomen", "chkTenderYes", "chkTenderNo", "chkEnlargedYes", "chkEnlargedNo", "txtCms", "txtOtherViscera", "chkExaggerated", "chkNormal", "chkDepressed", "chkAbsent", "txtTreatmentPlan", "txtOtherComments", "auSign");

// Group controls
var assessControls = pgAssess.Controls("txtFamilyHistory", "txtPreviousInvestigations", "txtGeneralAppearance", "txtPupils",  "txtFundi", "txtCNS", "txtENT", "txtCardiovascular", "txtKnownAllergies", "txtPast", "txtPresent", "txtRespiratory", "txtAbdomen", "chkTenderYes", "chkTenderNo", "chkEnlargedYes", "chkEnlargedNo", "txtCms", "txtOtherViscera", "chkExaggerated", "chkNormal", "chkDepressed", "chkAbsent", "txtTreatmentPlan", "txtOtherComments");

// (App - Ready) Default Loaded handler
function myApp_Ready() {
	// If activity is in a submitted status
	if(status == Vitro.STATUS.Submitted)
	{
		// set the limit of character on textboxes
		SetCharacterLimits(pgAssess);
	}
	else if(status == Vitro.STATUS.New){
        myApp_Loaded();
    }
}

// (App - Loaded) Default Loaded handler
function myApp_Loaded() {
    // only set events if app not sealed
    if (status != Vitro.STATUS.Sealed && status != Vitro.STATUS.Deleted) {
        // Set event to controls
        pgAssess.auSign.Events.Change(auSign_Change);
        assessControls.Each.Events.Change(controls_Change);
        
        // Highlight controls
        Vitro.Elements.SetControlHighlight(pgAssess.Controls("txtPupils", "txtFundi", "txtCNS", "txtENT", "txtCardiovascular", "txtAbdomen", "txtCms", "txtOtherViscera"));
    
        // Get latest submitted activity 
        var deepAct = GetSubmittedAct(APP_ALERT_SHEET);

        // If submitted activity found
        if (deepAct) {
            var totalPages = deepAct.Pages.length;
            var allergiesArr = ["Medication - Allergy", "Medication - Adverse", "Anaesthetic", "Food Allergy"];
            var alertsArr = ["Safety", "Psych / Social", "Infection Control"];
            var allergiesStr = "";
            var alertsStr = "";

            // Loop all pages
            for (var i = 0; i < totalPages; i++) {
                var actPageName = deepAct.Pages[i].Name;
                var actPage = deepAct.ActivityPages()[actPageName];
                var actPageId = actPageName.indexOf("pgAlerts");

                // if pgAlerts found
                if (actPageId !== -1) {
                    var RPT_ALERT = 15;
                    var actPageCtrls = deepAct.PageControls(actPage);

                    // Loop alert sheet repeater
                    for (var j = 0; j < RPT_ALERT; j++) {
                        var ctrlDropdownType = "ddType[" + j + "]";
                        var ctrlTextboxType = "txtType[" + j + "]";
                        var alertTypeValue = actPageCtrls[ctrlDropdownType].Value;
                        var alertTypeInput = actPageCtrls[ctrlTextboxType].Value;

                        // If Alert Type has value
                        if (alertTypeValue !== "") {
                            if (allergiesArr.indexOf(alertTypeValue) !== -1) {
                                allergiesStr += alertTypeInput + ", ";
                            }
                            else if (alertsArr.indexOf(alertTypeValue) !== -1) {
                                alertsStr += alertTypeInput + ", ";
                            }
                            else {
                                allergiesStr += alertTypeInput + ", ";
                                alertsStr += alertTypeInput + ", ";
                            }
                        }
                    }
                }
            }
            // Allergies final string
            allergiesStr = allergiesStr.substr(0, allergiesStr.length - 2);
            // Set Allergies field values
            pgAssess.txtKnownAllergies.Value(allergiesStr);
            // Avoid discard changes when closing
            myApp.Clean();
        }
        // Populate the patient label (Section 1) 
		// update addressograph with new values
        Vitro.Elements.SetAddressograph(myApp);
		// Call Client Logo Wrap legacy VitroApplication.js function in Typesafe call
        Vitro.Elements.GetClientLogo(myApp, pgAssess.Control("imgClientLogo"));
    }
}

function myApp_Actions(action) {
	// If action is Submit
	if(action == Vitro.ACTIONS.Submit)
	{
		// If signature has value
		if (pgAssess.auSign.Value() != "")
		{	
			// Make signature readOnly
			pgAssess.auSign.ReadOnly(true);
		}
	}
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
}

// (Section 2, “Signature” Authorisation – Change) Event handler when any control in section 2 changes
function controls_Change(pg, ctrl, oldValue, newValue){
	var hasValue = 0;
	
	// Check if all controls in section 2, except signature, have value
	assessControls.Iterate(function(ctrl){
		var ctrlValue = ctrl.Value();
		// If textboxes have value or checkboxes are ticked, add count to hasValue
		if(ctrlValue == true || ctrlValue != "" && ctrlValue != false)
		{
			hasValue++;
		}
	});

	// If any control has value
	if(hasValue > 0)
	{
		// Make signature enabled and required
		pg.auSign.Enable().Required();
	}
	else
	{
		// Make signature disabled and not required
		pg.auSign.Disable().NotRequired();
	}
}

// (Section 2 – Textboxes / Checkboxes Change ) Event handler when signature changes
function auSign_Change(pg, ctrl, oldValue, newValue) {
	if(newValue != "")
	{
		// User stamp and role
		newValue.SignStamp = GetUserDetails().SignatureStamp + " " + GetUserDetails().Role;
		ctrl.Value(newValue).Validate();
		// Make section 2 controls readonly except signature
		assessControls.Each.ReadOnly(true);
	}
	else
	{
		// Make section 2 controls writeable except signature
		assessControls.Each.Writeable(true);
	}
}

// set the limit of character in textboxes
function SetCharacterLimits(page) {
	page.txtFamilyHistory.Attribute(Vitro.TEXTBOX.CharLimit, "332");
	page.txtPreviousInvestigations.Attribute(Vitro.TEXTBOX.CharLimit, "332");
	page.txtGeneralAppearance.Attribute(Vitro.TEXTBOX.CharLimit, "249");
	page.txtPupils.Attribute(Vitro.TEXTBOX.CharLimit, "77");
	page.txtFundi.Attribute(Vitro.TEXTBOX.CharLimit, "77");	
	page.txtCNS.Attribute(Vitro.TEXTBOX.CharLimit, "77");
	page.txtENT.Attribute(Vitro.TEXTBOX.CharLimit, "78");
	page.txtCardiovascular.Attribute(Vitro.TEXTBOX.CharLimit, "68");
	page.txtKnownAllergies.Attribute(Vitro.TEXTBOX.CharLimit, "332");
	page.txtPast.Attribute(Vitro.TEXTBOX.CharLimit, "249");
	page.txtPresent.Attribute(Vitro.TEXTBOX.CharLimit, "249");
	page.txtRespiratory.Attribute(Vitro.TEXTBOX.CharLimit, "249");
	page.txtAbdomen.Attribute(Vitro.TEXTBOX.CharLimit, "74");
	page.txtCms.Attribute(Vitro.TEXTBOX.CharLimit, "6");
	page.txtOtherViscera.Attribute(Vitro.TEXTBOX.CharLimit, "70");	
	page.txtTreatmentPlan.Attribute(Vitro.TEXTBOX.CharLimit, "249");
	page.txtOtherComments.Attribute(Vitro.TEXTBOX.CharLimit, "249");
}

// Method that return user details object
function GetUserDetails(user) {
    var userObj = user !== null ? Vitro.Users(user) : Vitro.User();
    var firstname = userObj.Property(Vitro.USER.FirstName);
    var lastname = userObj.Property(Vitro.USER.LastName);
    var role = userObj.Property(Vitro.USER.Role);

    return {
        Name: userObj.Property(Vitro.USER.Name),
        Beeper: userObj.Property(Vitro.USER.Beeper),
        Id: userObj.Property(Vitro.USER.Id),
        Firstname: firstname,
        Lastname: lastname,
        Role: role,
        Fullname: firstname.toUpperCase() + " " + lastname.toUpperCase(),
		Username: userObj,
        Initial: firstname.substr(0,1).toUpperCase() + lastname.substr(0,1).toUpperCase(),
        SignatureStamp: firstname.substr(0,1).toUpperCase() + "." +
            lastname.substr(0,1).toUpperCase() +
            lastname.substr(1, lastname.length).toLowerCase(),
        Details: firstname + " " + lastname + "    " + role
    };
}

// Get latest submitted activity 
function GetSubmittedAct(appName) 
{
    var patientid = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));
    var appid = Vitro.Workflow.GetApp(appName); 
    var activities = Vitro.Workflow.GetActivities(patientid, undefined, appid, Vitro.STATUS.Submitted);
    
    if (activities !== null && activities.length !== 0)
    {
        var shallowAct = activities[activities.length - 1];
        var deepenAct = shallowAct.Deepen();

        return deepenAct;
    }
}