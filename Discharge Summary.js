// Note:  further optimization and performance updates when we do further work on this app in the future
var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();

Vitro.Version("2.7");

// Register pages
var pg1 = myApp.RegisterPage("page1");
var pg2 = myApp.RegisterPage("page2");
var pg3 = myApp.RegisterPage("page3");
var pg4 = myApp.RegisterPage("page4");
var pg5 = myApp.RegisterPage("page5");
var pg6 = myApp.RegisterPage("page6");
var pg7 = myApp.RegisterPage("page7");
var pg8 = myApp.RegisterPage("page8");
var pg9 = myApp.RegisterPage("page9");
// Get collection of pages
var pageIds = myApp.Properties.PageIDs();
var latestPg2;
for (var i = pageIds.length-1; i > 0; i--) {
    if (pageIds[i].indexOf("page2") != -1) {
        latestPg2 = myApp.Page(pageIds[i]);
        break;
    }
}

var CONTRIBUTORS_COUNT = 3;
var ALLERGIES_COUNT = 15;
var FULL_ALLERGIES_COUNT = 27;
var MEDICATION_COUNT = 6;
var CEASED_MEDICATION_COUNT = 4;
var OF_MEDICATION_COUNT = 11;
var OF_CEASED_MEDICATION_COUNT = 14;
var FOLLOW_UP_COUNT = 6;
var RECIPIENT_COUNT = 4;
var REPORT_ROWS = 4;
// Please note that there is an extra space (" ") at the end of the text. Reasons:
// 1. We can't use the actual "Upload" action button as the 'actions' event is not called when cicking the action button
// 2. The custom action button can not be disabled if there is a similar pre defined action button
var BTN_UPLOAD = "Upload ";
var ALERT = "Alert Sheet MRA";
var CEASE_OPEN = "Open";
var CEASE_CANCEL = "Cancel";
var CEASED_OK = "Ceased";
var STATUS_UNSEAL = "Unseal";
var CEASE = "Cease";
var PATIENT_STRING = "Patient";
var PRINT_ACTION = "Export";

// Highlight and other background colors.
var COLOURS = Vitro.Elements.Colours;
COLOURS.COBALT = "255,6,69,173";

// Page size
var PG_WIDTH = "794";
var PG_HEIGHT = "1123";

// if user is in admin group
var isSuperUser = Vitro.Users().InGroup("Super User");

// ***** App Start *****
// Defer loading all pages
// Make page 1 as the start page 
PartialPageLoading();
// Action buttons to be displayed as per Standard Business Rules. 
// Show Cease action button according to SBR. 
Vitro.Elements.SetActionButtonVisibility(myApp);
// Create and set standard Cease functionality 
Vitro.Elements.CreateCeaseButton(myApp, PG_WIDTH, PG_HEIGHT, function(ceaseStatus) {
    if (ceaseStatus == CEASED_OK) {
        PageVisibility_Check();
    }
	if (ceaseStatus == CEASE_OPEN) {
	// Disable the custom buttons
        myApp.Disable(BTN_UPLOAD);
	}

	if (ceaseStatus == CEASE_CANCEL) {
        if (status !== Vitro.STATUS.Sealed && isSuperUser && pg9.auStaffSignNameRole.Value()) {
            // Enable the Upload action button 
            myApp.Enable(BTN_UPLOAD);
        }
	}

});
// Create custom action buttons
CreateCustomButtons();
// Set unseal implementation according to SBR. 
Vitro.Elements.SetUnsealAction(myApp, appActivityId);
//  If activity status is “Sealed
if (status == Vitro.STATUS.Sealed) {
    // Show the following action buttons
    //     “Close”, ‘Print’, ‘Upload’
    myApp.Show("Close");
    myApp.Show("Print");
}
// If activity status is not “Sealed” AND status is not “Deleted” 
if (status != Vitro.STATUS.Sealed && status != Vitro.STATUS.Deleted) {
    // Show the following action buttons 
    //  “Submit” 
    myApp.Show("Submit");
    //  “Close” 
    myApp.Show("Close");
}

// Create custom buttons
function CreateCustomButtons(){
    // Create Custom Action button Upload
    myApp.Custom(BTN_UPLOAD);
}
// Partial loading Only load the first page
function PartialPageLoading() {
    // Collection of pages
    var pgIds = myApp.Properties.PageIDs();
    // set all pages after the first to partially load
    for (var i = 2; i < pgIds.length; i++) {
        if (pgIds[i].indexOf("page2") != -1 && latestPg2.Properties.ID() != pgIds[i]) {
            myApp.Load(pgIds[i], false);
        }
    }
    // open on first page
    myApp.StartPage(pgIds[0]);
}
// ***** End of App Start *****

// App level event handlers
myApp.Events.Ready(myApp_Ready);
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);
myApp.PageManager.Events.Added(function (pg) {
    Vitro.Elements.SetAddressograph(myApp, pg);
});
myApp.PageManager.Events.Displayed(myPages_Displayed);

// ***** App Ready *****
// Default Ready handler
function myApp_Ready() {
    // Register controls
    RegisterAllControls();
}

// Register all contols including repeaters
function RegisterAllControls() {
    // Register page 1 controls
    pg1.RegisterControls("txtPatientIHI", "lblDeceasedFlag", "txtDischargingHospital", "txtWardService", "txtWardPhoneNo", "txtHospitalAddress",
        "txtDocumentAuthor", "txtDocumentAuthorPhone", "txtContributors", "txtRecipientsPg1", "dpAdmissionDate", "dpDischargeDate", "txtLengthOfStay",
        "txtClinicalUnit", "txtAdmissionSpecialities", "txtDischargeDestination", "txtDischargeDestinationComment", "txtAdmittingConsultant",
        "txtSharedCareConsultants", "lblPresentingProblem", "txtPresentingProblem", "lblPrincipleDiagnosis", "txtPrincipleDiagnosis", 
        "lblSecondaryDiagnosis", "txtSecondaryDiagnosis", "lblComplications", "txtComplications",  "lblPMHxLabel",
        "txtProceduresDuringEpisode", "chkIsIntegrated", "chkIsSubmitted", "txtPMHxConditionProcedure1", "txtPMHxConditionYear1",
        "txtPMHxConditionProcedure2", "txtPMHxConditionYear2");
    latestPg2.RegisterControls("txtClinicalSummary", "chkClinicalSummaryOverflow", "btnClinSummarySignature");
    // Register page 3 controls
    pg3.RegisterControls("lblAllergiesLabel", "cblNilKnownAllergies", "chkNilKnownAllergies", "txtAllergiesAdverseReactionsOverflowLabel", 
        "chkAllergiesAdverseReactionsOverflow", "txtAllergiesAlertsOverflowMessage", "txtAlerts", "lblSubstanceAgent",
        "lblReactionType", "lblClinicalManifestation");
    var pg3Allergies = ["rptAllergiesAdverseReactionsTable", "txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction", 
        "txtAllergyReactionCommentManifestation"];
    Vitro.Elements.RegisterRepeaterControls(pg3, pg3Allergies, ALLERGIES_COUNT);
    // Register page 4 controls
    pg4.RegisterControls("lblAllergiesAdverseReactionsTitle", "lblSubstanceAgent", "lblReactionType", "lblClinicalManifestation");
    var pg4Allergies = ["rptAllergiesAdverseReactionsOverflowTable", "txtAllergyDescriptionSubstanceOverflow", 
        "txtAllergyCategoryDescriptionReactionOverflow", "txtAllergyReactionCommentManifestationOverflow"];
    Vitro.Elements.RegisterRepeaterControls(pg4, pg4Allergies, FULL_ALLERGIES_COUNT);
    // Register page 5 controls
    pg5.RegisterControls("txtDCMedsOverflowMessage", "cblMedicationsOnDischargeCheckboxes", "chkNilMedications", "chkReferMedProfile",
        "chkAddAdditionalMedications", "txtCeasedMedsOverflowMessage", "lblCeasedMedsDoNotIncludeMessage", "chkAddAdditionalCeasedMedication",
        "chkNilCeasedMedications", "cblNilCeasedMedications");
    var pg5Medications = ["rptMedicationsOnDischargeTable", "txtDCMedNameStrength", "txtDCNumbertoTakeDirections", "txtDCMedDurationEndDate",
        "ddDCMedStatus", "txtDCMedlIndicationPurpose", "chkNoChangesMade"];
    var pg5CeasedMedications = ["rptCeasedMedicationsTable", "txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    Vitro.Elements.RegisterRepeaterControls(pg5, pg5Medications, MEDICATION_COUNT);
    Vitro.Elements.RegisterRepeaterControls(pg5, pg5CeasedMedications, CEASED_MEDICATION_COUNT);
    // Register page 6 controls
    pg6.RegisterControls("txtOverflowDCMedsPreviousMessage", "chkAddAdditionalMedications");
    var pg6MedsOverflow = ["rptOverflowMedsOnDCTable", "txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections",
        "txtOverflowDCMedDurationEndDate", "ddOverflowDCMedStatus", "txtOverflowDCMedIndicationPurpose"];
    Vitro.Elements.RegisterRepeaterControls(pg6, pg6MedsOverflow, OF_MEDICATION_COUNT);
    // Register page 7 controls
    pg7.RegisterControls("txtOverflowCeasedMedPreviousMessage", "txtOverflowCeasedMedOverflowMessage", "lblOverflowCeasedMedsDoNotIncludeMessage",
        "chkAddAdditionalCeasedMedication");
    var pg7CeasedMedsOverflow = ["rptOverflowCeasedMedicationsTable", "txtOverflowCeasedMedicineName", "txtOverflowCeasedReasonForCeasing"];
    Vitro.Elements.RegisterRepeaterControls(pg7, pg7CeasedMedsOverflow, OF_CEASED_MEDICATION_COUNT);
    // Register page 8 controls
    pg8.RegisterControl("txtInformationProvidedToPatient", "txtRecommendationsRecForOngoingMx", "txtRecommendationsPersonResponsible");
    var pg8FollowUp = ["rptFollowUpAppointmentsTable", "txtFollowUpAptDescription", "dpFollowUpAptWhenDate", "txtFollowUpAptWhenTime",
        "txtFollowUpAptWhenDescription", "ddFollowUpAptStatusDropdown", "txtFollowUpAptStatusText", "txtFollowUpAptContactDetails"];
    Vitro.Elements.RegisterRepeaterControls(pg8, pg8FollowUp, FOLLOW_UP_COUNT);
    // Register page 9 controls
    pg9.RegisterControls("ddPatientConfMedsReturned", "ddPatientConfNewMedsExplainedSupplied", "ddPatientConfXraysReturned",
        "cblPatientConfHandoutsExplainedList", "chkPatientConfHandoutsExplainedPatient", "chkPatientConfHandoutsExplainedCarer", 
        "auStaffSignNameRole", "txtInvestigationResultsDescription", "txtInvestigationResultsDate", "txtInvestigationResultsCopyAvailable",);
    var pg9Recipient = ["rptRecipientPg9Table", "txtPractitioner", "txtRecipientPg9Organisation", "txtPractitionerPhoneNo"];
    Vitro.Elements.RegisterRepeaterControls(pg9, pg9Recipient, RECIPIENT_COUNT);
}
// ***** End of App Ready *****

// ***** App Loaded *****
// Default Loaded handler
function myApp_Loaded() {
    if (status !== Vitro.STATUS.Sealed) {
        if (!pg1.Displayed) {
            pg1.Displayed = true;
            Vitro.Elements.GetClientLogo(myApp, pg1.Control("imgClientLogo"));
        }
        Page9_Signature_Check(true);
        if (pg9.auStaffSignNameRole.Value() == "") {
            // IF Admitting doctor is not on the list of Admitting Consultant 
            if (pg1.txtAdmittingConsultant.Value().indexOf(pg1.Control("txtTreatingDoctor").Value()) == -1) {
                // Add the Admitting doctor to the list of Admitting Consultant (comma separated) 
                if (pg1.txtAdmittingConsultant.Value() == "") {
                    pg1.txtAdmittingConsultant.Value(pg1.Control("txtTreatingDoctor").Value());
                }
                else {
                    pg1.txtAdmittingConsultant.Value(pg1.txtAdmittingConsultant.Value() + ", " + pg1.Control("txtTreatingDoctor").Value());
                }
            }
            // IF Page 3 repeater is empty 
            var Page3_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction", 
                "txtAllergyReactionCommentManifestation"];
            if (!Repeater_Values_Check(pg3, ALLERGIES_COUNT, Page3_Repeater_Controls) && !pg3.chkAllergiesAdverseReactionsOverflow.Value() &&
                !pg3.chkNilKnownAllergies.Value()) {
                    // Set as writable and show Page 3 Section 2 Nil Know Allergies Checkboxlist 
                    pg3.cblNilKnownAllergies.Writeable().Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
                    pg3.chkNilKnownAllergies.Show(true);
                    // Page 3 Section 2 first Allergies/Adverse Reactions Repeater top row 
                    pg3.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
                    pg3.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
            }
            else {
                if (!pg3.chkNilKnownAllergies.Value()) {
                    // Remove highlight and set as read only Page 3 Section 2 Nil Know Allergies Checkboxlist 
                    pg3.cblNilKnownAllergies.ReadOnly(true).Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
                    pg3.chkNilKnownAllergies.Value(false);
                    pg3.chkNilKnownAllergies.Hide(true);
                }
            }

            Set_Highlights_Change(pg5);
        }
    }
    
    // IF Activity is created via integration 
    if (pg1.chkIsIntegrated.Value()) {
        // Set Discharge Summary Repeater ‘Admission Date’ DatePicker Visual: Read only: True
        pg1.dpAdmissionDate.ReadOnly();
    }
    // ELSE
    else {
        // Set Discharge Summary Repeater ‘Admission Date’ DatePicker Visual: Read only: False 
        pg1.dpAdmissionDate.Writeable();
    }
    // IF Activity is NOT in Sealed or Ceased status AND 
    // IF User is part of the SuperUser group AND 
    // IF  Page 9 Section 3 Staff Name and Designation Authorisation has value 
    if (status !== Vitro.STATUS.Sealed && isSuperUser && pg9.auStaffSignNameRole.Value()) {
        // Enable the Upload action button 
        myApp.Show(BTN_UPLOAD);
    }
    // ELSE
    else {
        // Disable the Upload action button 
        myApp.Hide(BTN_UPLOAD);
    }
    // IF  Activity is NOT in Sealed or Ceased status 
    if (status !== Vitro.STATUS.Sealed) {
		if (pg1.txtPatientIHI.Value().indexOf(' ') === -1) {
	        // Set Page 1 section 2 Patient IHI Textbox Format – sets of four digits, with space between sets 
	        // for API
	        var ihiStringArray = pg1.txtPatientIHI.Value().split('');
	        ihiStringArray.splice(12, 0, ' ');
	        ihiStringArray.splice(8, 0, ' ');
	        ihiStringArray.splice(4, 0, ' ');
	        pg1.txtPatientIHI.Value(ihiStringArray.join(''));
		}
        
        // Page 3 Add Additional Allergies and Alerts checkbox has no value
        if (!pg3.chkAllergiesAdverseReactionsOverflow.Value()) {
            // Hide Page 4 
            pg4.Hide(true);
            pg4.PrintVisibility(false);
            pg4.ChartVisibility(false);
            // Hide Continued on 'Next' page textbox 
            pg3.txtAllergiesAlertsOverflowMessage.Hide();
        }
        else {
            // Show Continued on 'Next' page textbox 
            pg3.txtAllergiesAlertsOverflowMessage.Show(true);
            // Show Page 4 
            pg4.Show(true);
            pg4.PrintVisibility(true);
            pg4.ChartVisibility(true);
        }
    }
    // IF Page 1 Section 2 Discharge Date DatePicker is BLANK
    if (!pg1.dpDischargeDate.Value()) {
        // Highlight Page 1 Section 2 Discharge Date DatePicker using RGB: 128, 255, 237, 193 as per SBR 
        pg1.dpDischargeDate.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
    }
    // IF Page 1 Section 2 Discharge Destination textbox is BLANK 
    if (!pg1.txtDischargeDestination.Value()) {
        // Persist Highlight Page 1 Section 2 Discharge Destination textbox using RGB: 128, 255, 237, 193 as per SBR 
        pg1.txtDischargeDestination.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
    }
    // IF Activity is NOT in Sealed or Ceased status
    if (status !== Vitro.STATUS.Sealed) {
        // IF Activity is NOT in Sealed or Ceased status
        if (!pg9.auStaffSignNameRole.Value()) {
            // Set the second row Page 9 Section 2  
            // Recipient Name Textbox to patient first name, last name (from patient label)
            pg9.txtPractitioner[1].Value(pg1.Control("txtFirstName").Value() + " " + pg1.Control("txtSurname").Value());
            //  Recipient Organisation Textbox to blank Set  
            pg9.txtRecipientPg9Organisation[1].Value("");
            //  Recipient Contact Details Textbox to patient contact details (from patient label) 
            pg9.txtPractitionerPhoneNo[1].Value(PATIENT_STRING);
            //  And make row editable 
            pg9.rptRecipientPg9Table[1].Writeable();
        }
        // IF Activity is NOT in Sealed or Ceased status 
        Recipents_Change();
        // IF Activity is NOT in Sealed or Ceased status 
        // On first load 
        var act = Vitro.Workflow.GetActivity(appActivityId);
        if (!pg1.chkIsSubmitted.Value()) {
            // Hide Page 6
            pg6.Hide(true);
            pg6.PrintVisibility(false);
            pg6.ChartVisibility(false);
            // Hide Page 7
            pg7.Hide(true);
            pg7.PrintVisibility(false);
            pg7.ChartVisibility(false);
            pg1.chkIsSubmitted.Value(true);
        }
    }
    Set_Events();
    myApp.Clean();
}

function OpenActInNewTab_Alerts_Click(p,c,o,n) {
    if (c.Attribute(Vitro.LABEL.TextColour, COLOURS.COBALT)) {
        var actId = GetMostRecentAppSpecified(myApp, ALERT);
        Vitro.Elements.OpenActInNewTab(actId);
    }
}

function Recipents_Change(p,c,o,n) {
    //  Set Page 1 Section 3 Recipients textbox from Page 9 Section 2 Recipients - Repeater Recipient Name Textbox value 
    //  1 line for each row with a new line separator
    var recipients = "";
    for (var i = 0; i < RECIPIENT_COUNT; i++) {
        recipients += pg9.txtPractitioner[i].Value() + "\n";
    }
    pg1.txtRecipientsPg1.Value(recipients);
}

function Validate_Fields() {
    pg1.dpDischargeDate.Validate();
    pg1.txtDischargeDestination.Validate();
    pg3.cblNilKnownAllergies.Validate();
    pg3.txtAllergyDescriptionSubstance[0].Validate();
    pg3.txtAllergyCategoryDescriptionReaction[0].Validate();
    pg5.cblMedicationsOnDischargeCheckboxes.Validate();
    pg5.txtDCMedNameStrength[0].Validate();
    pg5.txtDCNumbertoTakeDirections[0].Validate();
    pg5.txtCeasedMedicineName[0].Validate();
    if(!pg3.chkNilKnownAllergies.Value() && pg3.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour) != COLOURS.RED_REQUIRED) { 
        pg3.chkNilKnownAllergies.Hide(true); 
        pg3.cblNilKnownAllergies.ReadOnly(true).Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
    }
    if(!pg5.chkNilMedications.Value() && pg5.cblMedicationsOnDischargeCheckboxes.Attribute(Vitro.CONTROL.BackgroundColour) != COLOURS.RED_REQUIRED) {
        pg5.cblMedicationsOnDischargeCheckboxes.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true); 
        pg5.chkNilMedications.Hide(true); 
    }
    
    myApp.Activity.Extra(JSON.stringify(GetJSONObject()));
    // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Print Visibility: False and Chart Visibility: False
    pg5.lblCeasedMedsDoNotIncludeMessage.Hide();
    pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Hide();
    PageVisibility_Check();
}
// ***** End of App Loaded *****

// ***** Actions *****
// Default Actions handler
function myApp_Actions(action) {
    if (action === CEASE) {
        pg9.Activate();
    }
    if (action === BTN_UPLOAD) {
        myApp.Disable(BTN_UPLOAD);
        setTimeout(SendJSONRequest, 500);
    }
    if (action === Vitro.ACTIONS.Submit || action === Vitro.ACTIONS.Seal || action === CEASE) {
        Validate_Fields();
    }
    if (action === Vitro.ACTIONS.Submit || action === Vitro.ACTIONS.Seal) {
        myApp.Activity.Extra(JSON.stringify(GetJSONObject()));
        // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Print Visibility: False and Chart Visibility: False
        pg5.lblCeasedMedsDoNotIncludeMessage.Hide();
        pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Hide();
        PageVisibility_Check();
    }
}

function GetMostRecentAppSpecified(myApp, appName) {
	// get ids
	var patID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID), 10);
	var appID = Vitro.Workflow.GetApp(appName);
	var epID = (myApp.Activity.Properties.Episode(Vitro.EPISODE.ID) == "") ? 0 :
		parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID), 10);
	var actId = 0;
	var notesActs = Vitro.Workflow.GetActivities(patID, epID, appID, Vitro.STATUS.Submitted);

	if (notesActs !== null && notesActs.length > 0) {
		actId = notesActs[notesActs.length - 1].Id;
	}
    else if (appName == ALERT) {
        actId = null; 
    } else {
		var curAct = Vitro.Workflow.CreateActivity(appID, patID, epID);

		curAct.Status = Vitro.STATUS.Submitted;
		curAct.Update();
		actId = curAct.Id;
	}

	return actId;
}
// ***** End of Actions *****

// Unload handler
function myApp_Unload() {
    myApp = null;
    Vitro.ReleaseApp(appActivityId);
}

// ***** Page Displayed *****
function myPages_Displayed(page) {
    if (!page.Displayed) {
        page.Displayed = true;
        if (page.Properties.ID().indexOf("page2") != -1 && page != latestPg2) {
            page.RegisterControls("txtClinicalSummary", "chkClinicalSummaryOverflow", "btnClinSummarySignature");
            page.txtClinicalSummary.Events.Change(Clinical_Summary_Textbpx_Change);
            page.chkClinicalSummaryOverflow.Events.Change(Clinical_Summary_Overflow_Change);
            page.btnClinSummarySignature.Events.Click(Clinical_Sign_Click);
            if (pg9.auStaffSignNameRole.Value()) {
                page.ReadOnly();
            }
        }
        if (page.Properties.ID().indexOf("page6") != -1 && page != myApp.PageManager.Master(page)) {
            page.RegisterControls("txtOverflowDCMedsPreviousMessage", "chkAddAdditionalMedications");
            var pg6MedsOverflow = ["rptOverflowMedsOnDCTable", "txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections",
                "txtOverflowDCMedDurationEndDate", "ddOverflowDCMedStatus", "txtOverflowDCMedIndicationPurpose"];
            Vitro.Elements.SetAddressograph(myApp, page);
            Vitro.Elements.RegisterRepeaterControls(page, pg6MedsOverflow, OF_MEDICATION_COUNT);
        }
        if (page.Properties.ID().indexOf("page7") != -1 && page != myApp.PageManager.Master(page)) {
            var pg7CeasedMedsOverflow = ["rptOverflowCeasedMedicationsTable", "txtOverflowCeasedMedicineName", "txtOverflowCeasedReasonForCeasing"];
            page.RegisterControls("txtOverflowCeasedMedPreviousMessage", "txtOverflowCeasedMedOverflowMessage", "lblOverflowCeasedMedsDoNotIncludeMessage",
                "chkAddAdditionalCeasedMedication", "txtContinuedPreviousPage");
            Vitro.Elements.SetAddressograph(myApp, page);
            Vitro.Elements.RegisterRepeaterControls(page, pg7CeasedMedsOverflow, OF_CEASED_MEDICATION_COUNT);
        }
    }
}

// ***** Control Events *****
function Set_Events() {
    // ***** Page 1 Events *****
    // Page 1 Section 2 Admission Date DatePicker - Change 
    pg1.dpAdmissionDate.Events.Change(Admission_Date_Change);
    // Page 1 Section 2 Discharge Date DatePicker - Change 
    pg1.dpDischargeDate.Events.Change(Discharge_Date_Change);
    // Page 1 Section 2 Discharge Destination Textbox – Click
    // Page 1 Section 2 Discharge Destination Textbox - Change 
    pg1.txtDischargeDestination.Events.Click(Dischrge_Destination_Click);
    // Page 1 Section 4 Presenting Problem, Principal Diagnosis, Secondary Diagnosis, Complications, Past Medical History Labels - On Hover 
    pg1.lblPresentingProblem.ToolTip("Symptoms, disorder or concern expresses by the patient when seeking care. For elective surgical \nadmissions, if the Presenting Problem is not known or documented it can be entered as \"elective admission for\"");
    pg1.lblPrincipleDiagnosis.ToolTip("The diagnosis chiefly responsible for patient admission.");
    pg1.lblSecondaryDiagnosis.ToolTip("A condition co-existing with the principal diagnosis and/or arising during admission. May also \nbe referred to as additional diagnosis.");
    pg1.lblComplications.ToolTip("Complications that happened during the patient’s admission.");
    // pg1.lblPMHxLabel.ToolTip("To update this field, save your work on the Discharge Summary and go to Alert Sheet MRA to update the source.");
    // ***** End of Page 1 Events *****

    // ***** Page 2 Events *****
    // Page 2 Section 2 Clinical Summary Textbox – Change 
    latestPg2.txtClinicalSummary.Events.Change(Clinical_Summary_Textbpx_Change);
    // Page 2 Section 2 Clinical Summary Overflow Checkbox – Change 
    latestPg2.chkClinicalSummaryOverflow.Events.Change(Clinical_Summary_Overflow_Change);
    latestPg2.btnClinSummarySignature.Events.Click(Clinical_Sign_Click);
    // ***** End of Page 2 Events *****

    // ***** Page 3 Events *****
    // Page 3 Section 2 Nil Known Allergies Checkbox - Change 
    pg3.chkNilKnownAllergies.Events.Change(Nil_Known_Allergies_Change);
    // Page 3 Section 2 Allergies/Adverse Reactions Repeater  - All controls  - Change 
    for (var i = 0; i < ALLERGIES_COUNT; i++) {
        pg3.txtAllergyDescriptionSubstance[i].Events.Change(Page3_Allergy_Repeater_Change); 
        pg3.txtAllergyCategoryDescriptionReaction[i].Events.Change(Page3_Allergy_Repeater_Change); 
        pg3.txtAllergyReactionCommentManifestation[i].Events.Change(Page3_Allergy_Repeater_Change); 
        
    }
    // Page 3 Section 2 Substance/Agent, Reaction Type, Clinical Manifestation Panels - On Hover 
    pg3.lblSubstanceAgent.ToolTip("This is the \'Type of Reaction\' fields from Vitro, or the \'Alert Description\' \nfrom iPM - example: \"Antibiotic Allergy\" and \"Penicillin\" or \"Strawberries\"");
    pg3.lblReactionType.ToolTip("This is the \'Category Description\' from iPM or the dropdown / \ncategory entry in Vitro - example: \"Allergy\" or \"Food Allergen\"");
    pg3.lblClinicalManifestation.ToolTip("This is the \'Reaction\' field in Vitro, or \nthe \'Comment\' field in iPM - \nexample: \"Anaphylaxis\" or \"Hives\"");
    // Page 3 Section 2 Add additional Allergies/Adverse Reactions Checkbox -Change 
    pg3.chkAllergiesAdverseReactionsOverflow.Events.Change(Reaction_Overflow_Checkbox_Change);
    // ***** End of Page 3 Events *****

    // ***** Page 4 Events *****
    // Page 4 Section 2 Allergies/Adverse Reaction, Substance/Agent, Reaction Type, Clinical Manifestation Panels - On Hover 
    pg4.lblAllergiesAdverseReactionsTitle.ToolTip("To update this field, save your work on the Discharge Summary and go to Alert Sheet MRA to update the source.");
    pg4.lblSubstanceAgent.ToolTip("This is the \'Type of Reaction\' fields from Vitro, or the \'Alert Description\' \nfrom iPM - example: \"Antibiotic Allergy\" and \"Penicillin\" or \"Strawberries\"");
    pg4.lblReactionType.ToolTip("This is the \'Category Description\' from iPM or the dropdown / \ncategory entry in Vitro - example: \"Allergy\" or \"Food Allergen\"");
    pg4.lblClinicalManifestation.ToolTip("This is the \'Reaction\' field in Vitro, or \nthe \'Comment\' field in iPM - \nexample: \"Anaphylaxis\" or \"Hives\"");
    // ***** End of Page 4 Events *****

    // ***** Page 5 Events *****
    // Page 5 Section 2 Nil Medication Checkbox,   
    // Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox,  
    // Page 5 Section 2 Medications on Discharge Repeater - All controls,  
    // Page 5 Section 2 Add additional medications on discharge Checkbox,  
    // Page 5 Section 3 Ceased Medication Repeater - All controls,  
    // Page 5 Section 3 Add additional ceased medications on discharge Checkbox – Change 
    pg5.chkNilMedications.Events.Change(Set_Highlights_Change);
    pg5.chkReferMedProfile.Events.Change(Set_Highlights_Change);
    pg5.chkNoChangesMade.Events.Change(Set_Highlights_Change);
    for (var i = 0; i < MEDICATION_COUNT; i++) {
        pg5.txtDCMedNameStrength[i].Events.Change(Set_Highlights_Change); 
        pg5.txtDCNumbertoTakeDirections[i].Events.Change(Set_Highlights_Change); 
        pg5.txtDCMedDurationEndDate[i].Events.Change(Set_Highlights_Change); 
        pg5.ddDCMedStatus[i].Events.Change(Set_Highlights_Change); 
        pg5.txtDCMedlIndicationPurpose[i].Events.Change(Set_Highlights_Change); 
        // Page 5 Section 2 Medications on Discharge Repeater – Change
        pg5.txtDCMedNameStrength[i].Events.Change(Medication_Controls_Change); 
        pg5.txtDCNumbertoTakeDirections[i].Events.Change(Medication_Controls_Change); 
        pg5.txtDCMedDurationEndDate[i].Events.Change(Medication_Controls_Change); 
        pg5.ddDCMedStatus[i].Events.Change(Medication_Controls_Change); 
        pg5.txtDCMedlIndicationPurpose[i].Events.Change(Medication_Controls_Change);
    }
    pg5.chkAddAdditionalMedications.Events.Change(Set_Highlights_Change);
    pg5.chkNilCeasedMedications.Events.Change(Set_Highlights_Change);
    for (var i = 0; i < CEASED_MEDICATION_COUNT; i++) {
        pg5.txtCeasedMedicineName[i].Events.Change(Set_Highlights_Change); 
        pg5.txtCeasedReasonForCeasing[i].Events.Change(Set_Highlights_Change); 
    }
    pg5.chkAddAdditionalCeasedMedication.Events.Change(Set_Highlights_Change);
    // Page 5 Section 2 Nil Medication Checkbox – Change 
    pg5.chkNilMedications.Events.Change(NilMedications_Checkboxes_Change);
    // Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox – Change 
    pg5.chkReferMedProfile.Events.Change(Medication_Controls_Change);
    // Removed - for future updates
    // pg5.chkReferMedProfile.Events.Change(Refer_Medication_Change);
    pg5.chkNoChangesMade.Events.Change(Medication_Controls_Change);
    // Page 5 Section 2 Add additional medications on discharge Checkbox – Change 
    pg5.chkAddAdditionalMedications.Events.Change(Add_Medications_Checkbox_Change);
    // Page 5 Section 3 Nil ceased Medication Checkbox – Change 
    pg5.chkNilCeasedMedications.Events.Change(NilCeasedMedications_Checkboxes_Change);
    for (var i = 0; i < CEASED_MEDICATION_COUNT; i++) {
        // Page 5 Section 2 Medications on Discharge Repeater – Change
        pg5.txtCeasedMedicineName[i].Events.Change(Cease_Medication_Controls_Change); 
        pg5.txtCeasedReasonForCeasing[i].Events.Change(Cease_Medication_Controls_Change); 
    }
    // Page 5 Section 3 Add additional ceased medications on discharge Checkbox – Change
    pg5.chkAddAdditionalCeasedMedication.Events.Change(Add_CeasedMedications_Change);
    // ***** End of Page 5 Events *****

    // ***** Page 6 Events *****
    pg6.chkAddAdditionalMedications.Events.Change(Add_Medications_Overflow_Change);
    // ***** End of Page 6 Events *****

    // ***** Page 7 Events *****
    pg7.chkAddAdditionalCeasedMedication.Events.Change(Add_CeasedMed_Overflow_Change)
    // ***** End of Page 7 Events *****

    // ***** Page 8 Events *****    
    for (var i = 0; i < FOLLOW_UP_COUNT; i++) {
        // Page 8 Section 2 Appointment date – When DatePicker- Change 
        pg8.dpFollowUpAptWhenDate[i].Events.Change(Page8_FollowUpDate_Repeater_Change); 
    }
    // ***** End of Page 8 Events *****

    // ***** Page 9 Events *****
    // Page 9 Section 2 Recipients Repeater – All controls - Change 
    for (var i = 0; i < RECIPIENT_COUNT; i++) {
        pg9.txtPractitioner[i].Events.Change(Recipents_Change);
        pg9.txtRecipientPg9Organisation[i].Events.Change(Recipents_Change);
        pg9.txtPractitionerPhoneNo[i].Events.Change(Recipents_Change);
    }
    // Page 9 Section 3 Staff Name and Designation Authorisation - Change 
    pg9.auStaffSignNameRole.Events.Change(Staff_Sign_Change);
}

// Page 1 Functions
function Other_Controls_Change(p,c,o,n) {
    var Page3_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction", 
        "txtAllergyReactionCommentManifestation"];
    var Page5_Med_Repeater_Controls = ["txtDCMedNameStrength", "txtDCNumbertoTakeDirections", "txtDCMedDurationEndDate",
        "ddDCMedStatus", "txtDCMedlIndicationPurpose"];
    var Page5_Ceased_Med_Repeater_Controls = ["txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    var highlighted_notes = [];
    // Removed - for future updates
    // highlighted_notes = Notes_Highlighted(highlighted_notes);
    // IF Page 1 Section 2 Discharge Date DatePicker has value AND 
    //  IF all Page 2 Clinical Summary textboxes have no highlight AND
    //  IF Page 1 Section 2 Discharge Destination Textbox has value AND
    //  (IF Page 3 Section 2 Allergies/Adverse Reactions Repeater any control has value OR
    //  IF Page 3 Section 2 Nil Known Allergies Checkbox is True) AND
    //  IF Page 3 Section 3 Alerts Textbox is not highlighted
    //  IF Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox is True OR
    //  IF Page 5 Section 2 Nil Medication Checkbox is True OR
    //  IF Page 5 Section 2 Medication on Discharge Repeater any control has value OR
    //  IF Page 5 Section 3 Ceased Medication Repeater any control has value   AND
    //  IF Page 8 Section 2 Recommendations Repeater any control has value  
    if (pg1.dpDischargeDate.Value() && pg1.txtDischargeDestination.Value() && // (highlighted_notes.length == 0) && // Removed - for future updates
        (Repeater_Values_Check(pg3, ALLERGIES_COUNT, Page3_Repeater_Controls) || pg3.chkNilKnownAllergies.Value()) &&
        (pg5.chkReferMedProfile.Value() || pg5.chkNilMedications.Value() || 
        Repeater_Values_Check(pg5, MEDICATION_COUNT, Page5_Med_Repeater_Controls) ||
        Repeater_Values_Check(pg5, CEASED_MEDICATION_COUNT, Page5_Ceased_Med_Repeater_Controls))) {
            return { p,c,o,n }; 
        }
        else {
            c.Value(o);
            n = o;
            var required_controls = [pg1.dpDischargeDate,
                pg1.txtDischargeDestination,
                pg3.cblNilKnownAllergies,
                pg3.txtAllergyDescriptionSubstance[0],
                pg3.txtAllergyCategoryDescriptionReaction[0],
                pg5.cblMedicationsOnDischargeCheckboxes,
                pg5.txtDCMedNameStrength[0],
                pg5.txtDCNumbertoTakeDirections[0],
                pg5.txtCeasedMedicineName[0]];
            for (var p2 = 0; p2 < highlighted_notes.length; p2++) {
                myApp.Page(highlighted_notes[p2]).Control("txtClinicalSummary").Invalidate("is incomplete. Please check this field before signing", true);
            }
            for (var v = 0; v < required_controls.length; v++) {
                if (required_controls[v].Attribute(Vitro.CONTROL.BackgroundColour) == COLOURS.RED_REQUIRED ||
                    required_controls[v].Attribute(Vitro.CONTROL.BackgroundColour) == COLOURS.TRANS_BLUE) { 
                        required_controls[v].Invalidate("is incomplete. Please check this field before signing", true); 
                    }
            }
            return { p,c,o,n };
        }
}

function Admission_Date_Change(p,c,o,n) {
    // Clear Page 1 Secton 2 Discharge Date datepicker value 
    p.dpDischargeDate.Value("");
    // Perist Highlight Page 1 Section 2 Discharge Date DatePicker using RGB: 128, 255, 237, 193 as per SBR 
    p.dpDischargeDate.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
    // Clear Page 1 Section 2 ‘Length of Stay’ Textbox
    p.txtLengthOfStay.Value("");
    // Set Page 1 Admitting Consultant textbox as Read-only
    p.txtAdmittingConsultant.ReadOnly(true);
}

function Discharge_Date_Change(p,c,o,n) {
    // IF Page 1 Section 2 Discharge Date DatePicker Has value AND IF Page 1 Section 2 Admission Date DatePicker Has value  
    if (n && pg1.dpAdmissionDate.Value()) {
        // Remove highlight Page 1 Section 2 Discharge Date DatePicker 
        c.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        c.Attribute(Vitro.CONTROL.Border, "False", true);
        c.Validate();
        // Set Page 1 Section 2 ‘Length of Stay’ Textbox =  calculation - Discharge Date – Admission Date (Eg. admission on 22/03 at 5 PM will show 1 if 23/03 is entered in discharge date regardless of the time. 
        pg1.txtLengthOfStay.Value(Get_Days(pg1.dpAdmissionDate.Value(), n));
        // Set Page 1 Admitting Consultant textbox as Writable 
        p.txtAdmittingConsultant.Writeable();
        // IF Page 1 Section 2 Admission Date datepicker value is earlier than Discharge Date value 
        if (pg1.txtLengthOfStay.Value() < 0) {
            // Clear Page 1 Section 2 Discharge Date value 
            c.Value("")
            // Perist Highlight Page 1 Section 2 Discharge Date DatePicker using RGB: 128, 255, 237, 193 as per SBR 
            p.dpDischargeDate.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
            // Clear Set Page 1 Section 2 ‘Length of Stay’ Textbox
            p.txtLengthOfStay.Value("");
            // Clear the value and Set Page 1 Admitting Consultant textbox as Read-only 
            p.txtAdmittingConsultant.ReadOnly(true);
        }
    }
    // ELSE Page 1 Section 2 Discharge Date DatePicker Has got NO value 
    else {
        p.dpDischargeDate.Value("");
        // Highlight Page 1 Section 2 Discharge Date DatePicker using RGB: 128, 255, 237, 193 as per SBR 
        p.dpDischargeDate.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        // Clear Set Page 1 Section 2 ‘Length of Stay’ Textbox
        p.txtLengthOfStay.Value("");
        // Clear the value and Set Page 1 Admitting Consultant textbox as Read-only 
        p.txtAdmittingConsultant.ReadOnly(true);
    }
}

function Dischrge_Destination_Click(p,c) {
    myApp.ActionBarVisibility(false);
	myApp.PageNavigationVisibility(false);
    // Launch Discharge Destination Pop-up 
    Create_Dynamic_Popup(p, PG_WIDTH, PG_HEIGHT);
}

function Create_Dynamic_Popup(page, cur_pgWidth, cur_pgHeight) {
    var popup = {};
    var popupValues = ["", "Acute Hospital", "None", "Aged Care Service", "Psychiatric Care", "Other Health Service", "Administrative Discharge",
        "Self Discharge", "Administrative From Leave", "Deceased", "Home" ];
    // cover page with panel to stop user messing with controls
    popup.panBackground = Vitro.Elements.CreateDynamicPanel(page, cur_pgWidth, cur_pgHeight, false, COLOURS.TRANS_GREY);
    // create popup panel
    popup.panAcuteHospital = Vitro.Elements.CreateDynamicPanel(page, "400", "330", true, COLOURS.WHITE, popup.panBackground);
    for (var i = 0; i < popupValues.length; i++) {
        popup[popupValues] = Vitro.Elements.CreateDynamicTextBox(page, "0, " + (i*30), "400", "30", "13", popup.panAcuteHospital);
        popup[popupValues].ReadOnly().Value(popupValues[i]);
        popup[popupValues].Events.Click(Value_Click);
    }
    Vitro.Elements.SetPositionEvents(myApp, page, popup.panAcuteHospital);
}

function Value_Click(p,c) {
    pg1.txtDischargeDestination.Value(c.Value());
    // IF Discharge Destination Textbox is Deceased 
    if (c.Value() === "Deceased") {
        // Set Page 1 Section 2 Deceased label Visibility: Visible 
        pg1.lblDeceasedFlag.Show();
    }
    else {
        // Set Page 1 Section 2 Deceased label Visibility: Collapsed 
        pg1.lblDeceasedFlag.Hide();
    }

    var panChild = c.Properties.Parent().substring(6);
    p.DestroyControl(p.Control(p.Control(panChild).Properties.Parent().substring(6)));
    myApp.ActionBarVisibility(true);
	myApp.PageNavigationVisibility(true);
    // IF Discharge Destination value is blank
    if (!pg1.txtDischargeDestination.Value()) {
        // Persist Highlight Page 1 Section 2 Discharge Destination textbox using RGB: 128, 255, 237, 193 as per SBR 
        pg1.txtDischargeDestination.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
    }
    else {
        // Remove persist highlight Page 1 Section 2 Discharge Destination 
        pg1.txtDischargeDestination.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        pg1.txtDischargeDestination.Attribute(Vitro.CONTROL.Border, "False", true);
        pg1.txtDischargeDestination.Validate();
    }
}
// Page 2 Functions
function Clinical_Summary_Textbpx_Change(p,c,o,n) {
    // IF Clinical Summary textbox has value AND  
    if (n) {
        // (IF Page 2 Clinical Summary page is the latest page OR IF the next Clinical Summary page is not visible
        if (p == latestPg2 || !myApp.Page(pageIds[p.Order()]).Properties.IsVisible()) {
            // Set 'Add additional notes' checkbox as writable
            p.chkClinicalSummaryOverflow.Writeable(true);
        }
        // IF the current page is an overflow page
        if (myApp.PageManager.Master(p) != p) {
            // Set the previous page 'Add additional notes' checkbox as readonly
            myApp.Load(myApp.Page(pageIds[p.Order()-2]), true);
            myApp.Page(pageIds[p.Order()-2]).Control("chkClinicalSummaryOverflow").ReadOnly(true);
        }
    }
    // ELSE Clinical Summary textbox has no value 
    else {
        // Set 'Add additional notes' checkbox as readonly
        p.chkClinicalSummaryOverflow.ReadOnly(true);
        // IF the current page is an overflow page
        if (myApp.PageManager.Master(p) != p) {
            // Set the previous page 'Add additional notes' checkbox as writable
            myApp.Load(myApp.Page(pageIds[p.Order()-2]), true);
            myApp.Page(pageIds[p.Order()-2]).Control("chkClinicalSummaryOverflow").Writeable(true);
        }
    }
}
function Clinical_Sign_Click(p,c) {
    // On Sign
    // Get Page 1 Section 3 Contributors textbox value
    var contributors = pg1.txtContributors.Value();
    var noteSigner = Vitro.Elements.GetUserDetails().SignatureStamp + " " + Vitro.Elements.GetUserDetails().Role;
    // Add the users full name and designation at the end of Clinical Summary Textbox 
    p.txtClinicalSummary.Value(p.txtClinicalSummary.Value() + "\n" + Vitro.Elements.GetUserDetails().Fullname + " " + Vitro.Elements.GetUserDetails().Role);
    // The signed in user First Name initial + “.”, Last Name, Role is not contained in the Page 1 Section 3 Contributors textbox repeater values 
    if (contributors.indexOf(noteSigner) == -1) {
        // Add First Name, Last Name, Role textbox value from 
        // Page 2 Section 2 Signature Authorisation to Page 1 Section 3 Contributors textbox, in a new line separated row for each contributor entry 
        if (!contributors) { pg1.txtContributors.Value(noteSigner); }
        else { pg1.txtContributors.Value(contributors + ", " + noteSigner); }
    }
}
function Clinical_Signature_Change(p,c,o,n) {
    // On Sign
    // Get Page 1 Section 3 Contributors textbox value
    var contributors = pg1.txtContributors.Value();
    var noteSigner = Vitro.Elements.GetUserDetails().SignatureStamp + " " + Vitro.Elements.GetUserDetails().Role;
    if (n) {
        // IF Page 2 Section 2 Signature Authorisation First Name, Last Name, Designation is not contained in the Page 1 Section 3 Contributors textbox repeater values 
        if (contributors.indexOf(noteSigner) == -1) {
            // Add First Name, Last Name, Role textbox value from 
            // Page 2 Section 2 Signature Authorisation to Page 1 Section 3 Contributors textbox, in a new line separated row for each contributor entry 
            if (!contributors) { pg1.txtContributors.Value(noteSigner); }
            else { pg1.txtContributors.Value(contributors + ", " + noteSigner); }
        }
    }
}
function Clinical_Summary_Overflow_Change(p,c,o,n) {
    // IF True AND
    if (n) {
        // Not the latest overflow page
        if (p != latestPg2) {
            // Show the next hidden Page 2 Overflow page
            myApp.Page(pageIds[p.Order()]).Show(true).Activate();
            // Set Page 2 Overflow page Print Visibility True 
            myApp.Page(pageIds[p.Order()]).PrintVisibility(true);
            // Set Page 2 Overflow page Chart Visibility True 
            myApp.Page(pageIds[p.Order()]).ChartVisibility(true);
        }
        // IF it is the latest Page 2 Overflow page
        else if (p.Properties.ID().indexOf(latestPg2.Properties.ID()) != -1) {
            // Create Overflow page of page 2 
            var clonedPage = myApp.PageManager.Clone(p);
            clonedPage.RegisterControls("txtClinicalSummary", "chkClinicalSummaryOverflow", "btnClinSummarySignature");
            clonedPage.Order(p.Order()+1);
            clonedPage.Deletable(false);
            clonedPage.Activate();
            latestPg2 = clonedPage;
            pageIds = myApp.Properties.PageIDs();
            Vitro.Elements.SetAddressograph(myApp, clonedPage);
            // Set focus on Page 2 ‘Clinical Summary’ Textbox 
            clonedPage.txtClinicalSummary.Focus();
            // Set Page 2 Overflow page Print Visibility True 
            clonedPage.PrintVisibility(true);
            // Set Page 2 Overflow page Chartbook Visibility True 
            clonedPage.ChartVisibility(true);
            clonedPage.txtClinicalSummary.Events.Change(Clinical_Summary_Textbpx_Change);
            clonedPage.chkClinicalSummaryOverflow.Events.Change(Clinical_Summary_Overflow_Change);
            clonedPage.btnClinSummarySignature.Events.Click(Clinical_Sign_Click);
        }
    }
    // ELSE IF False
    else {
        // Hide Page 2 Overflow page
        myApp.Page(pageIds[p.Order()]).Hide(true);
        // Set Page 2 Overflow page Print Visibility True 
        myApp.Page(pageIds[p.Order()]).PrintVisibility(false);
        // Set Page 2 Overflow page Chart Visibility True 
        myApp.Page(pageIds[p.Order()]).ChartVisibility(false);
    }
    for (var i = pageIds.length - 8; i > 0; i--) {
        myApp.Load(pageIds[i],true);
        myPages_Displayed(myApp.Page(pageIds[i]));
    }
}
// Page 3 Functions
function Nil_Known_Allergies_Change(p,c,o,n) {
    var Page3_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction"];
    p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.Border, "False", true);
    p.cblNilKnownAllergies.Validate();
    p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.Border, "False", true);
    p.txtAllergyDescriptionSubstance[0].Validate();
    p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.Border, "False", true);
    p.txtAllergyCategoryDescriptionReaction[0].Validate();
    // IF True AND (IF Substance/Agent Textbox, Reaction Type Textbox in Allergies/Adverse Reactions Repeater has any value OR Page 3 Add Additional Allergies/ Adverse Reaction checkbox has value) 
    if (n && (Repeater_Values_Check(p, ALLERGIES_COUNT, Page3_Repeater_Controls) || p.chkAllergiesAdverseReactionsOverflow.Value())) {
        // Set value as false  
        n = !n;
        c.Value(n);
    }
    // IF True 
    if (n) {
        // Make Visual Read-only: True 
        //  Page 3 Section 2 Allergies/Adverse Reactions Repeater 
        // Remove highlight for all controls in 
        //  Page 3 Section 2 Allergies/Adverse Reactions Repeater 
        p.rptAllergiesAdverseReactionsTable.ReadOnly(true);
        for (var i = 0; i < ALLERGIES_COUNT; i++) {
            p.txtAllergyDescriptionSubstance[i].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
            p.txtAllergyCategoryDescriptionReaction[i].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        }
        //  Page 3 Section 2 Nil Known Allergies Checkbox 
        p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
    // ELSE
    else {
        // Make Visual Read-only: False, Page 3 Section 2 Allergies/Adverse Reactions Repeater
        p.rptAllergiesAdverseReactionsTable.Writeable();
        // IF Substance/Agent Textbox, Reaction Type Textbox in Allergies/Adverse Reactions Repeater have no values AND Page 3 Add Additional Allergies/ Adverse Reaction checkbox hasno  value 
        if (!Repeater_Values_Check(p, ALLERGIES_COUNT, Page3_Repeater_Controls) && !p.chkAllergiesAdverseReactionsOverflow.Value()) {
            // Highlight using RGB: 128, 255, 237, 193 as per SBR for all controls in  
            // Page 3 Section 2 Allergies/Adverse Reactions Repeater (first row)
            p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
            p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
            // Page 3 Section 2 Nil Know Allergies Checkbox 
            p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        }
    }
}
function Page3_Allergy_Repeater_Change(p,c,o,n) {
    var Page3_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction", 
        "txtAllergyReactionCommentManifestation"];
    p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.Border, "False", true);
    p.cblNilKnownAllergies.Validate();
    p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.Border, "False", true);
    p.txtAllergyDescriptionSubstance[0].Validate();
    p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.Border, "False", true);
    p.txtAllergyCategoryDescriptionReaction[0].Validate();
    // IF any control in Allergies/Adverse Reactions Repeater has value  
    if (Repeater_Values_Check(p, ALLERGIES_COUNT, Page3_Repeater_Controls)) {// && Vitro.Elements.GetRepeaterIndex(c) == 0) {
        // Remove highlight from  
        //  page 3 Section 2 first Allergies/Adverse Reactions Repeater row 
        p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        //  Page 3 Section 2 Nil Know Allergies Checkbox
        p.chkNilKnownAllergies.Hide(true);
        p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
    }
    // ELSE IF all controls in Allergies/Adverse Reactions Repeater row have no value AND  
    // IF Add additional allergies checkbox has no value 
    // IF it is the first row ***
    else if (!Repeater_Values_Check(p, ALLERGIES_COUNT, Page3_Repeater_Controls) && !p.chkAllergiesAdverseReactionsOverflow.Value()) {// && Vitro.Elements.GetRepeaterIndex(c) == 0) {
        // Highlight using RGB: 128, 255, 237, 193 as per SBR 
        //  page 3 Section 2 first Allergies/Adverse Reactions Repeater row
        p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        //  Page 3 Section 2 Nil Know Allergies Checkbox
        p.chkNilKnownAllergies.Show(true);
        p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true).Writeable(true);
    }   
}
function Reaction_Overflow_Checkbox_Change(p,c,o,n) {
    var Page4_Repeater_Controls = ["txtAllergyDescriptionSubstanceOverflow", "txtAllergyCategoryDescriptionReactionOverflow",
        "txtAllergyReactionCommentManifestationOverflow"];
    var Page3_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction", 
        "txtAllergyReactionCommentManifestation"];
    var Page3_Req_Repeater_Controls = ["txtAllergyDescriptionSubstance", "txtAllergyCategoryDescriptionReaction"];
    // (IF True AND  IF  Substance/Agent Textbox, Reaction Type Textbox in Allergies/Adverse Reactions Repeater last row have no values AND Page 4 is not visible) OR
    // (IF False AND Page 4 Substance/Agent Textbox, Reaction Type Textbox in Allergies/Adverse Reactions Repeater any row has value) 
    if ((n && !(Repeater_Row_Values_Check(p, Page3_Req_Repeater_Controls, ALLERGIES_COUNT -1).all) && !pg4.Properties.IsVisible()) ||
        (!n && Repeater_Values_Check(pg4, FULL_ALLERGIES_COUNT, Page4_Repeater_Controls))) {
            // Set value as false  
            n = !n;
            c.Value(n);
    }
    // IF True
    if (n) {
        // Show Page 4 
        pg4.Show(true);
        // Set for Page 3 Section 2 ‘Continued on ‘Next’ page’ Textbox 
        // Visibility: Visible 
        pg3.txtAllergiesAlertsOverflowMessage.Show();
        // Set for Page 4 Print Visibility: True
        pg4.PrintVisibility(true);
        // Set Page 4 Chartbook Visibility True
        pg4.ChartVisibility(true);
    }
    // ELSE IF False AND IF Page 3 Section 2 Allergies/Adverse Reactions Repeater is blank 
    else if (!n && !Repeater_Values_Check(pg4, FULL_ALLERGIES_COUNT, Page4_Repeater_Controls)) {
        // Hide Page 4
        pg4.Hide(true);
        // Set Page 4 Print Visibility False 
        pg4.PrintVisibility(false);
        // Set Page 4 Chartbook Visibility False 
        pg4.ChartVisibility(false);
        // Set for Page 3 Section 2 ‘Continued on ‘Next’ page’ Textbox 
        // Visibility: Collapsed
        pg3.txtAllergiesAlertsOverflowMessage.Hide();
    }
    if (!n && !Repeater_Values_Check(p, ALLERGIES_COUNT, Page3_Repeater_Controls) && !p.chkNilKnownAllergies.Value()) {
        // Highlight using RGB: 128, 255, 237, 193 as per SBR 
        //  page 3 Section 2 first Allergies/Adverse Reactions Repeater row
        p.txtAllergyDescriptionSubstance[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        p.txtAllergyCategoryDescriptionReaction[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        //  Page 3 Section 2 Nil Know Allergies Checkbox
        p.cblNilKnownAllergies.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        // Make Page 3 Section 2 Nil Know Allergies Checkbox, Make Visual Editable
        p.cblNilKnownAllergies.Writeable();
        p.chkNilKnownAllergies.Show(true);
    }
}

function Set_Highlights_Change(p,c,o,n) {
    var Page5_Med_Repeater_Controls = ["txtDCMedNameStrength", "txtDCNumbertoTakeDirections", "txtDCMedDurationEndDate",
        "ddDCMedStatus", "txtDCMedlIndicationPurpose"];
    var Page5_CeasedMed_Repeater_Controls = ["txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    var required_controls = [p.cblMedicationsOnDischargeCheckboxes,
        p.rptMedicationsOnDischargeTable[0],
        p.txtDCMedNameStrength[0],
        p.txtDCNumbertoTakeDirections[0],
        p.txtCeasedMedicineName[0],
        p.rptCeasedMedicationsTable[0]];
    for (var v = 0; v < required_controls.length; v++) {
        required_controls[v].Attribute(Vitro.CONTROL.Border, "False", true);
        required_controls[v].Validate();
    }
    // IF Any control has value 
    if (p.chkNilMedications.Value() || p.chkReferMedProfile.Value() || p.chkNoChangesMade.Value() ||
        Repeater_Values_Check(p, MEDICATION_COUNT, Page5_Med_Repeater_Controls) ||
        p.chkAddAdditionalMedications.Value() ||
        Repeater_Values_Check(p, CEASED_MEDICATION_COUNT, Page5_CeasedMed_Repeater_Controls) ||
        p.chkAddAdditionalCeasedMedication.Value()) {
            // Remove Highlight for all controls 
            //  page 5 Section 2 first Medications on Discharge Repeater row 
            p.txtDCMedNameStrength[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
            p.txtDCNumbertoTakeDirections[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
            //  page 5 Section 3 first Ceased Medications Repeater row 
            p.txtCeasedMedicineName[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
            //  Page 5 Section 2 Nil Medication Checkbox 
            //  Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox 
            p.cblMedicationsOnDischargeCheckboxes.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
    else {
        // Highlight using RGB: 128, 255, 237, 193 as per SBR 
        //  page 5 Section 2 first Medications on Discharge Repeater row 
        p.txtDCMedNameStrength[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        p.txtDCNumbertoTakeDirections[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        if (!pg5.chkNilCeasedMedications.Value()) {
            //  page 5 Section 2 first Ceased Medication Repeater row 
            p.txtCeasedMedicineName[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        }
        else {
            // Remove Highlight using RGB: 50,255,0,0 Page 5 Section 3 first Ceased Medications Repeater row            
            p.txtCeasedMedicineName[0].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
        }
        //  Page 5 Section 2 Nil Medication Checkbox 
        //  Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox 
        p.cblMedicationsOnDischargeCheckboxes.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_BLUE, true);
        p.chkNilMedications.Show(true);  
    }
}
// Page 5 Fuctions
function NilMedications_Checkboxes_Change (p,c,o,n) {
    var Page5_Med_Repeater_Controls = ["txtDCMedNameStrength", "txtDCNumbertoTakeDirections", "txtDCMedDurationEndDate",
        "ddDCMedStatus", "txtDCMedlIndicationPurpose"];
    // IF True AND IF any control in Medications on Discharge Repeater row has value OR Page 5 Add Additional Medication on Discharge checkbox has value 
    if (n && (Repeater_Values_Check(p, MEDICATION_COUNT, Page5_Med_Repeater_Controls) || p.chkAddAdditionalMedications.Value())) {
        // Set value as false  
        n = !n;
        c.Value(n);
    }
    // IF True
    if (n) {
        // Make Visual Read-only: True
        //  Page 5 Section 2 Medications on Discharge Repeater 
        p.rptMedicationsOnDischargeTable.ReadOnly(true);
        //  Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox 
        p.chkReferMedProfile.ReadOnly(true);
    }
    else {
        // Make Visual Read-only: False 
        //  Page 5 Section 2 first Medications on Discharge Repeater row  
        p.rptMedicationsOnDischargeTable.Writeable();
        // Page 5 Section 2 Refer to Pharmacy Medication Profile Checkbox 
        p.chkReferMedProfile.Writeable();
    }
}

function Medication_Controls_Change(p,c,o,n) {
    var Page5_Med_Repeater_Controls = ["txtDCMedNameStrength", "txtDCNumbertoTakeDirections", "txtDCMedDurationEndDate",
        "ddDCMedStatus", "txtDCMedlIndicationPurpose"];
    // IF Page 5 Section 2 Refer to Pharmacy Medication Profile checkbox AND IF Page 5 Section 2 Medication on discharge repeater have no values AND 
    // Page 5 Section 2 Add additional Medication on discharge checkbox has no value AND 
    // Page 5 Section 2 No changes made to regular medications during this admission checkbox has value
    if (!Repeater_Values_Check(pg5, MEDICATION_COUNT, Page5_Med_Repeater_Controls) && !pg5.chkAddAdditionalMedications.Value() && !pg5.chkReferMedProfile.Value() &&
        !pg5.chkNoChangesMade.Value()) {
            //	Show Page 5 Section 2 Nil Medication Checkbox
            pg5.chkNilMedications.Show(true);
    }
    else {
        // Hide Page 5 Section 2 Nil Medication Checkbox
        pg5.chkNilMedications.Hide(true);
    }
}

function ReferMedProfile_Checkboxes_Change(p,c,o,n) {
    // IF True
    if (n) {
        // Make Visual Read-only: True, Remove highlight for all controls in  
        //   Page 5 Section 2 Nil Medication Checkbox
        p.chkNilMedications.ReadOnly(true);
    }
    // ELSE IF False 
    else {
        // Make Visual Read-only: False 
        //  Page 5 Section 2 Nil Medication Checkbox 
        p.chkNilMedications.Writeable();
    }
}

function Add_Medications_Checkbox_Change(p,c,o,n) {
    var Page6_Med_Repeater_Controls = ["txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections", "txtOverflowDCMedDurationEndDate",
        "ddOverflowDCMedStatus", "txtOverflowDCMedIndicationPurpose"];
    var Page5_Req_Med_Repeater_Controls = ["txtDCMedNameStrength", "txtDCNumbertoTakeDirections"];
    // (IF True AND Page 5 Section 2 Medications on Discharge Repeaters last row have no value AND Page 6 is not visible) OR
    // (IF False AND Page 6 Section 2 Medications on Discharge Repeaters has value) OR
    // (IF False AND Page 6 Add Additional Medications)
    if ((n && !(Repeater_Row_Values_Check(p, Page5_Req_Med_Repeater_Controls, MEDICATION_COUNT -1).all) && !pg6.Properties.IsVisible()) ||
        (!n && Repeater_Values_Check(pg6, OF_MEDICATION_COUNT, Page6_Med_Repeater_Controls)) ||
        (!n && pg6.chkAddAdditionalMedications.Value())) {
            // Set value as false  
            n = !n;
            c.Value(n);
    }
    // IF True
    if (n) {
        // Show Page 6 
        pg6.Show(true);
        // Set focus on Page 6 Section 2 Medications on Discharge Repeater first row, first field
        pg6.txtOverflowDCMedNameAndStrength.Focus();
        // Set for Page 5 Section 2 ‘Continued on ‘Next’ page’ Textbox  
        // Visibility: Visible 
        pg5.txtDCMedsOverflowMessage.Show(true);
        // Set for Page 6 Print Visibility: True
        pg6.PrintVisibility(true);
        // Set Page 6 Chartbook Visibility True
        pg6.ChartVisibility(true);
    }
    // ELSE IF False AND IF Page 6 Section 2 all controls in Medications on Discharge Repeater have no value 
    else if (!n && !Repeater_Values_Check(pg6, OF_MEDICATION_COUNT, Page6_Med_Repeater_Controls)) {
        // IF Page 6 Section 2 all controls in Medications on Discharge Repeater have no value
        // Hide Page 6 
        pg6.Hide(true);
        // Set Page 6 Print Visibility: True,  
        pg6.PrintVisibility(false);
        // Set Page 6 Chartbook Visibility: True  
        pg6.ChartVisibility(false);
        // Set Page 5 Section 2 ‘Continued on ‘Additional Medications page’ Textbox 
        // Visibility: Collapsed 
        pg5.txtDCMedsOverflowMessage.Hide();
    }
    Medication_Controls_Change();
    Set_Highlights_Change(p,c,o,n)
}

function NilCeasedMedications_Checkboxes_Change(p,c,o,n) {
    var Page5_CeasedMed_Repeater_Controls = ["txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    // IF True AND (IF any control in Ceased Medications Repeater row has value OR Page 5 Add Additional Ceased Medication on Discharge checkbox has value) 
    if (n && (Repeater_Values_Check(p, CEASED_MEDICATION_COUNT, Page5_CeasedMed_Repeater_Controls) || p.chkAddAdditionalCeasedMedication.Value())) {
        // Set value as false  
        n = !n;
        c.Value(n);
    }
    // IF True
    if (n) {
        // Make Visual Read-only: True
        //  Page 5 Section 3 Ceased Medications Repeater 
        p.rptCeasedMedicationsTable.ReadOnly(true);
    }
    else {
        // Make Visual Read-only: False 
        //  Page 5 Section 2 Medications on Discharge
        p.rptCeasedMedicationsTable.Writeable();
    }
}

function Cease_Medication_Controls_Change(p,c,o,n) {
    var Page5_CeasedMed_Repeater_Controls = ["txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    // IF Page 5 Section 3 Ceased Medication repeater have no values AND 
    // Page5 Section 3 Add additional ceased Medication on discharge checkbox has no value
    if (!Repeater_Values_Check(pg5, CEASED_MEDICATION_COUNT, Page5_CeasedMed_Repeater_Controls) && !pg5.chkAddAdditionalCeasedMedication.Value()) {
            //	Show Page 5 Section 2 Nil Medication Checkbox
            pg5.chkNilCeasedMedications.Show(true);
            pg5.cblNilCeasedMedications.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT, true);
    }
    else {
        // Hide Page 5 Section 2 Nil Medication Checkbox
        pg5.chkNilCeasedMedications.Hide(true);
        pg5.cblNilCeasedMedications.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
    }
}

function Add_CeasedMedications_Change(p,c,o,n) {
    var Page7_CeasedMedications_Repeater_Controls = ["txtOverflowCeasedMedicineName", "txtOverflowCeasedReasonForCeasing"];
    var Page5_CeasedMed_Repeater_Controls = ["txtCeasedMedicineName", "txtCeasedReasonForCeasing"];
    // (IF True AND Page 5 Section 3 Ceased Medications Repeaters last row have no value AND Page 7 is not visible) OR
    // (IF False AND Page 7 Section 3 Ceased Medications Repeaters has value) OR
    // (IF False AND Page 7 Add Additional Medications)
    if ((n && !(Repeater_Row_Values_Check(p, Page5_CeasedMed_Repeater_Controls, CEASED_MEDICATION_COUNT -1).all) && !pg7.Properties.IsVisible()) ||
        (!n && Repeater_Values_Check(pg7, OF_CEASED_MEDICATION_COUNT, Page7_CeasedMedications_Repeater_Controls)) ||
        (!n && pg7.chkAddAdditionalCeasedMedication.Value())) {
            // Set value as false  
            n = !n;
            c.Value(n);
    }
    // IF True
    if (n) {
        // Show Page 7 
        pg7.Show(true);
        // Set for Page 5 Section 2 ‘Continued on Following page’ Textbox  
        // Visibility: Visible 
        pg5.txtCeasedMedsOverflowMessage.Show(true);
        // Set for Page 7 Print Visibility: True
        pg7.PrintVisibility(true);
        // Set Page 7 Chartbook Visibility True
        pg7.ChartVisibility(true);
    }
    // ELSE IF False AND IF Page 7 Section 2 all controls in Ceased Medications Repeaters have no value
    else if (!n && !Repeater_Values_Check(pg7, OF_CEASED_MEDICATION_COUNT, Page7_CeasedMedications_Repeater_Controls)) {
        // Hide Page 7 
        pg7.Hide(true);
        // Set Page 7 Print Visibility: False,  
        pg7.PrintVisibility(false);
        // Set Page 7 Chartbook Visibility: False  
        pg7.ChartVisibility(false);
        // Set Page 5 Section 2 ‘Continued in ‘Additional Ceased Meds page’ Textbox 
        // Visibility: Collapsed 
        pg5.txtCeasedMedsOverflowMessage.Hide();
    }
    Set_Highlights_Change(p,c,o,n)
}
function Add_Medications_Overflow_Change(p,c,o,n) {
    var Page6_Med_Repeater_Controls = ["txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections", "txtOverflowDCMedDurationEndDate",
        "ddOverflowDCMedStatus", "txtOverflowDCMedIndicationPurpose"];
    var Page6_Req_Med_Repeater_Controls = ["txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections"];
    pageIds = myApp.Properties.PageIDs();
    var pg6Clone = myApp.Page(pageIds[pageIds.indexOf("page6of1")]);
    // (IF True AND Page 6 Section 2 Medications on Discharge Repeaters last row have no value AND Page 6 is not visible) OR
    // (IF False AND Page 6 Clone Section 2 Medications on Discharge Repeaters has value)
    if ((n && !(Repeater_Row_Values_Check(p, Page6_Req_Med_Repeater_Controls, OF_MEDICATION_COUNT -1).all) && (!pg6Clone ? true : !pg6Clone.Properties.IsVisible())) ||
        (!n && pg6Clone && Repeater_Values_Check(pg6Clone, OF_MEDICATION_COUNT, Page6_Med_Repeater_Controls))) {
            // Set value as false  
            n = !n;
            c.Value(n);
    }
    else {
        // IF True AND Page 6 overflow does not exist 
        if (n && !pg6Clone) {
            // Create Overflow page of page 6 
            pg6Clone = myApp.PageManager.Clone(p);
            // Set Page 6 overflow page as not deletable 
            pg6Clone.Deletable(false);
            // Set the order of the cloned page next to Page 6 
            pg6Clone.Order(p.Order() + 1);
        }
        // ELSE IF True AND Page 6 overflow is existing 
        else if (n && pg6Clone) {
            // Show Page 6 Overflow 
            pg6Clone.Show(true);
        }
        myPages_Displayed(pg6Clone);
        // IF True 
        if (n) {
            // Set Page 6 Overflow page Print Visibility True 
            pg6Clone.PrintVisibility(true);
            // Set Page 6 Overflow page Chartbook Visibility True 
            pg6Clone.ChartVisibility(true);
            // Set "Continued from 'Medications' on Discharge on previous page" textbox value to "Continued from 'Previous' page" 
            pg6Clone.txtOverflowDCMedsPreviousMessage.Value("Continued from 'Previous' page");
            pg6Clone.chkAddAdditionalMedications.Hide(true);
        }
        // ELSE
        else {
            // Hide Page 6 overflow 
            pg6Clone.Hide(true);
            // Set Page 6 Overflow page Print Visibility False 
            pg6Clone.PrintVisibility(false);
            // Set Page 6 Overflow page Chartbook Visibility False 
            pg6Clone.ChartVisibility(false);
        }
    }
}
function Add_CeasedMed_Overflow_Change(p,c,o,n) {
    var Page7_CeasedMed_Repeater_Controls = ["txtOverflowCeasedMedicineName", "txtOverflowCeasedReasonForCeasing"];
    pageIds = myApp.Properties.PageIDs();
    var pg7Clone = myApp.Page(pageIds[pageIds.indexOf("page7of1")]);
    // (IF True AND Page 7 Section 2 Ceased Medications Repeaters last row have no value AND Page 7 is not visible) OR
    // (IF False AND Page 7 Clone Section 2 Ceased Medications Repeaters has value)
    if ((n && !(Repeater_Row_Values_Check(p, Page7_CeasedMed_Repeater_Controls, OF_CEASED_MEDICATION_COUNT -1).all) && (!pg7Clone ? true : !pg7Clone.Properties.IsVisible())) ||
        (!n && pg7Clone && Repeater_Values_Check(pg7Clone, OF_CEASED_MEDICATION_COUNT, Page7_CeasedMed_Repeater_Controls))) {
            // Set value as false  
            n = !n;
            c.Value(n);
    }
    else {
        if (n && !pg7Clone) {
            // Create Overflow page of page 7 
            pg7Clone = myApp.PageManager.Clone(p);
            // Set Page 7 overflow page as not deletable 
            pg7Clone.Deletable(false);
            // Set the order of the cloned page next to Page 7
            pg7Clone.Order(p.Order() + 1);
        }
        // ELSE IF True AND Page 7 overflow is existing 
        else if (n && pg7Clone) {
            // Show Page 7 Overflow 
            pg7Clone.Show(true);
        }
        myPages_Displayed(pg7Clone);
        // IF True
        if (n) {
            // Set Page 7 Overflow page Print Visibility True 
            pg7Clone.PrintVisibility(true);
            // Set Page 7 Overflow page Chartbook Visibility True 
            pg7Clone.ChartVisibility(true);
            // Set "Continued from 'Medications' page" textbox value to "Continued from 'Previous' page"
            pg7Clone.txtContinuedPreviousPage.Value("Continued from 'Previous' page");
            pg7Clone.chkAddAdditionalCeasedMedication.Hide(true);
        }
        // ELSE
        else {
            // Hide Page 7 overflow 
            pg7Clone.Hide(true);
            // Set Page 7 Overflow page Print Visibility False 
            pg7Clone.PrintVisibility(false);
            // Set Page 7 Overflow page Chartbook Visibility False 
            pg7Clone.ChartVisibility(false);
        }
    }
}
function Page8_FollowUpDate_Repeater_Change(p,c,o,n) {
    var indexRow = Vitro.Elements.GetRepeaterIndex(c);
    var defaultTime = "12:00 PM"; 
    // Has value 
    if (n) {
        // Set Page 8 Section 2 Appointment date – When Textbox Text: ‘12:00 PM’ 
        pg8.txtFollowUpAptWhenTime[indexRow].Value(defaultTime);
    }
    // ELSE
    else {
        // Set Page 8 Section 2 Appointment date – When Textbox blank 
        pg8.txtFollowUpAptWhenTime[indexRow].Value("");
    }
}
// Page 9 Functions
function Staff_Sign_Change(p,c,o,n) {
    var new_value = n;
    var sign_values = Other_Controls_Change(p,c,o,n);
    c = sign_values.c;
    o = sign_values.o;
    n = sign_values.n;
    Page9_Signature_Check(false);
    // On Sign
    if (n) {
        var author = Vitro.Elements.GetUserDetails().Firstname.charAt(0) + "." + Vitro.Elements.GetUserDetails().Lastname;
        var contributors = pg1.txtContributors.Value();
        var noteSigner = Vitro.Elements.GetUserDetails().SignatureStamp + " " + Vitro.Elements.GetUserDetails().Role;
        // Show signature First name, Last name, and designation
        n.SignStamp = Vitro.Elements.GetUserDetails().Firstname + " " + Vitro.Elements.GetUserDetails().Lastname + " " + Vitro.Elements.GetUserDetails().Role;
        c.Value(n);
        // Set Page 1 Section 3 Author textbox value 
        // to Page 9 Section 3 Signature Authorisation First Name Initial, full stop (period), Last Name and date in dd/MM/yy hh:mm 
        pg1.txtDocumentAuthor.Value(author);
        // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Label Visibility: Collapsed 
        pg5.lblCeasedMedsDoNotIncludeMessage.Hide();
        pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Hide();
        // Show ‘Upload’ action button if user is in the SuperUser group 
        if (isSuperUser) { //} && Seven_Days_Check()) {
            myApp.Show(BTN_UPLOAD);
        }
        // Get Page 1 Section 3 Contributors textbox value
        // IF Page 2 Section 2 Signature Authorisation First Name, Last Name, Designation is not contained in the Page 1 Section 3 Contributors textbox repeater values 
        if (contributors.indexOf(noteSigner) == -1) {
            // Add First Name, Last Name, Role textbox value from 
            // Page 2 Section 2 Signature Authorisation to Page 1 Section 3 Contributors textbox, in a new line separated row for each contributor entry 
            if (!contributors) { pg1.txtContributors.Value(noteSigner); }
            else { pg1.txtContributors.Value(contributors + ", " + noteSigner); }
        }
    }
    // On Clear 
    else {
        pg1.txtDocumentAuthor.Value("");
        // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Label Visibility: Visible 
        pg5.lblCeasedMedsDoNotIncludeMessage.Show();
        pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Show();
        // Hide ‘Upload’ action button 
        myApp.Hide(BTN_UPLOAD);
        if (new_value == n) { cleared_signature = true; }
    }
}

// Checks if page 9 authorisation has a value
function Page9_Signature_Check(loaded) {
    var pg9Controls = pg9.Properties.Controls();
    var pg9Authorisation = pg9.auStaffSignNameRole.Properties.ID();
    var currUser = Vitro.Elements.GetUserDetails().Firstname + " " + Vitro.Elements.GetUserDetails().Lastname + " " + Vitro.Elements.GetUserDetails().Role;
    pageIds = myApp.Properties.PageIDs();
    if (pg9.auStaffSignNameRole.Value()) {
        for (var i = 0; i < pageIds.length - 1; i++) {
            myApp.Load(pageIds[i], true);
            myApp.Page(pageIds[i]).ReadOnly();
        }
        if (pg9Controls) {
            for (var j = 0; j < pg9Controls.length; j++) {
                if (pg9Controls[j] != pg9Authorisation) { pg9.Control(pg9Controls[j]).ReadOnly(); }
            }
        }
        myApp.Enable(CEASE);
        myApp.Enable(Vitro.ACTIONS.Seal);
    }
    else {
        if (status === Vitro.STATUS.Submitted) {
            // Focus on the " Ward phone Textbox page 1 Section 2 
            pg1.txtWardPhoneNo.Focus();
        }
        for (var i = 0; i < pageIds.length - 1; i++) {
            myApp.Page(pageIds[i]).Writeable();
        }
        if (pg9Controls) {
            for (var j = 0; j < pg9Controls.length; j++) {
                if (pg9Controls[j] != pg9Authorisation) { pg9.Control(pg9Controls[j]).Writeable(); }
            }
        }
        myApp.Disable(CEASE);
        myApp.Disable(Vitro.ACTIONS.Seal);
    }
    if (loaded) {
        // IF Page 9 Name and Designation authorisation has value AND 
        if (pg9.auStaffSignNameRole.Value()) {
            // Page 9 Name and Designation authorisation) Enable Page 9 Name and Designation authorisation
            // (IF the logged in user is the SuperUser OR the logged in user is the user is the same user who signed 
            if (isSuperUser || currUser == pg9.auStaffSignNameRole.Value().SignStamp) { pg9.auStaffSignNameRole.Enable(); }
            // ELSE
            else { pg9.auStaffSignNameRole.Disable(); }
            // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Visibility: Collapsed and Visibility: Collapsed
            pg5.lblCeasedMedsDoNotIncludeMessage.Hide();
            pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Hide();
        }
        else {
            // Set Page 5 and page 7 ‘Do not include medications commenced AND concluded during admission, e.g. antibiotics’ Visibility: Visible and Visibility: Visible
            pg5.lblCeasedMedsDoNotIncludeMessage.Show();
            pg7.lblOverflowCeasedMedsDoNotIncludeMessage.Show();
        }
    }
}
// ***** End of Control Events *****

// ***** Submit Events *****
function PageVisibility_Check() {
    pageIds = myApp.Properties.PageIDs();
    var Page4_Controls = ["txtAllergyDescriptionSubstanceOverflow", "txtAllergyCategoryDescriptionReactionOverflow", "txtAllergyReactionCommentManifestationOverflow"];
    var Page6_Controls = ["txtOverflowDCMedNameAndStrength", "txtOverflowDCNumberToTakeDirections", "txtOverflowDCMedDurationEndDate",
        "ddOverflowDCMedStatus", "txtOverflowDCMedIndicationPurpose"];
    var Page7_Controls = ["txtOverflowCeasedMedicineName", "txtOverflowCeasedReasonForCeasing"];
    // IF Page 4 Allergies /Adverse Reaction Repeaters have no 
    Visibility_Check(pg4, FULL_ALLERGIES_COUNT, Page4_Controls);
    // IF Page 6 Medications on Discharge Repeaters have no values 
    Visibility_Check(pg6, OF_MEDICATION_COUNT, Page6_Controls);
    if (pageIds.indexOf("page6of1") != -1) {
        Visibility_Check(myApp.Page(pageIds[pageIds.indexOf("page6of1")]), OF_MEDICATION_COUNT, Page6_Controls);
    }
    // IF Page 7 Ceased Medications Repeaters have no values 
    Visibility_Check(pg7, OF_CEASED_MEDICATION_COUNT, Page7_Controls);
    if (pageIds.indexOf("page7of1") != -1) {
        Visibility_Check(myApp.Page(pageIds[pageIds.indexOf("page7of1")]), OF_CEASED_MEDICATION_COUNT, Page7_Controls);
    }
}
// ***** End of Submit Events *****

// ***** General Functions *****
function GetJSONObject() {

    var obj = {};    
    if (pg9.auStaffSignNameRole.Value()) {
        obj.ActivityId = appActivityId;
        obj.SubmittingUserId = Vitro.Users(pg9.auStaffSignNameRole.Value().SignerDetails).Property(Vitro.USER.Id)
        obj.DocumentAuthorUserId = Vitro.Users(pg9.auStaffSignNameRole.Value().SignerDetails).Property(Vitro.USER.Id)
        obj.TransactionEvent = "newupload";
        obj.ModeOfSeparation = pg1.txtDischargeDestination.Value();
        obj.OrgName = myApp.Activity.Properties.Patient(Vitro.PATIENT.OrgName);
    }
    else {
        obj.ActivityId = "";
        obj.SubmittingUserId = "";
        obj.DocumentAuthorUserId = "";
        obj.TransactionEvent = "";
        obj.ModeOfSeparation = "";
        obj.OrgName = "";
    }

    return obj;
}

function SendJSONRequest() {          
        
        var obj = GetJSONObject();
 
        // if sending fails, show error
        function RelayResponse(response) {
            if (response.StatusCode != 200) {
                if (!BCChannelBroken) {
                        // temporary alert log will change once transferred to api
                        alert("ERROR = " + obj.toString());
                        BCChannelBroken = true;                     
                    }
                }
            }

        myApp.Activity.Extra(JSON.stringify(obj));
        Vitro.Workflow.Relay(Vitro.Elements.GetHIPS().hipsHost, JSON.stringify(obj), false, RelayResponse);
        myApp.Enable(BTN_UPLOAD);
}

// Checks if any repeater has value
function Repeater_Values_Check(p, count, controlsArr) {
	for (var i = 0; i < count; i++) {
	    for (var a = 0; a < controlsArr.length; a++) {
	        if (p.Control(controlsArr[a] + "[" + i + "]").Value()) {
	            return true;
	        }
	    }
	}
	return false;
}

// Checks the if the row has value
function Repeater_Row_Values_Check(p, controlsArr, index) {
    var anyControl = false;
    var allControls = 0;
    for (var a = 0; a < controlsArr.length; a++) {
        if (p.Control(controlsArr[a] + "[" + index + "]").Value()) {
            anyControl = true;
            allControls++;
        }
    }
	return {"any": anyControl, "all": allControls == controlsArr.length};
}

// Gets the difference between date 1 and date 2
function Get_Days(d1, d2) {
    var t2 = d2.getTime();
    var t1 = d1.getTime();
    
    if (d2.getFullYear() === d1.getFullYear() &&
        d2.getMonth() === d1.getMonth() &&
        d2.getDate() === d1.getDate()) {
            t2 = (new Date(d2.setHours(23))).setMinutes(59);
            if (t2 > t1) {
                return 0;
            }
            else {
                return -1;
            }
    }
    else {
        t1 = (new Date(d1.setHours(0))).setMinutes(0);
        t2 = (new Date(d2.setHours(0))).setMinutes(0);
        return Math.floor((t2-t1)/(24*3600*1000));
    }
}

// Checks the page print and chartbook visibility
function Visibility_Check(p, REPEATER_COUNT, CONTROLS) {
    if (!Repeater_Values_Check(p, REPEATER_COUNT, CONTROLS)) {
        // Set Page Print Visibility False 
        // Set Page Chartbook Visibility False
        p.PrintVisibility(false).ChartVisibility(false);
    }
    else {
        // Set Page Print Visibility True 
        // Set Page Chartbook Visibility True 
        p.PrintVisibility(true).ChartVisibility(true);
    }
}
// ***** End of General Functions *****