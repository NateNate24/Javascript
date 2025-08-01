var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();
//Vitro.Version("2.7");

// Action buttons to be displayed as per Standard Business Rules 
Vitro.Elements.SetActionButtonVisibility(myApp);
// Create Action Progress Notes Button and implementation
Vitro.Elements.CreateProgressNotesButton(myApp, true);
// Set Unseal implementation
Vitro.Elements.SetUnsealAction(myApp, appActivityId);

// App level event handlers
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);

// Set the page added event
myApp.PageManager.Events.Added(myPages_Added);
myApp.PageManager.Events.Displayed(Pages_Displayed);

var PAGE_HEIGHT = 1185;
var PAGE_WIDTH = 856;
var NUM_ALERT_REPS = 17;
var NUM_CEASE_REPS = 21;
var NUM_ALERT_REPS_OTHER = 2;
var COLOURS = Vitro.Elements.Colours;
// Move in API
var JsonObj;
var SERVICE_URL = Vitro.Elements.GetServiceURL;
var OpenAlertsJson = [];
var OtherAlertsJson = [];
var CeaseAlertsJson = [];
var VerificationPopupEvents = {};

var CEASE = "Ceased";
var Clinical_Alerts = myApp.DataSource("CLINICAL ALERTS DATA");
Clinical_Alerts.Property(Vitro.DATASOURCE.Display, "CLINICAL ALERTS DATA");

var isSuperUser = Vitro.Users().InGroup("Super User");
var BTN_MEDICATION_PLAN = "Medication Management Plan"; 
myApp.Custom(BTN_MEDICATION_PLAN);

// create local instance functions from API
var CreateDynamicPanel = Vitro.Elements.CreateDynamicPanel;
var CreateDynamicButton = Vitro.Elements.CreateDynamicButton;
var verificationPopupObj = null;

var pg1 = myApp.RegisterPage("pg1");
var pg2 = myApp.RegisterPage("pg2");
var pg3 = myApp.RegisterPage("pg3");
var pgIds = myApp.Properties.PageIDs();
var pg1StaffCtrls = pg1.Controls("cblMedical", "cblFinancial", "cblGuardship", "txtNameOfEnduringPowerOfAttorney", "txtHomePhone", "txtMobile", "txtEMail", "cblIfNotProvidedOnAdmission");

// popup messages
var POPUP_VERIFICATION_MESSAGE = "Ensure information is correct and current \n(re-sign/date/check box each admission) \nEPOA *app page 1 and \nAdvanced Health Care Directive \n*top section of 'open' alerts page.";						  
var POPUP_SEAL_MESSAGE = "Sealing this app will disable \nthe open alert symbol notification: \nIf this app is required in future, \ncreate new app upon admission.";						  
// image icon base64 for dynamic popup
var IMG_ALERT_ICON = "data:image/jpeg;base64,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";

// Default Loaded handler
function myApp_Loaded() {

    if (status !== Vitro.STATUS.Sealed) {
        Vitro.Elements.SetAddressograph(myApp, pg1);  
        Vitro.Elements.GetClientLogo(myApp, pg1.Control("imgClientLogo")); 
        
        // IF Page 1 Section 2 – Medical, financial, guardianship Required (Checkbox List) do not contain a value. 
        if (pg1.cblMedical.Value() == -1) {
            //  Set as highlight yellow as per SBR. 
            Vitro.Elements.SetControlHighlight(pg1.cblMedical);
        }

        if (pg1.cblFinancial.Value() == -1) {
            //  Set as highlight yellow as per SBR. 
            Vitro.Elements.SetControlHighlight(pg1.cblFinancial);
        }
        
        if (pg1.cblGuardship.Value() == -1) {
            //  Set as highlight yellow as per SBR. 
            Vitro.Elements.SetControlHighlight(pg1.cblGuardship);
        }

        // IF Page 2 Section 2 – Interpreter Required (Checkbox List) do not contain a value. 
        if (pg2.cblInterpreterRequired.Value() == -1) {
            //  Set as highlight yellow as per SBR. 
            Vitro.Elements.SetControlHighlight(pg2.cblInterpreterRequired);
        }

        // IF Page 2 Section 3 - Advanced Care Health Directive in place (Checkbox)do not contain a value. 
        if (pg2.cblAdvanceCareHealthDirectiveInPlace.Value() == -1) {
            //  Set as highlight yellow as per SBR. 
            Vitro.Elements.SetControlHighlight(pg2.cblAdvanceCareHealthDirectiveInPlace);
        }

        // IF Page 2 - “No known clinical alerts” has no value AND Page 2 – Alerts table have no value AND Page 2 – Other Alerts rows have no values 
        if (!pg2.chkNoKnownClinicalAlerts.Value() && Alert_Row_Check(0) && Alert_Row_Check(NUM_ALERT_REPS)) {
            // Set panel “Alert Table” as disabled 
            pg2.pnlAlertTable.Enable();
            pg2.rptAlertRepeater.Enable();
            pg2.rptAlertRepeater[0].Enable();
            for (var i = 1; i < NUM_ALERT_REPS; i++) {
                pg2.rptAlertRepeater[i].Disable();
            }

            Enable_Other(pg2, NUM_ALERT_REPS);
        }
       
        // Pre-load the Alert data into datasource from integration endpoint using Vitro API Relay() method  
        JsonObj = JSON.parse(Vitro.Workflow.Relay(SERVICE_URL).RelayResponse);
        // IF the web call to load data fails, then display dynamic pop-up with the following message – “Failed to load Alerts data please close app and try again, or contact support.” 
        if (JsonObj != null) { 
            InitializeDataSource();
        }
        else {
            var ALERT_POPUP = "Failed to load Alerts data please close app and try again, or contact support.";
            CreateConfirmPopUp(myApp.PageManager.GetActive(), ALERT_POPUP);
        }
        
        Set_Events();        
        Set_ClonedPages();
        Set_Page2_Title(pg2);
        Set_Page3_Title(pg3);
        CreateVerificationPopUp(myApp.PageManager.GetActive());
        
        if (pg2.txtOpenAlertsObj.Value()) {
            OpenAlertsJson = JSON.parse(pg2.txtOpenAlertsObj.Value());
        }
        if (pg2.txtOtherAlertsObj.Value()) {
            OtherAlertsJson = JSON.parse(pg2.txtOtherAlertsObj.Value());
        }
        EnableAvailableRow(pg2); 
        CheckMedPlanApp();
    }

}

// Default Actions handler
function myApp_Actions(action) {
    
    if (action === Vitro.ACTIONS.Submit || action === Vitro.ACTIONS.Seal) { 
        
        if (Vitro.Elements.AllValid(myApp) && CheckCloneValidCtrls()) {
            
            if (action === Vitro.ACTIONS.Submit) {
                // Submit action
                for (var i = 0; i < pgIds.length; i++) {
                    myApp.Page(pgIds[i]).lblDraft.Show(true);
                }

                // if all required controls are valid
                CheckRequiredControlsOnSubmit();

                SetReadOnlySign();                
                // Submit open and ceased alerts to vitro
                SubmitAlerts();
                UpdateCeasedAlerts();
           
            }
            else {
                // Seal action
                for (var i = 0; i < pgIds.length; i++) {
                    myApp.Page(pgIds[i]).lblDraft.Hide(true);
                }
                CreateSealPopUp(myApp.PageManager.GetActive());
                return false;
            }

  

        }
    }
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
}

// Page Added handler
function myPages_Added(pg) { 
    
    if (pg.Properties.ID() === "pg1") {
        pg.RegisterControls("lblDraft", "cblMedical", "cblFinancial", "cblGuardship", "txtNameOfEnduringPowerOfAttorney", "txtHomePhone",
            "txtMobile", "txtEMail", "dpDateDocumentation", "auStaffMember1", "dpDate1", "cblIfNotProvidedOnAdmission", 
            "auStaffMember2", "dpDate2", "chkMedicalYes", "chkMedicalNo", "chkFinancialYes", "chkFinancialNo", "chkGuardianYes",
            "chkGuardianNo", "chkIfNotProvidedOnAdmissionYes", "chkIfNotProvidedOnAdmissionNo");
    }
    else if (pg.Properties.ID().indexOf("pg2") != -1) {
        pg.RegisterControls("lblDraft", "cblInterpreterRequired", "txtIfYesLanguage", "cblAdvanceCareHealthDirectiveInPlace", "chkNoKnownClinicalAlerts", "chkNoKnownNonClinicalAlerts", "auNoKnownConfirmedBy",
            "txtNoKnownReaction", "pnlAlertTable", "chkInterpreterRequiredYes", "chkInterpreterRequiredNo", "chkAdvanceCareHealthDirectiveYes", "chkAdvanceCareHealthDirectiveNo", "txtOpenAlertsObj", "txtOtherAlertsObj", "auKnownCeasedBy", "txtContinuePage");
        Vitro.Elements.RegisterRepeaterControls(pg, ["rptAlertRepeater", "txtAlertType", "txtAlertName",
            "txtReaction", "auSignature", "auCeasedSignature", "txtStrikeInitials", "txtStrikeLabel", "txtAlertID", "chkSubmitted", "txtOtherTempID"], NUM_ALERT_REPS + NUM_ALERT_REPS_OTHER);
    }
    else if (pg.Properties.ID().indexOf("pg3") != -1) {
        pg.RegisterControls("lblDraft", "cblInterpreterRequired", "txtIfYesLanguage", "pnlAlertTable", "chkInterpreterRequiredYes", "chkInterpreterRequiredNo", "txtCeaseAlertsObj", "txtContinuePage");
        Vitro.Elements.RegisterRepeaterControls(pg, ["rptAlertRepeater", "txtAlertType", "txtAlertName",
            "txtReaction", "auSignature", "auCeasedSignature", "txtStrikeInitials", "txtStrikeLabel", "txtAlertID", "chkSubmitted"], NUM_CEASE_REPS);
          
    }
}

function Pages_Displayed(pg) {
    
    if (pg.Displayed !== true) {
        pg.Displayed = true;
        Vitro.Elements.SetAddressograph(myApp, pg); 
        Vitro.Elements.GetClientLogo(myApp, pg.Control("imgClientLogo")); 
 
    }

    if (pg.Properties.ID().indexOf("pg2") != -1) {
            
        for (var k = 0; k < NUM_ALERT_REPS; k++) {

            pg.Control("txtAlertName[" + k + "]").Attribute(Vitro.CONTROL.FontSize, 13, true);

            if (pg.Control("txtAlertName[" + k + "]").Attribute("IsTextOverflowing") === 'True') {
                for (var i = 12; i > 7; i--) {
                    pg.Control("txtAlertName[" + k + "]").Attribute(Vitro.CONTROL.FontSize, i, true);
                    if (pg.Control("txtAlertName[" + k + "]").Attribute("IsTextOverflowing") === 'False') { break; }
                } 
            }
        }       

    }

    if (pg.Properties.ID().indexOf("pg3") != -1) {
            
        for (var k = 0; k < NUM_CEASE_REPS; k++) {

            pg.Control("txtAlertName[" + k + "]").Attribute(Vitro.CONTROL.FontSize, 13, true);

            if (pg.Control("txtAlertName[" + k + "]").Attribute("IsTextOverflowing") === 'True') {
                for (var i = 12; i > 7; i--) {
                    pg.Control("txtAlertName[" + k + "]").Attribute(Vitro.CONTROL.FontSize, i, true);
                    if (pg.Control("txtAlertName[" + k + "]").Attribute("IsTextOverflowing") === 'False') { break; }
                } 
            }
        }       

    }
}

function Alert_Row_Check(index) {
    var pg2RepeaterControls = pg2.Controls("txtAlertType[" + index + "]", "txtAlertName[" + index + "]",
        "txtReaction[" + index + "]", "auSignature[" + index + "]");
    var isEmpty = true;

    pg2RepeaterControls.Iterate(function (c) {
        if (c.Value()) {
            isEmpty = false;
        }
    });

    return isEmpty;
}

function Set_Events() {
    
    Page1_Events(); 
    Page2_Events(pg2);    

}

function CheckMedPlanApp() {
    // Get app id of Medication Management Plan 
    var medAppId = Vitro.Workflow.GetApp(BTN_MEDICATION_PLAN);
    // If no appid is found disable the action button
    if (medAppId) {
        myApp.Enable(BTN_MEDICATION_PLAN);
    } else {
        myApp.Disable(BTN_MEDICATION_PLAN);
    }
}

function Set_ClonedPages() {
    
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();

    if (pageIds.length > 3) {
    
        var len = pageIds.length - 1;
        var pgOpenAlerts;
        var pgCeasedAlerts;

        for (var k = 2; k < len; k++) 
        {
            var pgID = pageIds[k];

            if (pgID.indexOf("pg2") != -1)
            {
                pgOpenAlerts = myApp.PageManager.Page(pgID.toString());

                myPages_Added(pgOpenAlerts);
                Page2_Events(pgOpenAlerts);
            }

            if (pgID.indexOf("pg3") != -1)
            {
                pgCeasedAlerts = myApp.PageManager.Page(pgID.toString());    
                myPages_Added(pgCeasedAlerts);                    
            }

        }
    
    }

}

function Set_Page2_Title(p) {
    // Page 2 set title
    p.Title("Open " + Vitro.Elements.GetDateString(new Date()).ddMMyy);
 
}

function Set_Page3_Title(p) {
  
    // Page 3 set title
    p.Title("Ceased " + Vitro.Elements.GetDateString(new Date()).ddMMyy);
}

function Page1_Events() {
    
    var p1 = myApp.Page(pgIds[0]);
    p1.chkMedicalYes.Events.Change(Page1Section2_Change);
    p1.chkFinancialYes.Events.Change(Page1Section2_Change);
    p1.chkGuardianYes.Events.Change(Page1Section2_Change);

    p1.chkMedicalNo.Events.Change(Page1Section2_Change);
    p1.chkFinancialNo.Events.Change(Page1Section2_Change);
    p1.chkGuardianNo.Events.Change(Page1Section2_Change);

    p1.dpDateDocumentation.Events.Change(dptDateDocumentation_Change);

    p1.chkIfNotProvidedOnAdmissionYes.Events.Change(cblIfNotProvidedOnAdmission_Change);
    p1.chkIfNotProvidedOnAdmissionNo.Events.Change(cblIfNotProvidedOnAdmission_Change);

    // Page 1 Section 2, “Signature of staff member 1” Authorisation– Change   
    pg1.auStaffMember1.Events.Change(Staff_Change);
    // Page 1 Section 2, “Signature of staff member 2 and Date 2” Authorisation
    pg1.auStaffMember2.Events.Change(Staff_Change);
}

function Page2_Events(p) {
    
    // NEWEST TO OLDEST
    // var p2 = myApp.Page(pgIds[1]);
    // OLDEST TO NEWEST
    // var p2 = myApp.Page(pgIds[pgIds.length-1]);
    // Page 2 Section 2 – “Interpreter Required” -Checkbox Change
    p.chkInterpreterRequiredYes.Events.Change(Interpreter_Change);

    // Page 2 Section 3 & 4 – Textboxes / Checkboxes Change  
    var pg2RequiredControls = p.Controls("chkInterpreterRequiredYes", "chkInterpreterRequiredNo", "chkAdvanceCareHealthDirectiveYes", "chkAdvanceCareHealthDirectiveNo");
    p.txtIfYesLanguage.Events.Change(Pg2RequiredTextbox_Change);
    pg2RequiredControls.Each.Events.Change(Pg2Required_Change);
    
    // Page 2 Section 3 – “No known Clinical Alerts” & "No known Non Clinical Alerts" – Checkbox Change   
    p.chkNoKnownClinicalAlerts.Events.Change(NoAlertsCheckbox_Change);
    p.chkNoKnownNonClinicalAlerts.Events.Change(NoAlertsCheckbox_Change);
    p.txtNoKnownReaction.Events.Change(txtNoKnownReaction_Change);
    p.auNoKnownConfirmedBy.Events.Change(auKnownConfirmedBy_Change);

    for (var i = 0; i < (NUM_ALERT_REPS + NUM_ALERT_REPS_OTHER); i++) {
        var alertControls = p.Controls("txtAlertType[" + i + "]", "txtAlertName[" + i + "]");
        if (i < NUM_ALERT_REPS) {
            // Page 2 Section 3 – “Alerts Type”– Read only textbox – Click  
            alertControls.Each.Events.Click(Alerts_Click);          
        }
        
        // Page 2 Section 3 – “Alerts Type”– Textbox Change
        alertControls.Each.Events.Change(Alerts_Change);
        // set event triggering on character change instead of focus
        alertControls.Each.Attribute(Vitro.TEXTBOX.EventOnCharChange, "true");
        // Page 2 Section 3 – “Reaction” textbox - Change 
        p.txtReaction[i].Events.Change(Reaction_Change);
        p.txtReaction[i].Attribute(Vitro.TEXTBOX.EventOnCharChange, "true");
        // Page 2 Section 3, “Signature and Designation 1” Authorisation – Change   
        p.auSignature[i].Events.Change(Signature_Change);

        // Page 2 Section 3, Cease” Authorisation – Change   
        p.auCeasedSignature[i].Events.Change(CeasedSignature_Change);
        
    }
}

function Page1Section2_Change(p, c, o, n) {
    
    // If Any of the checkbox list Has value as ‘Yes’. 
    if (p.chkMedicalYes.Value() || p.chkFinancialYes.Value() || p.chkGuardianYes.Value()) {        
        p.cblIfNotProvidedOnAdmission.Required();
        Vitro.Elements.SetControlHighlight(p.cblIfNotProvidedOnAdmission);
    } else {
        p.cblIfNotProvidedOnAdmission.NotRequired().Validate().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true); 
    }
    // If All the checkbox list Has value - as “YES” or “NO” 
    if (p.cblMedical.Value() != -1 && p.cblFinancial.Value() != -1 && p.cblGuardship.Value() != -1) {
        p.auStaffMember2.Enable().Required();
        Vitro.Elements.SetControlHighlight(p.auStaffMember2);        
        
    } else {
        p.auStaffMember2.NotRequired().Validate().Disable().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);    
    }

    if (c.Properties.ID().indexOf("Medical") != -1) {
        p.cblMedical.Validate(); 
    }
    if (c.Properties.ID().indexOf("Financial") != -1) {
        p.cblFinancial.Validate(); 
    }
    if (c.Properties.ID().indexOf("Guardian") != -1) {
        p.cblGuardship.Validate(); 
    }

    // if values are removed from any checkboxlist make it required and highlighted
    if (!n) {
        if (c.Properties.ID().indexOf("Medical") != -1) {            
            p.cblMedical.Required();
            Vitro.Elements.SetControlHighlight(p.cblMedical);
        }
        if (c.Properties.ID().indexOf("Financial") != -1) {            
            p.cblFinancial.Required();
            Vitro.Elements.SetControlHighlight(p.cblFinancial);
        }
        if (c.Properties.ID().indexOf("Guardian") != -1) {
            p.cblGuardship.Required();
            Vitro.Elements.SetControlHighlight(p.cblGuardship);
        }
    }
}

function dptDateDocumentation_Change(p, c, o ,n) {
    
    if (n) {
        p.auStaffMember1.Enable().Required();
        Vitro.Elements.SetControlHighlight(p.auStaffMember1);
    }
    else {
        p.auStaffMember1.NotRequired().Validate().Disable().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);     
    }
}

function cblIfNotProvidedOnAdmission_Change(p, c, o, n) {    
    // If Any of the checkbox list Has value as ‘Yes’. 
    if (p.chkMedicalYes.Value() || p.chkFinancialYes.Value() || p.chkGuardianYes.Value()) {        
        p.cblIfNotProvidedOnAdmission.Required();
        Vitro.Elements.SetControlHighlight(p.cblIfNotProvidedOnAdmission);
    }
    p.cblIfNotProvidedOnAdmission.Validate();      
}

function Staff_Change(p, c, o, n) {
    // IF control has a value. 
    if (n) {        
       
        if (c.Properties.ID() == pg1.auStaffMember1.Properties.ID()) {
            // Stamp the User on Login - First name, Last name, and Designation (e.g., J.Carter, Nurse) 
            n.SignStamp = Vitro.Elements.GetUserDetails(n.SignerDetails).SignatureStamp + ", " + Vitro.Elements.GetUserDetails(n.SignerDetails).Role;
            // Set ‘Date 1’ date control - Stamp Current Date as dd/mm/yy 
            p.dpDate1.Value(new Date(n.SignDate));
            p.dpDateDocumentation.ReadOnly(true);
            
        }
        else {
            // Set Staff related ctrls Readonly
            pg1StaffCtrls.Each.ReadOnly(true);
            // Stamp the User on Login - First name, Last name, and Designation (e.g., Jhon Carter, Nurse) 
            n.SignStamp = Vitro.Elements.GetUserDetails(n.SignerDetails).Details;
            // Set ‘Date 2’ date control - Stamp Current Date as dd/mm/yy 
            p.dpDate2.Value(new Date(n.SignDate));            
        }

        c.Value(n);
    }
    else {
        if (c.Properties.ID() == pg1.auStaffMember1.Properties.ID()) {
            // Clear ‘Date 1’ date control  
            p.dpDate1.Value("");
            p.dpDateDocumentation.Writeable();
        }
        else {
            pg1StaffCtrls.Each.Writeable();
            // Clear ‘Date 2’ date control 
            p.dpDate2.Value("");
        }
        c.Required();
        Vitro.Elements.SetControlHighlight(c); 
    }
    c.Validate();
}

function Interpreter_Change(p, c, o, n) {
    // If control Has value ‘Yes’ checkbox is checked 
    if (n) {
        // Highlight as required ‘If Yes, Language” textbox as per SBR
        p.txtIfYesLanguage.Required();
        if (!p.txtIfYesLanguage.Value()) {
            p.txtIfYesLanguage.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_YELLOW, true);
        }
        else {
            p.txtIfYesLanguage.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        }
    }        
    else {
        // Remove Highlight ‘If Yes, Language” textbox as per SBR
        p.txtIfYesLanguage.NotRequired().Validate();
        p.txtIfYesLanguage.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        p.txtIfYesLanguage.Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
    }
}

function Pg2RequiredTextbox_Change(p, c, o, n) {
    c.Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
    if (n) {
        c.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
    else {
        if (pg2.chkInterpreterRequiredYes.Value()) {
            c.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_YELLOW);
        }
        else {
            c.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        }
    }

    var pgIds = myApp.Properties.PageIDs();
    // IF overflow exists 
    if (pgIds.length > 2) {

        // OLDEST TO NEWEST
        for (var i = 1; i < pgIds.length; i++) {
            myApp.Page(pgIds[i]).txtIfYesLanguage.Value(c.Value());
        }
    }
}

function Pg2Required_Change(p, c, o, n) {
    if (c.Properties.Parent() === p.chkInterpreterRequiredYes.Properties.Parent() || 
        c.Properties.Parent() === p.chkInterpreterRequiredNo.Properties.Parent()) {
            p.cblInterpreterRequired.Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
            if (n) {
                p.cblInterpreterRequired.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
            }
            else {
                p.cblInterpreterRequired.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_YELLOW, true);
            }
            
    }
    else {
        p.cblAdvanceCareHealthDirectiveInPlace.Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
        if (n) {
            p.cblAdvanceCareHealthDirectiveInPlace.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        }
        else {
            p.cblAdvanceCareHealthDirectiveInPlace.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_YELLOW, true);
        }
        
    }
    var pgIds = myApp.Properties.PageIDs();
    // IF overflow exists 
    if (pgIds.length > 2) {
        Repopulate_Pages(p, c);
    }
}

//  Repopulate previous pages
function Repopulate_Pages(p, c) {
   
    // OLDEST TO NEWEST
    var pgIds = myApp.Properties.PageIDs();

    for (var i = 1; i < pgIds.length; i++) {
        if (c.Properties.Parent() === p.chkInterpreterRequiredYes.Properties.Parent() || 
            c.Properties.Parent() === p.chkInterpreterRequiredNo.Properties.Parent()) {
                myApp.Page(pgIds[i]).chkInterpreterRequiredYes.Value(p.chkInterpreterRequiredYes.Value()).NotRequired().Validate();
                myApp.Page(pgIds[i]).chkInterpreterRequiredNo.Value(p.chkInterpreterRequiredNo.Value()).NotRequired().Validate();
                myApp.Page(pgIds[i]).cblInterpreterRequired.Validate();
        }
        else {
            if (pgIds[i].indexOf("pg2") != -1) {
                myApp.Page(pgIds[i]).chkAdvanceCareHealthDirectiveYes.Value(p.chkAdvanceCareHealthDirectiveYes.Value()).NotRequired().Validate();
                myApp.Page(pgIds[i]).chkAdvanceCareHealthDirectiveNo.Value(p.chkAdvanceCareHealthDirectiveNo.Value()).NotRequired().Validate();
                myApp.Page(pgIds[i]).cblAdvanceCareHealthDirectiveInPlace.Validate();
            }
            
        }
    }
}

function NoAlertsCheckbox_Change(p, c, o, n) {
    
    // If checkbox has value checked 
    if (n || p.chkNoKnownClinicalAlerts.Value() || p.chkNoKnownNonClinicalAlerts.Value()) {

        // 1st Row can be disabled here 
        // Make enabled and highlight as yellow for “Confirmed by” for same row and set as required.                 
        p.auNoKnownConfirmedBy.Writeable().Required();
        Vitro.Elements.SetControlHighlight(p.auNoKnownConfirmedBy);
    }  
    else {       
        // Make Read-only and remove highlight and not required “Confirmed by” Authorisation 
        p.auNoKnownConfirmedBy.NotRequired().Validate().ReadOnly().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);    
    }

    var pgIds = myApp.Properties.PageIDs();
    // IF overflow exists 
    if (pgIds.length > 2) {

        // OLDEST TO NEWEST
        for (var i = 1; i < pgIds.length; i++) {
            if(pgIds[i].indexOf("pg2") != -1) {
                myApp.Page(pgIds[i]).chkNoKnownClinicalAlerts.Value(p.chkNoKnownClinicalAlerts.Value()).Validate();
                myApp.Page(pgIds[i]).chkNoKnownNonClinicalAlerts.Value(p.chkNoKnownNonClinicalAlerts.Value()).Validate();
            }
        }
    }
}
 
function txtNoKnownReaction_Change(p, c, o, n) {
    var pgIds = myApp.Properties.PageIDs();
    // IF overflow exists 
    if (pgIds.length > 2) {

        // OLDEST TO NEWEST
        for (var i = 1; i < pgIds.length; i++) {
            if(pgIds[i].indexOf("pg2") != -1) {
                myApp.Page(pgIds[i]).txtNoKnownReaction.Value(c.Value()).Validate();     
            }
        }
    }
}

function auKnownConfirmedBy_Change(p, c, o, n) {
    
    if (n) {
        var curDate = Vitro.Elements.GetDateString().ddMMyy;
        // Stamp the User on Login - First name initial, Last name initial, and Designation and date – dd/mm/yy (e.g.,  J.W Doctor).   
        n.SignStamp = Vitro.Elements.GetUserDetails(n.SignerDetails).Initial + " " + Vitro.Elements.GetUserDetails().Role + " " + curDate;
        p.chkNoKnownClinicalAlerts.ReadOnly(true);
        p.chkNoKnownNonClinicalAlerts.ReadOnly(true);
        p.txtNoKnownReaction.ReadOnly(true);

        c.Value(n);
    }
    else {
        p.chkNoKnownClinicalAlerts.Writeable();
        p.chkNoKnownNonClinicalAlerts.Writeable();
        p.txtNoKnownReaction.Writeable();        
        c.Required();
        Vitro.Elements.SetControlHighlight(c);
    }
    c.Validate();

    var pgIds = myApp.Properties.PageIDs();
    // IF overflow exists 
    if (pgIds.length > 2) {
        
        // OLDEST TO NEWEST
        for (var i = 1; i < pgIds.length; i++) {
            if(pgIds[i].indexOf("pg2") != -1) {
                myApp.Page(pgIds[i]).auNoKnownConfirmedBy.Value(c.Value()).Validate();
            }
        }
    }
}

function Alerts_Click(p, c, o, n) {
    Clinical_Alerts.Launch();
}

function Alerts_Change(p, c, o, n) {
    
    var index = Vitro.Elements.GetRepeaterIndex(c);

    // IF Alert type Textbox Contains Data 
    if ((p.txtAlertType[index].Value() && p.txtAlertType[index].Value() !== "Other") || p.txtAlertName[index].Value()) {
        // Make writable and required “Reaction” Textbox. 
        p.txtReaction[index].Writeable(true).Required();
        Vitro.Elements.SetControlHighlight(p.txtReaction[index]);
    }
    else {
        // Make Read-only and not required Reaction Textbox 
        p.txtReaction[index].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        p.txtReaction[index].ReadOnly(true).NotRequired().Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
        
    }
}

function Reaction_Change(p, c, o, n) {
    var index = Vitro.Elements.GetRepeaterIndex(c);
    c.Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);

    // IF Reaction Textbox Contains Data 
    if (n) {
        // Make enabled and required for signature 1 for same row.
        p.auSignature[index].Writeable(true).Required();
        Vitro.Elements.SetControlHighlight(p.auSignature[index]);
    }
    else {
        // Make Read-only and not required Signature Authorisation 
        p.auSignature[index].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        p.auSignature[index].ReadOnly(true).NotRequired().Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
    }
}

function Signature_Change(p, c, o, n) {
    
    var index = Vitro.Elements.GetRepeaterIndex(c);

    // IF “Signature and designation 1” Authorisation have a value.   
    if (n) {
        // Stamp the User Logged in’s - First name initial, Last name initial and Designation and date – dd/mm/yy (e.g., J.C Doctor 11/11/2024)  
        var curDate = Vitro.Elements.GetDateString().ddMMyy;
        // Stamp the User on Login - First name initial, Last name initial, and Designation and date – dd/mm/yy (e.g.,  J.W Doctor).   
        n.SignStamp = Vitro.Elements.GetUserDetails(n.SignerDetails).Initial + " " + Vitro.Elements.GetUserDetails().Role + " " + curDate;
            
        c.Value(n);

        // Set “Alert type” field for that row as readonly              
        p.txtAlertName[index].Disable();
        p.txtAlertType[index].Disable();
        p.txtReaction[index].ReadOnly(true);
        // Enable cease sign in current row
        p.auCeasedSignature[index].Writeable();
        
        // stk creation is removed here            
        // Add row entry to "JSON" object
        var rowCount = GetPageNumber(p) * NUM_ALERT_REPS;
        var jRow = parseInt(index) + rowCount;
        if (index < 17) {
            AddJsonOpenAlertEntry(p, n, jRow, index);
        } else {
            AddJsonOtherAlertEntry(p, n, jRow, index);
        }        

        // Set “Alert Type” field in the next row only as editable unless it is the last row.  
        if (index < NUM_ALERT_REPS) {
            if (index + 1 < NUM_ALERT_REPS) {
                EnableAvailableRow(p);
            }
            else {
                
                // check if there are available alerts row on any page if none clone pg2
                var availablePage = FindAlertsPage();
                if (p == availablePage || availablePage == undefined) {                    
                
                    // IF Signature is signed on the last row on Section 3 on that page. AND An overflow for that page has not been created already 
                    // Create an overflow of page 2 as per the following:   
                    //   It is an overflow of page 2 that we are creating 
                    var pg2Clone = myApp.PageManager.Clone(pg2);
                        
                    myPages_Added(pg2Clone);            
                    // Page order is from Newest to Oldest - Overflow page becomes Page 2 once created. Page 2 becomes Page 3. (i.e. Overflow Page becomes page 2)   
                    pg2Clone.Order(p.Order()+1);

                    Set_Page2_Title(pg2Clone);

                    if (pg2.lblDraft.Properties.IsVisible()) { pg2Clone.lblDraft.Show(true); }
                        
                    // Populate the patient label (Section 1) 
                    Vitro.Elements.SetAddressograph(myApp, pg2Clone);  
                    Vitro.Elements.GetClientLogo(myApp, pg1.Control("imgClientLogo")); 

                    // and the ‘Interpreter Required’, 
                    pg2Clone.chkInterpreterRequiredYes.Value(pg2.chkInterpreterRequiredYes.Value());
                    pg2Clone.chkInterpreterRequiredNo.Value(pg2.chkInterpreterRequiredNo.Value());
                    pg2Clone.cblInterpreterRequired.Attribute(Vitro.CONTROL.BackgroundColour,
                    pg2.cblInterpreterRequired.Attribute(Vitro.CONTROL.BackgroundColour), true);
                    // ‘If Yes, Language’, 
  
                    pg2Clone.txtIfYesLanguage.Value(pg2.txtIfYesLanguage.Value());
                    pg2Clone.txtIfYesLanguage.Attribute(Vitro.CONTROL.BackgroundColour, 
                    pg2.txtIfYesLanguage.Attribute(Vitro.CONTROL.BackgroundColour), true);
                    // ‘Advance Care Health Directive in place’ (Section 2) on the overflow page with the most recent data through scripting. 
                    pg2Clone.chkAdvanceCareHealthDirectiveYes.Value(pg2.chkAdvanceCareHealthDirectiveYes.Value());
                    pg2Clone.chkAdvanceCareHealthDirectiveNo.Value(pg2.chkAdvanceCareHealthDirectiveNo.Value());
                    pg2Clone.cblAdvanceCareHealthDirectiveInPlace.Attribute(Vitro.CONTROL.BackgroundColour,
                    pg2.cblAdvanceCareHealthDirectiveInPlace.Attribute(Vitro.CONTROL.BackgroundColour), true);

                    // Update “No known: Clinical and Non-clinical” (Checkbox) values, “Reaction” (Textbox) and “Confirmed by” (Signature Stamp) based on value from the previous page of page 2 section 3
                    pg2Clone.chkNoKnownClinicalAlerts.Value(pg2.chkNoKnownClinicalAlerts.Value());
                    pg2Clone.chkNoKnownNonClinicalAlerts.Value(pg2.chkNoKnownNonClinicalAlerts.Value());
                    pg2Clone.txtNoKnownReaction.Value(pg2.txtNoKnownReaction.Value());
                    pg2Clone.auNoKnownConfirmedBy.Value(pg2.auNoKnownConfirmedBy.Value()).Writeable();
                    // Set Readonly checkboxes if sign has value
                    if (pg2Clone.auNoKnownConfirmedBy.Value()) {
                        pg2Clone.txtNoKnownReaction.ReadOnly(true);
                        pg2Clone.chkNoKnownClinicalAlerts.ReadOnly(true);
                        pg2Clone.chkNoKnownNonClinicalAlerts.ReadOnly(true);
                    }
                    // Overflow page cannot be deleted. 
                    pg2Clone.Deletable(false);
                    Page2_Events(pg2Clone);
                    // Set the interpreter required and advanced care health checkbox list – read only, 
                    // not required and 
                    // remove highlight on previous page once overflow is created.           
                    // OLDEST TO NEWEST                
                    var pgIds = myApp.Properties.PageIDs();
                    var latestPrevPage = myApp.Page(pgIds[p.Order() - 1]);
                    latestPrevPage.Controls("cblInterpreterRequired", "txtIfYesLanguage", "cblAdvanceCareHealthDirectiveInPlace", "chkNoKnownClinicalAlerts", "chkNoKnownNonClinicalAlerts", "txtNoKnownReaction", "auNoKnownConfirmedBy").Each.ReadOnly(true).NotRequired().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
                    latestPrevPage.Control("auNoKnownConfirmedBy").NotRequired().Disable(true);                 
                  
                    for (var i = 1; i < NUM_ALERT_REPS; i++) {
                        pg2Clone.rptAlertRepeater[i].Disable();
                    }
                    Enable_Other(pg2Clone, NUM_ALERT_REPS);
                    pg2Clone.Activate();
                }
                // Show continued label 
                p.txtContinuePage.Show();
            }
        }
        else {
            if (index + 1 < NUM_ALERT_REPS + NUM_ALERT_REPS_OTHER) {
                Enable_Other(p, index + 1);
            }
        }

    }
    else 
    {      
        
        // Set “Alert type” field for that row as writeable              
        p.txtAlertName[index].Enable();
        p.txtAlertType[index].Enable();
        p.txtReaction[index].Writeable();
        // Set readonly cease sign in current row
        p.auCeasedSignature[index].ReadOnly(true);

        // if 1st row of other alert
        if (index == NUM_ALERT_REPS) {
               
            p.rptAlertRepeater[index + 1].Disable();                
            p.txtAlertName[index + 1].Disable();
        }

        // if rows are other alerts remove other alerts from json
        if (index >= NUM_ALERT_REPS) {               
            if (p.txtOtherTempID[index].Value()) {           
                         
                OtherAlertsJson[p.txtOtherTempID[index].Value()].Status = 'Deleted';
                
            }
            
        }

    } 
    
    c.Validate().Attribute(Vitro.CONTROL.BorderColour, COLOURS.TRANSPARENT, true);
}

// Page 1 section 3 – Ceased Authorisation - Change
function CeasedSignature_Change(p, c, o, n) 
{
    
    // If Cancelled and Reason Authorisation Page 1 section 3 has a value
    if (n)
    {
        var row = Vitro.Elements.GetRepeaterIndex(c);
        var rowCount = GetPageNumber(p) * NUM_ALERT_REPS;
        var jRow = row + rowCount;
        var stamp = Vitro.Elements.GetUserDetails().Initial;
        var role = Vitro.Elements.GetUserDetails().Role;
        var sDate = Vitro.Elements.GetDateString().ddMMyy;

        // Display Forename first letter and Surname e.g. M.Pascal
        n.SignStamp = stamp + " " + role + " \n" + sDate;

        // Find available Ceased Alerts - Page 3
        var ceasedAlertsPage = FindCeasedAlertsPage();
      
        if (ceasedAlertsPage)
        {
            // Copy all data of the row to the end of the list on page 3 (or its most recent overflow)
            CopyAlertsToCeased(p, jRow, row, n, ceasedAlertsPage);
        }
        // If there is no available row on page 3
        else
        {
            // Create overflow of Ceased Alerts - Page 3
            var ceasedAlertsClonePage = CloneCeasedAlertsPage();
            CopyAlertsToCeased(p, jRow, row, n, ceasedAlertsClonePage);
        }

        // Remove row entry from "JSON" object
        if (row < NUM_ALERT_REPS) {
            OpenAlertsJson[jRow] = null;
        } 
        else {
            // tagged otheralertsobj to ceased            
            if (p.txtOtherTempID[row].Value()) {           
                         
                OtherAlertsJson[p.txtOtherTempID[row].Value()].Status = 'Ceased';

            }
        }      

        // Iterate all pages
        myApp.PageManager.All().Iterate(function(pg) {

            if (pg.Properties.ID().indexOf("pg2") != -1)
            {
                // Reset Alerts page rows with data - Page 2
                ResetAllRows(pg);
            }
        });

        // Remove null data from open alerts json else from other alerts json ob
        if (row < NUM_ALERT_REPS) {
            CleanAlertJsonObj();
        }
        // Repopulate Alerts pages with entries from "JSON" object exclude others row      
        PopulateRowsData();      
    
        if (row >= NUM_ALERT_REPS) {    
            
            ResetRow(p, row);
            Enable_Other(p, row); 
            p.txtAlertName[row].Enable();
            // check if 1st other row has data (priority is the 1st other row disable 2nd row )
            if (row == NUM_ALERT_REPS) {
                p.txtAlertName[row + 1].Disable();
            }
            else {
                if (p.txtAlertName[row - 1].Value() == "") {
                    p.txtAlertName[row].Disable();
                }
            } 

        }
                       
        var availablePage = FindAlertsPage();
        
        if (row < NUM_ALERT_REPS) {               
            // Hide the "Continued on 'Next' page" textbox
            availablePage.txtContinuePage.Hide();
        }
    }
}

// Find available Alerts page and enable row - Page 2
function FindAlertsPage() 
{
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var len = pageIds.length - 1;
    var pgOpenAlerts;

    for (var k = 0; k < len; k++) 
    {
        var pgID = pageIds[k];

        if (pgID.indexOf("pg2") != -1)
        {
            pgOpenAlerts = myApp.PageManager.Page(pgID.toString());

            if (pgOpenAlerts.txtAlertType[NUM_ALERT_REPS - 1].Value() == "") 
            {
                break;
            }
        }
    }

    // Make next available control editable
    EnableAvailableRow(pgOpenAlerts);

    return pgOpenAlerts;
}

// Find and enable available row - Page 2
function EnableAvailableRow(page) 
{
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var len = pageIds.length - 1;

    for (var k = 0; k < len; k++) 
    {
        var pgID = pageIds[k];
        var page = myApp.PageManager.Page(pgID.toString());

        if (pgID.indexOf("pg2") != -1)
        {
            for (var i = 0; i < NUM_ALERT_REPS; i++) 
            {             
                var auObj = page.auSignature[i];

                if (auObj.Value() == "")
                {
                    page.pnlAlertTable.Enable();
                    page.rptAlertRepeater.Enable();
                    page.rptAlertRepeater[i].Enable();
                    page.txtAlertType[i].Enable();
                    page.txtAlertName[i].Enable();
                    
                    k = len;
                    break;
                }
            }
        }
    }
}

// Find available Ceased Alerts - Page 3
function FindCeasedAlertsPage() 
{
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var len = pageIds.length - 1;
    var ceasedAlertsPage;

    for (var k = len; k >= 0; k--) 
    {
        var pgID = pageIds[k];

        if (pgID.indexOf("pg3") != -1)
        {
            ceasedAlertsPage = myApp.PageManager.Page(pgID.toString());

            if (ceasedAlertsPage.Control("txtAlertType["+ (parseInt(NUM_CEASE_REPS) - 1) + "]").Value() == "") 
            {
                return ceasedAlertsPage;
            }
        }
    }

    return false;
}

// Get the last order of the given page name. Order is 1-indexed.
function GetPageLastOrder(pageName) 
{
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();

    for (var i = pageIds.length - 1; i >= 0; i--) 
    {
        var pgID = pageIds[i];

        if (pgID.indexOf(pageName) != -1)
        {
            var page = myApp.PageManager.Page(pgID.toString());
            var order = page.Order();

            return order;
        }
    }
}

// Get overflow page count
function GetPageNumber(page) 
{
    var pgID = page.Properties.ID();
    var strOf = pgID.indexOf("of") + 2;
    var pgNum = parseInt(pgID.slice(strOf, pgID.length));

    pgNum = pgNum || 0;

    return pgNum;
}

// Reset rows with data - Page 2
function ResetAllRows(p)
{
    for (var i = 0; i < NUM_ALERT_REPS; i++) 
    {
        var alertTypectrl = p.txtAlertType[i];

        if (alertTypectrl.Properties.IsEnabled() || alertTypectrl.Value() != "")
        {
            ResetRow(p, i);
        }
    }
}

// Reset a row in the repeater - Page 2
function ResetRow(p, row) 
{
    p.txtAlertType[row].Value("");
    p.txtAlertName[row].Value("");
    p.txtReaction[row].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true); 
    ClearSignature(p.auSignature[row]);
	p.txtAlertID[row].Value("");
    p.txtOtherTempID[row].Value("");
    
    ClearSignature(p.auCeasedSignature[row]);

    p.rptAlertRepeater[row].Disable();
    p.txtReaction[row].ReadOnly(true).NotRequired();
    p.auSignature[row].ReadOnly(true).NotRequired();    
    p.auCeasedSignature[row].ReadOnly(true).NotRequired();

   // HighlightRow(p, row, false);
}

// Clear authorisation control
function ClearSignature(auCtrl) 
{
    // Store the original "Clear" string, as per Blueprint
    var clear = auCtrl.ClearContent;
    auCtrl.Attribute(Vitro.AUTHORISATION.ClearContent, clear, true);
    auCtrl.Value("");
    auCtrl.Value().SignerDetails = "";
    auCtrl.Value().SignStamp = "";
    auCtrl.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true); 
}

// Copy Alerts row data to Ceased Alerts row (Page 2 to Page 3)
function CopyAlertsToCeased(page2, jRow, row, cancelSignValue, page3) 
{
    
    // Page 2 data
    var dateTime;
    var alertType;
    var alertName;
    var reaction;
	var alertID;
    var alertSign;
    var cancelSign;

    if (row < NUM_ALERT_REPS) {
         // if row is not empty / undefined and null
         if (OpenAlertsJson[jRow] !== undefined && OpenAlertsJson[jRow] !== null) {
            dateTime = OpenAlertsJson[jRow].dateTimeCreated;
            alertType = OpenAlertsJson[jRow].txtAlertType;
            alertName = OpenAlertsJson[jRow].txtAlertName;
            reaction = OpenAlertsJson[jRow].txtReaction;      
            alertSign = OpenAlertsJson[jRow].auAlertSign;    
            alertID = OpenAlertsJson[jRow].txtAlertID;
         }       
      
    } else {
        
       if (page2.txtOtherTempID[row].Value()) {

            if (page2.txtOtherTempID[row].Value() >= OtherAlertsJson.length && OtherAlertsJson.length > 0) {
                jRow = OtherAlertsJson.length - 1;
            } else {
                jRow = page2.txtOtherTempID[row].Value();
            }
           
       }
       if (OtherAlertsJson[jRow] !== undefined && OtherAlertsJson[jRow] !== null) {
            dateTime = OtherAlertsJson[jRow].dateTimeCreated;
            alertType = OtherAlertsJson[jRow].txtAlertType;
            alertName = OtherAlertsJson[jRow].txtAlertName;
            reaction = OtherAlertsJson[jRow].txtReaction;        
            alertSign = OtherAlertsJson[jRow].auAlertSign;
            alertID =  OtherAlertsJson[jRow].txtAlertID;      
       }
    
    }
    
    cancelSign = cancelSignValue;
	
    // Find available Ceased Alerts row - Page 3
    var ceasedAlertsRow = FindCeasedAlertsRow(page3);
	
    if (alertType !== undefined && alertName !== undefined && reaction !== undefined && alertID !== undefined && alertSign !== undefined && cancelSign !== undefined) {
        page3.Control("txtAlertType[" + ceasedAlertsRow + "]").Value(alertType);
        page3.Control("txtAlertName[" + ceasedAlertsRow + "]").Value(alertName.toString());
        page3.Control("txtReaction[" + ceasedAlertsRow + "]").Value(reaction);
        page3.Control("txtAlertID[" + ceasedAlertsRow + "]").Value(alertID);
        page3.Control("auSignature[" + ceasedAlertsRow + "]").Value(alertSign);   
        page3.Control("auCeasedSignature[" + ceasedAlertsRow + "]").Value(cancelSign);
    
        CeaseAlertsJson[CeaseAlertsJson.length] = {
            "dateTimeCreated": dateTime,
            "txtAlertType": alertType,
            "txtAlertName": alertName,
            "txtReaction": reaction,
            "txtAlertID": alertID,
            "auAlertSign": alertSign,        
            "isReadOnly": ""
        };
    }


}

// Create overflow of Ceased Alerts - Page 3
function CloneCeasedAlertsPage() 
{
    
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var lastIndex = pageIds.length - 1;

    // Get latest Ceased Alerts page
    var pgID = pageIds[lastIndex];
    var latestCeasedAlertsPage = myApp.PageManager.Page(pgID.toString());
    latestCeasedAlertsPage.txtContinuePage.Show();

    var order = GetPageLastOrder("pg3") + 1;
    // Create an overflow page from the original page
    var pgCeasedAlertsClone = myApp.PageManager.Clone(pg3);

    // Set the page title tab: Alerts + Page creation date format: dd/mm/yy   
    Set_Page3_Title(pgCeasedAlertsClone);    
    
    // Page order is from Oldest to Newest and cannot be deleted
    pgCeasedAlertsClone.Order(order).Deletable(false);
    
    myPages_Added(pgCeasedAlertsClone);

    // Populate the patient labels
    Vitro.Elements.SetAddressograph(myApp, pgCeasedAlertsClone);

    pgLatestAlerts = FindAlertsPage();
    pgCeasedAlertsClone.txtIfYesLanguage.Value(pgLatestAlerts.txtIfYesLanguage.Value());
    pgCeasedAlertsClone.chkInterpreterRequiredYes.Value(pgLatestAlerts.chkInterpreterRequiredYes.Value());
    pgCeasedAlertsClone.chkInterpreterRequiredNo.Value(pgLatestAlerts.chkInterpreterRequiredNo.Value());

    return pgCeasedAlertsClone;
}

// Find available Ceased Alerts row - Page 3
function FindCeasedAlertsRow(p) 
{
    for (var i = 0; i < NUM_CEASE_REPS; i++) 
    {
        var txtObj = p.Control("txtAlertType[" + i + "]");

        if (txtObj.Value() == "")
        {
            return i;
        }
    }
}

// Add row entry of active alert to "JSON" object
function AddJsonOpenAlertEntry(page, auAlertValue, jRow, row) 
{
    var curDate = Vitro.Elements.GetDateString().ddMMyyyyHHmm;

    OpenAlertsJson[jRow] = {
        "dateTimeCreated": curDate,
        "txtAlertType": page.txtAlertType[row].Value(),
        "txtAlertName": page.txtAlertName[row].Value(),
        "txtReaction": page.txtReaction[row].Value(),
        "txtAlertID": page.txtAlertID[row].Value(),
        "auAlertSign": auAlertValue,        
        "isReadOnly": ""
    };
}

// Add row entry of Other alert to "JSON" object
function AddJsonOtherAlertEntry(page, auAlertValue, jRow, row) 
{
  
    var curDate = Vitro.Elements.GetDateString().ddMMyyyyHHmm;

    // Overwrite jRow so the id is in order in json 
    jRow = OtherAlertsJson.length;

    OtherAlertsJson[jRow] = {        
        "dateTimeCreated": curDate,
        "txtAlertType": page.txtAlertType[row].Value(),
        "txtAlertName": page.txtAlertName[row].Value(),
        "txtReaction": page.txtReaction[row].Value(),
        "txtAlertID": page.txtAlertID[row].Value(),
        "auAlertSign": auAlertValue,                
        "isReadOnly": "",
        "txtOtherTempID": jRow,
        "Status": ""
    };

    page.txtOtherTempID[row].Value(jRow);
}

// Remove null data from open alerts JSON
function CleanAlertJsonObj() 
{
    
    var len = OpenAlertsJson.length - 1;
       
    for (var j = len; j >= 0; j--) 
    {
        // Remove null data from json
        if (OpenAlertsJson[j] === null)
        {  
            OpenAlertsJson.splice(j ,1);     
          
        }
    }
  
}

// Remove null data from other alerts JSON
function CleanOtherAlertJsonObj() 
{
    
    var len = OtherAlertsJson.length - 1;
       
    for (var j = len; j >= 0; j--) 
    {
        // Remove null data from json
        if (OtherAlertsJson[j] === null)
        {  
            OtherAlertsJson.splice(j ,1);     
          
        }
    }
  
}

function Enable_Other(p, index) {
    var newPos = p.txtAlertType[index].Attribute(Vitro.CONTROL.Position).split(",");
    var OTHER = "Other";
    p.rptAlertRepeater[index].Enable();
    p.txtAlertType[index].Value(OTHER).Hide();
    p.txtAlertName[index].Writeable(true).Attribute(Vitro.CONTROL.Width, 275, true);
    p.txtAlertName[index].Writeable(true).Attribute(Vitro.CONTROL.Position, "48," + parseInt(newPos[1]), true);   
    p.txtAlertName[index].Enable();
}

function InitializeDataSource() {
    // Set the table/view to reference and configure
    Clinical_Alerts.Property(Vitro.DATASOURCE.Json, JSON.stringify(JsonObj));
    Clinical_Alerts.Property(Vitro.DATASOURCE.PreLoad, "true");
    Clinical_Alerts.Property(Vitro.DATASOURCE.Rows, "20");
    Clinical_Alerts.Property(Vitro.DATASOURCE.Title, "CLINICAL ALERTS DATA");
    Clinical_Alerts.Property(Vitro.DATASOURCE.Display, "CLINICAL ALERTS DATA");

    // Select the columns from the table and view to be available and set the display title and visibility of each
    Clinical_Alerts.Column("ALERT_TYPE", "Alert Type", true);
    Clinical_Alerts.Column("ALERT_NAME", "Alert Name", true);

    Clinical_Alerts.Initialise();
    // Where the result will be passed too
    Clinical_Alerts.Events.Ok(Clinical_Alerts_OK);    
}

function Clinical_Alerts_OK() {
    var page = myApp.PageManager.GetActive();
    for (var r = 0; r < NUM_ALERT_REPS; r++) {
        if (page.auSignature[r].Value() == "") {
            // IF The selected alert type matches a Vitro Alert 
            var vitroAlert = Vitro.Workflow.GetAlerts();
            var alertListed = false;
            for (var a = 0; a < vitroAlert.length; a++) {
                if (vitroAlert[a].Name.replaceAll(" ", "") == Clinical_Alerts.Value(0, "ALERT_TYPE").replaceAll(" ", "")) {
                    alertListed = true;
                    break;
                }
            }
            // IF The selected alert type matches a Vitro Alert 
            if (alertListed) {
                // Populate ‘Alert Type’ with values from data source.  
                page.txtAlertType[r].Value(Clinical_Alerts.Value(0, "ALERT_TYPE"));
                // Populate ‘Alert Type’ with Alert Name 
                page.txtAlertName[r].Value(Clinical_Alerts.Value(0, "ALERT_NAME"));
                page.txtAlertName[r].Attribute(Vitro.CONTROL.FontSize, 13, true);
                // Resizing font if the textbox has reached limit overflow
                if (page.txtAlertName[r].Attribute("IsTextOverflowing") === 'True') {
                    for (var i = 12; i > 7; i--) {
                        page.txtAlertName[r].Attribute(Vitro.CONTROL.FontSize, i, true);
                        if (page.txtAlertName[r].Attribute("IsTextOverflowing") === 'False') { break; }
                    } 
                }
                    
                Alerts_Change(page, page.txtAlertType[r], undefined, page.txtAlertType[r].Value());
            }
            // ELSE
            else {
                // Create a dynamic pop-up containing the following warning text - 
                //  “No matching Vitro Alert was found that matches the selected Alert. 
                //  Please create as an "Other" type of Alert and contact support”. 
                var ALERT_POPUP = "No matching Vitro Alert was found that matches the selected Alert. Please create as an 'Other' type of Alert"; 
                CreateConfirmPopUp(page, ALERT_POPUP);
            }
            break;
        }
    }
}

// Repopulate Alerts pages with entries from "JSON" object - Page 2
function PopulateRowsData() 
{
    
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var len = pageIds.length - 1;
    var pgCount = 0;

    for (var k = 0; k < len; k++) 
    {
        var pgID = pageIds[k];

        if (pgID.indexOf("pg2") != -1)
        {
            var page = myApp.PageManager.Page(pgID.toString());
            var idxCount = pgCount * NUM_ALERT_REPS;
            var jsonLenPerPage = OpenAlertsJson.length - idxCount;

            for (var i = 0; i < jsonLenPerPage; i++) 
            {
                page.txtAlertType[i].Value("");
                page.txtAlertName[i].Value("");
                page.txtReaction[i].Value("").Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
				page.txtAlertID[i].Value("");
                ClearSignature(page.auSignature[i]);                
                ClearSignature(page.auCeasedSignature[i]);

                var idx = i + idxCount;

                if (OpenAlertsJson[idx] !== undefined && OpenAlertsJson[idx] !== null) {
                    page.txtAlertType[i].Value(OpenAlertsJson[idx].txtAlertType);
                    page.txtAlertName[i].Value(OpenAlertsJson[idx].txtAlertName);
                }

                // Set default size to 13 
                page.txtAlertName[i].Attribute(Vitro.CONTROL.FontSize, 13, true);
                    // Resizing font if the textbox has reached limit overflow
                    if (page.txtAlertName[i].Attribute("IsTextOverflowing") === 'True') {
                        for (var j = 12; j > 7; j--) {
                            page.txtAlertName[i].Attribute(Vitro.CONTROL.FontSize, j, true);
                            if (page.txtAlertName[i].Attribute("IsTextOverflowing") === 'False') { break; }
                        } 
                    }

                if (OpenAlertsJson[idx] !== undefined && OpenAlertsJson[idx] !== null) {
                    page.txtReaction[i].Value(OpenAlertsJson[idx].txtReaction);
                    page.txtAlertID[i].Value(OpenAlertsJson[idx].txtAlertID);
                    page.auSignature[i].Value(OpenAlertsJson[idx].auAlertSign);
                }
          
                page.auCeasedSignature[i].Enable().Writeable();

                if (OpenAlertsJson[idx] !== undefined && OpenAlertsJson[idx] !== null) {
                    if (OpenAlertsJson[idx].isReadOnly === true)
                    {
                        page.auSignature[i].ReadOnly();
                    }
                    else
                    {
                        page.rptAlertRepeater[i].Enable();
                        page.auSignature[i].Enable().Writeable();
                        
                    }
                }

                if (idx == OpenAlertsJson.length - 1)
                {
                    k = len;
                }
                
                if (i == (NUM_ALERT_REPS - 1))
                {
                    pgCount++;
                    break;
                }
            }
        }
    }
}

// Create Dynamic verfication pop-up controls
function CreateVerificationPopUp(page) {
    
    if (page.Properties.ID().indexOf("pg1") != -1 || page.Properties.ID().indexOf("pg2") != -1) {
    
        myApp.PageNavigationVisibility(false);
        myApp.ActionBarVisibility(false);
        // Overlay Panel
        CreateDynamicControl(page, "OverlayPanel", Vitro.TYPE.Panel, PAGE_HEIGHT.toString(), PAGE_WIDTH.toString(), "99", "0,0", COLOURS.TRANSPARENT);

        // Verification Panel
        CreateDynamicControl(page, "PopupPanel", Vitro.TYPE.Panel, 170, 550, "0", "230,600", "255,255,165,0", "OverlayPanel");
        page.PopupPanel.Attribute(Vitro.CONTROL.Border, "True");

        // Verification Label
        CreateDynamicControl(page, "lblMessage", Vitro.TYPE.Textbox, 190, 500, "0", "30,15", COLOURS.TRANSPARENT, "PopupPanel");
        page.lblMessage.Attribute(Vitro.CONTROL.Border, "False");
        page.lblMessage.Attribute(Vitro.CONTROL.FontSize, "19");
        page.lblMessage.Attribute(Vitro.CONTROL.FontWeight, "Bold");
        page.lblMessage.Attribute(Vitro.CONTROL.FontStyle, "Italic");
        page.lblMessage.Attribute(Vitro.CONTROL.FontFamily, "Lucida Console");
        page.lblMessage.Attribute(Vitro.LABEL.TextAlignment, "Center");
        page.lblMessage.Value(POPUP_VERIFICATION_MESSAGE).ReadOnly();

        // Verification OK Button
        CreateDynamicControl(page, "btnPopup", Vitro.TYPE.Button, 35, 100, "0", "220,130", COLOURS.TRANSPARENT, "PopupPanel");
        page.btnPopup.Attribute(Vitro.BUTTON.Border, "True");
        page.btnPopup.Attribute(Vitro.BUTTON.FontFamily, "Courier New");
        page.btnPopup.Attribute(Vitro.BUTTON.FontSize, "18");
        page.btnPopup.Attribute(Vitro.BUTTON.FontWeight, "Bold");
        page.btnPopup.Attribute(Vitro.BUTTON.TextAlignment, "Center");
        page.btnPopup.Attribute(Vitro.BUTTON.ButtonText, "OK");

        evConfirm = page.btnPopup.Events.Click(btnPopup_Click);
        
        // Set the position of the verification panel                
        PositionVerificationPopup(page);        
 
        // set events
        VerificationPopupEvents = {
            evScroll: page.Events.Scrolled(PositionVerificationPopup),
            evZoom: page.Events.Zoomed(PositionVerificationPopup),
            evResize: Vitro.Events.Resized(PositionVerificationPopup)
        };
    }
}

// position specific verification popup 
function PositionVerificationPopup(page) {
    if (!page){
        page = myApp.PageManager.GetActive();
    }
    // Get the coords    
    var scrollY = page.Properties.ScrollY();
    var zoom = page.Properties.Zoom();
 
    // View with and height in form scale
    var viewH = myApp.Properties.ViewHeight() / zoom;
 
    // Enforce page limits
    if (viewH > PAGE_HEIGHT) {
        viewH = PAGE_HEIGHT;
    }
 
    // Get the dialog size
    var panH = parseInt(page.PopupPanel.Attribute(Vitro.CONTROL.Height), 10);
    // Calc the position to center
    var posY = Math.round(scrollY / zoom + (viewH - panH) / 1.2);
     
    var pos;  
    pos = (PAGE_WIDTH / 3.3) + "," + posY;
    page.PopupPanel.Attribute(Vitro.CONTROL.Position, pos, false);
   
 }

// Create Dynamic Seal pop-up controls
function CreateSealPopUp(page) {
    
    myApp.PageNavigationVisibility(false);
	myApp.ActionBarVisibility(false);
    // Overlay Panel
    CreateDynamicControl(page, "OverlayPanel", Vitro.TYPE.Panel, PAGE_HEIGHT.toString(), PAGE_WIDTH.toString(), "99", "0,0", COLOURS.TRANSPARENT);

    // Confirm Panel
    CreateDynamicControl(page, "PopupPanel", Vitro.TYPE.Panel, 170, 550, "0", "0,0", "255,255,165,0", "OverlayPanel");
    page.PopupPanel.Attribute(Vitro.CONTROL.Border, "True");

    // Confirm Activity Label
    CreateDynamicControl(page, "lblMessage", Vitro.TYPE.Textbox, 190, 490, "0", "30,15", COLOURS.TRANSPARENT, "PopupPanel");
    page.lblMessage.Attribute(Vitro.CONTROL.Border, "False");
    page.lblMessage.Attribute(Vitro.CONTROL.FontSize, "19");
    page.lblMessage.Attribute(Vitro.CONTROL.FontWeight, "Bold");
    page.lblMessage.Attribute(Vitro.CONTROL.FontStyle, "Italic");
    page.lblMessage.Attribute(Vitro.CONTROL.FontFamily, "Lucida Console");
    page.lblMessage.Attribute(Vitro.LABEL.TextAlignment, "Center");
    page.lblMessage.Value(POPUP_SEAL_MESSAGE).ReadOnly();

    CreateDynamicControl(page, "imgIcon", Vitro.TYPE.Image, 40, 45, "1", "485,17", COLOURS.TRANSPARENT, "PopupPanel");
    page.imgIcon.Attribute(Vitro.CONTROL.Border, "False");    
    page.imgIcon.Attribute(Vitro.IMAGE.URI, IMG_ALERT_ICON);
    page.imgIcon.ReadOnly();

    // Confirm Button
    CreateDynamicControl(page, "btnSealPopupOK", Vitro.TYPE.Button, 35, 100, "0", "170,130", COLOURS.TRANSPARENT, "PopupPanel");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.Border, "True");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.FontFamily, "Courier New");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.FontSize, "18");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.FontWeight, "Bold");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.TextAlignment, "Center");
    page.btnSealPopupOK.Attribute(Vitro.BUTTON.ButtonText, "OK");

    evConfirm = page.btnSealPopupOK.Events.Click(btnSealPopup_Click);

    // Confirm Button
    CreateDynamicControl(page, "btnSealPopupCancel", Vitro.TYPE.Button, 35, 100, "0", "290,130", COLOURS.TRANSPARENT, "PopupPanel");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.Border, "True");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.FontFamily, "Courier New");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.FontSize, "18");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.FontWeight, "Bold");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.TextAlignment, "Center");
    page.btnSealPopupCancel.Attribute(Vitro.BUTTON.ButtonText, "Cancel");

    evConfirm = page.btnSealPopupCancel.Events.Click(btnSealPopup_Click);
      
    // Set the position of the Confirm panel
    Vitro.Elements.SetPositionEvents(myApp, page, page.PopupPanel, PAGE_WIDTH.toString(), (PAGE_HEIGHT - 500).toString());
}

// Create Dynamic confirm pop-up controls
function CreateConfirmPopUp(page, alert_popup) {
    myApp.PageNavigationVisibility(false);
	myApp.ActionBarVisibility(false);
    // Overlay Panel
    CreateDynamicControl(page, "OverlayConfirm", Vitro.TYPE.Panel, PAGE_HEIGHT.toString(), PAGE_WIDTH.toString(), "99", "0,0", COLOURS.TRANSPARENT);

    // Confirm Panel
    CreateDynamicControl(page, "ConfirmPanel", Vitro.TYPE.Panel, 180, 450, "0", "0,0", COLOURS.WHITE, "OverlayConfirm");
    page.ConfirmPanel.Attribute(Vitro.CONTROL.Border, "True");

    // Confirm Activity Label
    CreateDynamicControl(page, "lblReminder", Vitro.TYPE.Label, 75, 390, "0", "30,25", COLOURS.TRANSPARENT, "ConfirmPanel");
    page.lblReminder.Attribute(Vitro.CONTROL.Border, "False");
    page.lblReminder.Attribute(Vitro.CONTROL.FontSize, "18");
    page.lblReminder.Attribute(Vitro.CONTROL.FontWeight, "Bold");
    page.lblReminder.Attribute(Vitro.CONTROL.FontFamily, "Arial");
    page.lblReminder.Value(alert_popup).ReadOnly();

    // Confirm Button
    CreateDynamicControl(page, "btnConfirm", Vitro.TYPE.Button, 35, 100, "0", "175,115", COLOURS.TRANSPARENT, "ConfirmPanel");
    page.btnConfirm.Attribute(Vitro.BUTTON.Border, "True");
    page.btnConfirm.Attribute(Vitro.BUTTON.FontFamily, "Courier New");
    page.btnConfirm.Attribute(Vitro.BUTTON.FontSize, "18");
    page.btnConfirm.Attribute(Vitro.BUTTON.FontWeight, "Bold");
    page.btnConfirm.Attribute(Vitro.BUTTON.TextAlignment, "Center");
    page.btnConfirm.Attribute(Vitro.BUTTON.ButtonText, "OK");

    evConfirm = page.btnConfirm.Events.Click(btnConfirm_Click);
    
    // Set the position of the Confirm panel
    Vitro.Elements.SetPositionEvents(myApp, page, page.ConfirmPanel, PAGE_WIDTH.toString(), PAGE_HEIGHT.toString());
}

// Create dynamic control
function CreateDynamicControl(page, controlName, controlType, height, width, zindex, position, backcolour, parentControl) {
    var properties = {};
    properties[Vitro.CONTROL.Name] = controlName;
    properties[Vitro.CONTROL.Height] = height;
    properties[Vitro.CONTROL.Width] = width;
    properties[Vitro.CONTROL.Position] = position;
    properties[Vitro.CONTROL.BackgroundColour] = backcolour;
    properties[Vitro.CONTROL.ZIndex] = zindex;

    page.CreateControl(controlType, properties, parentControl);
}

// Event handler when Confirm is click
function btnConfirm_Click(page, ctrl, xlocation, ylocation) {
    
    page.DestroyControl("OverlayConfirm");
    RemoveEvents();
    myApp.PageNavigationVisibility(true);
	myApp.ActionBarVisibility(true);
}

// Event handler when btn popup is click
function btnPopup_Click(page, ctrl, xlocation, ylocation) {
    page.DestroyControl("OverlayPanel");
    RemoveEvents();

    if(VerificationPopupEvents != "" || VerificationPopupEvents != null) {
           // remove all events
            for (var obj in VerificationPopupEvents) {
                if (VerificationPopupEvents.hasOwnProperty(obj)) {
                    var eventObj = VerificationPopupEvents[obj];
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
            VerificationPopupEvents = {};   
    }
   
    myApp.PageNavigationVisibility(true);
	myApp.ActionBarVisibility(true);
}

// Event handler when btn Seal popup is click
function btnSealPopup_Click(page, ctrl, xlocation, ylocation) {
  
    page.DestroyControl("OverlayPanel");
    RemoveEvents();
    myApp.PageNavigationVisibility(true);
	myApp.ActionBarVisibility(true);
    if (ctrl.Properties.ID() === "btnSealPopupOK") {
        RemoveAllActiveAlerts();
        myApp.Action(Vitro.ACTIONS.Seal);
    }    
    
}

// Remove all events in dynamic controls
function RemoveEvents() {
    if (evConfirm != null && evConfirm != "") {
        evConfirm.Remove();
        evConfirm = null;
    }    
}

// Creates alert 
function CreateAlertInstance(id, detail, createdDate) {
    // Create an instance of the Alert for the patient 
	var newAlert = new Vitro.Workflow.AlertInstance();

    newAlert.PatientId = myApp.Activity.Properties.Patient(Vitro.PATIENT.ID);
    newAlert.CreateUser = Vitro.Users().Property(Vitro.USER.Id);
    newAlert.AlertId = Vitro.Workflow.GetAlert(id);
    // Set the “Detail” property in the Alert instance with value from “Alert Name” textbox on page 2 section 3 and 
    // “Reaction” textbox on page 2 section 3 – (For example “Food Allergy - Rash”) 
	newAlert.Detail = detail;
    // Set the “StartDate” property in the Alert instance with the date from “Signature” authorization field 
    // newAlert.StartDate = null;
	newAlert.EndDate = null;
	
	var alertInstance = newAlert.Create();

    if (alertInstance != null) {
        return alertInstance.AlertInstanceId;
    } 
    else {
        return null;
    }
	
}

// Removes alert (updating enddate)
function RemoveAlertInstance(page, row) {
    if (page.txtAlertID[row].Value() !== "") 	{
        var alertInstance = Vitro.Workflow.SelectAlertInstance(parseInt(page.txtAlertID[row].Value(), 10));
        alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
        alertInstance.Update();
        page.txtAlertID[row].Value("");
        return alertInstance;
    }
    else {
        return null;
    }
}

// Removes all alerts of patient (tagging all enddate)
function RemoveAllActiveAlerts() {
    
    if (OpenAlertsJson.length > 0) {
        for (var i = 0; i < OpenAlertsJson.length; i++) {
            if (OpenAlertsJson[i] !== undefined && OpenAlertsJson[i] !== null) {
                var alertInstance = Vitro.Workflow.SelectAlertInstance(OpenAlertsJson[i].txtAlertID);
                if (alertInstance != null && alertInstance.EndDate == null) {
                    alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
                    alertInstance.Update();
                }
            }        
        }
    }

    if (OtherAlertsJson.length > 0) {
        for (var k = 0; k < OtherAlertsJson.length; k++) {
            if (OtherAlertsJson[k] !== undefined && OtherAlertsJson[k] !== null) {
                if (OtherAlertsJson[k].Status == "" && OtherAlertsJson[k].txtAlertID) {
                    var alertInstance = Vitro.Workflow.SelectAlertInstance(OtherAlertsJson[k].txtAlertID);
                    if (alertInstance != null && alertInstance.EndDate == null) {
                        alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
                        alertInstance.Update();
                    }
                } 
            } 
        }
    }

    if (CeaseAlertsJson.length > 0) {
        for (var a = 0; a < CeaseAlertsJson.length; a++) {
            if (CeaseAlertsJson[a] !== undefined && CeaseAlertsJson[a] !== null) {
                var alertInstance = Vitro.Workflow.SelectAlertInstance(CeaseAlertsJson[a].txtAlertID);
                if (alertInstance != null && alertInstance.EndDate == null) {
                    alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
                    alertInstance.Update();
                }
            }
        }
    }

    
    // To get all active alerts then delete it upon seal     
    var patID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID), 10);
    var epID = (!myApp.Activity.Properties.Episode(Vitro.EPISODE.ID)) ? 0 : parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID), 10);
    var alertInstances = Vitro.Workflow.GetAlertInstances(patID, 0);    
    
    // Update enddate of all alerts
    if (alertInstances.length > 0) {
        for (var i = 0; i < alertInstances.length; i++) {
           var alertItem = alertInstances[i]
           
            if (alertItem.EndDate == "" || alertItem.EndDate == null) {
                var alertInstance = Vitro.Workflow.SelectAlertInstance(alertItem.AlertInstanceId);
                if (alertInstance != null && alertInstance.EndDate == null) {
                    alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
                    alertInstance.Update();
                }

            }
          }
    }    

}

// check required control in all page 
function CheckRequiredControlsOnSubmit() {
        
    var allValid = true;
    
        // Check page 1 required and page 2 required controls
        if (pg1.cblMedical.Value() == -1 || pg1.cblFinancial.Value() == -1 || pg1.cblGuardship.Value() == -1 ||
            (pg1.cblIfNotProvidedOnAdmission.Properties.IsRequired() && pg1.cblIfNotProvidedOnAdmission.Value() == -1) ||
            (pg1.auStaffMember2.Properties.IsEnabled() && pg1.auStaffMember2.Value() == "") ||
            (pg2.txtIfYesLanguage.Properties.IsRequired() && pg2.txtIfYesLanguage.Value() == "") || 
             pg2.cblInterpreterRequired.Value() == -1 || pg2.cblAdvanceCareHealthDirectiveInPlace.Value() == -1 || 
            (pg2.auNoKnownConfirmedBy.Properties.IsEnabled() && pg2.auNoKnownConfirmedBy.Properties.IsRequired() && pg2.auNoKnownConfirmedBy.Value() == "")) {
                
                pg1.cblMedical.Validate();
                pg1.cblFinancial.Validate();
                pg1.cblGuardship.Validate();
                pg1.cblIfNotProvidedOnAdmission.Validate();
                pg1.auStaffMember1.Validate();
                pg1.auStaffMember2.Validate();
                pg2.txtIfYesLanguage.Validate();
                pg2.cblInterpreterRequired.Validate();
                pg2.cblAdvanceCareHealthDirectiveInPlace.Validate();
                pg2.auNoKnownConfirmedBy.Validate();

                allValid = false;


        }   
    

     myApp.Dirty();
     myApp.Validate();
     return allValid;

}

// Set readonly all signed controls for all page 2 
function SetReadOnlySign() {
    
    // Get collection of pages
    var pageIds = myApp.Properties.PageIDs();
    var len = pageIds.length - 1;
    var pgAlerts;

    for (var k = 0; k < len; k++) 
    {
        var pgID = pageIds[k];

        if (pgID.indexOf("pg2") != -1)
        {
            pgAlerts = myApp.PageManager.Page(pgID.toString());

            // set all signed controls to readonly
            for (i = 0; i < NUM_ALERT_REPS + NUM_ALERT_REPS_OTHER; i++) {
                if (pgAlerts.auSignature[i].Value()) {
                    pgAlerts.auSignature[i].ReadOnly(true);
                }
            }
        }
    }

}

// update ceased alerts of patient to vitro alerts on submit
function UpdateCeasedAlerts() {
    
    var errorAlerts = [];
    
    if (CeaseAlertsJson.length > 0) {       

        for (var i = 0; i < CeaseAlertsJson.length; i++) 
            {
                // if row is not empty / undefined and null
                if (CeaseAlertsJson[i] !== undefined && CeaseAlertsJson[i] !== null) {
                    var alertType = CeaseAlertsJson[i].txtAlertType;
                    var alertName = CeaseAlertsJson[i].txtAlertName;         
                    var alertID = CeaseAlertsJson[i].txtAlertID;             
                
                    if (alertID) {
                        var alertInstance = Vitro.Workflow.SelectAlertInstance(parseInt(alertID, 10));
                                            
                        if (alertInstance) {
                            alertInstance.EndDate = Vitro.Elements.ISOFormat(new Date()).getISODate;
                            alertInstance.Update();
                        }
                        else {
                            errorAlerts.push(alertType + ' ' +  alertName + '. Failed action: cease/update');
                        }    
                    }
                }           
            }

            if (errorAlerts.length > 0)
             {
                // IF any of the calls to create a Vitro Alert instance fails. 
                // Create browser pop-up containing the following warning text - 
                // “Failed to create/cease the following Vitro Alerts: 
                // {list of alert types that failed to be created}. Please try again to create/cease the affected alerts or contact your Vitro Administrator” 
                window.alert("Failed to cease the following Vitro Alerts: \n\n" + errorAlerts.join("\n") + "\n\n Please try again to cease the affected alerts or contact your Vitro Administrator");
                Vitro.Log(errorAlerts);
            }

        // store json to control
        pg3.txtCeaseAlertsObj.Value(JSON.stringify(CeaseAlertsJson));
    }   


}

// create/update patient vitro alerts on submit
function SubmitAlerts() {
    
    var errorAlerts = [];
    // Alerts JSON should not be empty
    if (OpenAlertsJson.length > 0) {
        
        for (var i = 0; i < OpenAlertsJson.length; i++) 
        {
            // if row is not empty / undefined and null
            if (OpenAlertsJson[i] !== undefined && OpenAlertsJson[i] !== null) {
                var createdDate = OpenAlertsJson[i].dateTimeCreated;
                var alertType = OpenAlertsJson[i].txtAlertType;
                var alertName = OpenAlertsJson[i].txtAlertName;
                var reaction = OpenAlertsJson[i].txtReaction;  
                var alertID = null;
                
                if (OpenAlertsJson[i].txtAlertID == "") {
                    alertID = CreateAlertInstance(alertType, alertName + " - " + reaction, createdDate);
    
                      // IF the value in “Alert Type” in json matches an Alert in Vitro 
                    if (alertID != null) {              
                        OpenAlertsJson[i].txtAlertID = alertID;
                    }
                    else {
                        errorAlerts.push(alertType + ' ' +  alertName + '. Failed action: create/update');
                    }
                }
            }    
          
        }

    }
    
    if (OtherAlertsJson.length > 0) {
        
        for (var i = 0; i < OtherAlertsJson.length; i++) 
        {
            // if row is not empty / undefined and null
            if (OtherAlertsJson[i] !== undefined && OtherAlertsJson[i] !== null) {
                if (OtherAlertsJson[i].Status == "") {
                    var createdDate = OtherAlertsJson[i].dateTimeCreated;
                    var alertType = OtherAlertsJson[i].txtAlertType;
                    var alertName = OtherAlertsJson[i].txtAlertName;
                    var reaction = OtherAlertsJson[i].txtReaction;  
                    var alertID = null;
                    
                    if (OtherAlertsJson[i].txtAlertID == "") {
                        alertID = CreateAlertInstance(alertType, alertName + " - " + reaction, createdDate);
    
                        // IF the value in “Alert Type” in json matches an Alert in Vitro 
                        if (alertID != null) {              
                            OtherAlertsJson[i].txtAlertID = alertID;
                        }
                        else {
                            errorAlerts.push(alertType + ' ' +  alertName + '. Failed action: create/update');
                          
                        }
                    }
                }
            }
          
           
        }

    }  
    	
	if (errorAlerts.length > 0)
        {
            // IF any of the calls to create a Vitro Alert instance fails. 
            // Create browser pop-up containing the following warning text - 
            // “Failed to create/cease the following Vitro Alerts: 
            // {list of alert types that failed to be created}. Please try again to create/cease the affected alerts or contact your Vitro Administrator” 
            window.alert("Failed to create the following Vitro Alerts: \n\n" + errorAlerts.join("\n") + "\n\n Please try again to create the affected alerts or contact your Vitro Administrator");
            Vitro.Log(errorAlerts);
        } 
    
    // store json to control 
    pg2.txtOpenAlertsObj.Value(JSON.stringify(OpenAlertsJson));   
    pg2.txtOtherAlertsObj.Value(JSON.stringify(OtherAlertsJson));   
   
}

// Check all controls if valid on cloned pages, if any control is invalid, return false
function CheckCloneValidCtrls() {
  
    var areAllValid = true;
    appObj = myApp;
   
    // check all cloned/added pages for unfilled required or invalid fields
    var pageIds = appObj.Properties.PageIDs();
    for (var i = 0; i < pageIds.length; i++) {
        if (areAllValid) {
            var page = appObj.Page(pageIds[i]);
            if (page.Properties.Type() === "Overflow") {
                CheckValidControls(page);
            }
        } else {
            return areAllValid;
        }
    }
    return areAllValid;

    // check all controls on page for required or invalid fields
    function CheckValidControls(page) {
        var pageControls = page.Properties.Controls();
        if (pageControls !== null) {
            for (var j = 0; j < pageControls.length; j++) {
                // if a required field is empty or a control is invalid, set as false
                var ctrl = page.Control(pageControls[j]);
                if (!ValidRequiredCompleted(ctrl)) {
                    areAllValid = false;
                    return;
                }
            }
        }
    }
}

// checks if all Required controls in list are completed or are all are valid
function ValidRequiredCompleted(ctrl) {
    var allComplete = true;
    // if single control
    if (typeof (ctrl.Count) == "undefined") {
        var ctrlType = ctrl.Properties.Type();
        // if a panel or repeater, check child controls
        if (ctrlType === Vitro.TYPE.Panel || ctrlType.indexOf("Repeater") !== -1) {
            allComplete = ValidRequiredCompleted(ctrl.Properties.Children());
        }// if not a button or label, check if required or valid
        else if (ctrlType !== Vitro.TYPE.Button && ctrlType !== Vitro.TYPE.Label) {
            // check validity
            if (!ctrl.Properties.IsValid()) {
                return false;
            }

            if (ctrl.Properties.IsRequired()) {
                // if requried, check if empty
                var val = ctrl.Value();
                if (val === "" || val === "-1" || val === null || val === false) {
                    allComplete = false;
                }
            }
        }
    }// if multi controls, check all
    else {
        ctrl.Iterate(function (ctrl) {
            if (allComplete) {
                allComplete = ValidRequiredCompleted(ctrl);
            }
        });
    }
    return allComplete;
}