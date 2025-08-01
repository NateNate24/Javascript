var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();

// Create and set standard progress notes functionality 
Vitro.Elements.CreateProgressNotesButton(myApp, true);

var pg1 = myApp.RegisterPage("Isobar");

var GROUP_SUPER_USER = "Super User";
var GROUP_ADMIN_USER = "Admin";
var GROUP_MANAGER = "Manager";
var GROUP_SCANNING = "Scanning";
var ACTION_CEASE = "Cease";
var BTN_PROG_NOTES = "Progress Notes";

pg1.RegisterControls("dpDate", "dpTime", "txtName", "cmbHospital", "txtHospital",
  "cmbDoctor", "txtPatientFullname", "txtPatientFullname", "txtAbout", "btnLastObs",
  "txtBP1", "txtBP2", "txtPR", "txtResp", "txtSaO2", "txtTemp", "txtPain", "txtSedation", "txtBGL",
  "txtBlood", "txtWounds", "txtStoma", "cblModifications", "cblAdvancedCare", "chkDocYes", "chkDocNo",
  "chkCareYes", "chkCareNo", "txtBackground", "txtAdmitted", "txtProcedure", "txtSurgical", "txtProblem",
  "txtTransfer", "txtReview", "txtTreatment", "txtRecommendations", "txtOrder", "txtConfirm", "auNurseSign", 
  "auDoctorSign", "btnOK", "pnlPopUp", "chkUseOBS", "txtDesignation1", "txtDesignation2", "lblAlert", "btnAlertOK", "pnlAlert", 
  "txtDoctorPrintName", "txtNursePrintName", "txtWard2", "txtDoctor", "txtSurname", "txtSex", "txtMobile", "pnlCeaseInfo", 
  "lblCeased", "txtReason", "imgClientLogo", "txtAdvanced");

// Hospital names and their corresponding MR 450, arranged in order.
var ORG_NAME = ["Wakefield", "North Adelaide", "Central Districts", "Hobart", "Launceston", "Riverina", "John James", "ACT Bruce"];
var APP_450 = ["MR450W", "MR450N", "MR450C", "MR450H", "MR450N", "MR450R", "MR450J", "MR450B"];
var LBL_HASDRAFT = "An open activity exists for MR 251, please open this activity to complete observations or request this activity to be sealed prior to creating a new activity";
var LBL_USERS = "These signatures are not unique. Signature 1 must be different from Signature 2";

// The event handlers
myApp.Events.Ready(MyApp_Ready);
myApp.Events.Loaded(MyApp_Loaded);
myApp.Events.Actions(MyApp_Action);
myApp.Events.Unload(function(){
   Vitro.ReleaseApp(appActivityId);
     myApp = null;
});

// Register all controls and events of page
function RegisterControlEvents()
{
  
  pg1.txtTransfer.Events.Click(TextClickHandler);
  pg1.txtReview.Events.Click(TextClickHandler);
  pg1.txtTreatment.Events.Click(TextClickHandler);  
  
  pg1.auNurseSign.Events.Change(SignHandler);
  pg1.auDoctorSign.Events.Change(SignHandler);
  
  pg1.btnLastObs.Events.Click(LastObsHandler);
  pg1.btnOK.Events.Click(OKHandler);
  
  pg1.btnAlertOK.Events.Click(AlertOKHandler);
    
  pg1.txtBP1.Events.Change(BPHandler);
  pg1.txtBP2.Events.Change(BPHandler);
  
}

Vitro.Elements.SetActionButtonVisibility(myApp);
Vitro.Elements.CreateCeaseButton(myApp);
Vitro.Elements.SetUnsealAction(myApp, appActivityId, function () { myApp.Clean(); });

// App Ready page event
function MyApp_Ready()
{ 
  if (pg1.dpDate.Value() == "" || pg1.dpDate.Value() == null)
  {
    var currentDate = new Date();
    pg1.dpDate.Value(currentDate);
    pg1.dpTime.Focus();
    pg1.dpTime.Value(currentDate);
  }

  if(status == Vitro.STATUS.New)
  {
    if (HasOtherInstance()) 
    {
      SetReadOnlyControls(true);
      pg1.auNurseSign.Disable();
      pg1.auDoctorSign.Disable();
      pg1.Clean();

      pg1.lblAlert.Value(LBL_HASDRAFT);     
      pg1.pnlAlert.Show();
    }
    else
    {
      
      pg1.txtPatientFullname.Value(myApp.Activity.Properties.Patient(Vitro.PATIENT.FirstName) + " " +  myApp.Activity.Properties.Patient(Vitro.PATIENT.MiddleName) + " " + myApp.Activity.Properties.Patient(Vitro.PATIENT.LastName));    
      pg1.txtName.Value(Vitro.Users().Property(Vitro.USER.FirstName) + " " + Vitro.Users().Property(Vitro.USER.LastName));
          
      SetCharLimit(); 
    }
  }
  
  AddHospital();
  Vitro.Elements.GetClientLogo(myApp, pg1.Control("imgClientLogo"));
}

// App Loaded page event
function MyApp_Loaded()
{
  if (status != Vitro.STATUS.New && status != Vitro.STATUS.Sealed && status != Vitro.STATUS.Deleted)
  {
    RegisterControlEvents();
    pg1.txtPatientFullname.Value(myApp.Activity.Properties.Patient(Vitro.PATIENT.FirstName) + " " +  myApp.Activity.Properties.Patient(Vitro.PATIENT.MiddleName) + " " + myApp.Activity.Properties.Patient(Vitro.PATIENT.LastName));    
    pg1.txtName.Value(Vitro.Users().Property(Vitro.USER.FirstName) + " " + Vitro.Users().Property(Vitro.USER.LastName));
          
    SetCharLimit(); 

    Authorisations_Check();
  }
  
  Vitro.Elements.SetAddressograph(myApp);
  Vitro.Elements.GetClientLogo(myApp, pg1.Control("imgClientLogo"));
}

// Action event of page
function MyApp_Action(action)
{

  if (action == Vitro.ACTIONS.Seal)
  {
    if(pg1.auNurseSign.Value() == "" || pg1.auDoctorSign.Value() == "")
    {
    
      pg1.lblAlert.Value("Signatory requirements have not been completed for sealing, please ensure this is completed before sealing");     
      pg1.pnlAlert.Show();
      Vitro.Elements.SetPositionEvents(myApp, pg1, pg1.pnlAlert);
      SetReadOnlyControls(true);  
      pg1.auNurseSign.Disable();
      pg1.auDoctorSign.Disable();
      return false;
    }
    else {
      myApp.Activity.Extra("Sealed");
      if (pg1.auNurseSign.Value() != "") {
        pg1.auNurseSign.ReadOnly(true);
        
      }
      if (pg1.auDoctorSign.Value() != "") {
        pg1.auDoctorSign.ReadOnly(true);
      }
      SetReadOnlyControls(true);  
    }
  }
  
  if (action == Vitro.ACTIONS.Submit)
  {   
    if(myApp.Properties.IsDirty() == false)
    {
      pg1.lblAlert.Value("No data has been entered / updated"); 
      pg1.pnlAlert.Show();
      Vitro.Elements.SetPositionEvents(myApp, pg1, pg1.pnlAlert);
      SetReadOnlyControls(true);  
      pg1.auNurseSign.Disable();
      pg1.auDoctorSign.Disable();
      return false;
    }
    else {
      // IF authorisation has value 
      // Set the authorisation as read only and persist 
      if (pg1.auNurseSign.Value() != "") {
        pg1.auNurseSign.ReadOnly(true);
      }
      if (pg1.auDoctorSign.Value() != "") {
        pg1.auDoctorSign.ReadOnly(true);
      }
    }      
        
  } 
  
  if (action == Vitro.ACTIONS.Restore)
  {   

    pg1.auNurseSign.Writeable();
    pg1.auDoctorSign.Writeable();
    
    if(pg1.auNurseSign.Value() == "" && pg1.auDoctorSign.Value() == "")
    {
      SetReadOnlyControls(false); 
    }else
    {
      SetReadOnlyControls(true);  
    }

  } 
  return true;
}

// Open Chartbook in new tab  
function OpenChartBook()
{
  
  var appname = myApp.Properties.Name();
  var appID = Vitro.Workflow.GetApp(appname);   
  
  var patientID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));    
  
  var token = Vitro.Workflow.GetToken(Vitro.Users().Property(Vitro.USER.Name));
  var mrn = myApp.Activity.Properties.Patient(Vitro.PATIENT.MRN);
  var orgid = myApp.Activity.Properties.Patient(Vitro.PATIENT.OrgId);
  
  var activities = Vitro.Workflow.GetActivities(patientID, undefined, undefined, undefined);
  
   //is there activity?
  if(activities != null && activities.length != 0)
  {   
    // Make the default URL for chartbook
    var cburl = window.location.protocol.toString() + "//" + window.location.hostname.toString();
    if (window.location.port != "")
      cburl += ":" + window.location.port.toString() + "/";
    cburl += window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/"));
    
    cburl += "?auth=" + token + "&Navigate=Chart&patient=" + mrn + "&organisation=" + orgid + "&display=restricted";
    
    window.open(cburl, "ChartBook");
  }
}

// Strike through textbox handler
function TextClickHandler(pg, ctrl)
{ 
  var ctrlName = ctrl.Properties.ID();
  
  var val1 = pg1.txtTransfer.Value();  
  var val2 = pg1.txtTransfer.Value();  
  var val3 = pg1.txtTransfer.Value();  
  var count = 0;
  var strike = "-------------------";

  if(pg1.txtTransfer.Value() !=  "") count += 1;
  if(pg1.txtReview.Value() !=  "") count += 1;
  if(pg1.txtTreatment.Value() !=  "") count += 1;
  
    if(count >= 2)
    {   
      ctrl.Value("");
    }
    else
    {
      if(ctrl.Value() == "")
      {
        ctrl.Value(strike);
      }else
      {
        ctrl.Value("");
      }
    }
    

}

// Set controls Readonly upon sign
function SetReadOnlyControls(state)
{
  var Page_Controls = pg1.Controls("dpDate", "dpTime", "txtName", "cmbHospital", "cmbDoctor", "txtAbout", "txtBP1", 
    "txtBP2", "txtPR", "txtResp", "txtSaO2", "txtTemp", "txtPain", "txtSedation", "txtBGL", "txtBlood", "txtWounds",
    "txtStoma", "chkDocYes", "chkDocNo", "chkCareYes", "chkCareNo", "txtBackground", "txtAdmitted", "txtProcedure", "txtSurgical",
    "txtProblem", "txtRecommendations", "txtOrder", "txtConfirm", "txtAdvanced")
  if(state == true)
  {
    Page_Controls.Each.ReadOnly(true);
        pg1.cmbHospital.Hide();      
    pg1.cmbDoctor.Hide();
    
    pg1.txtWard2.Show().Value(pg1.cmbHospital.Value());
    pg1.txtDoctor.Show().Value(pg1.cmbDoctor.Value());
      
    pg1.btnLastObs.Disable();
    
    pg1.txtTransfer.Disable();
    pg1.txtReview.Disable();
    pg1.txtTreatment.Disable();  
  }
  else
  {   
    Page_Controls.Each.Writeable();
    
    pg1.cmbHospital.Show();
    pg1.cmbDoctor.Show();
    
    pg1.txtWard2.Hide().Value("");
    pg1.txtDoctor.Hide().Value("");
          
    pg1.btnLastObs.Enable();
    
    pg1.cblModifications.Writeable();
    pg1.cblAdvancedCare.Writeable();
    
    pg1.txtTransfer.Enable();
    pg1.txtReview.Enable();
    pg1.txtTreatment.Enable();

    pg1.cmbHospital.Enable();
    pg1.cmbDoctor.Enable();
  }
}

// Nurse signs handler
function SignHandler(pg, ctrl, oldValue, newValue)
{ 
  // IF “Signature 1” value is the equal to “Signature 2” value
  if (pg1.auDoctorSign.Value() != "" && pg1.auNurseSign.Value() != "" &&
    (pg1.auDoctorSign.Value().SignerDetails == pg1.auNurseSign.Value().SignerDetails)) {
      pg1.auNurseSign.Disable();
      pg1.auDoctorSign.Disable();
      // Show and populate the message “These signatures are not unique. Signature 1 must be different from Signature 2” 
      pg1.lblAlert.Value(LBL_USERS);     
      pg1.pnlAlert.Show();
      Vitro.Elements.SetPositionEvents(myApp, pg1, pg1.pnlAlert);
      ctrl.Value(oldValue)
  }
  if(newValue != "")
  {
    var signername = newValue.SignerDetails;
    var signerFullname = Vitro.Users(signername).Property("FirstName") + " " + Vitro.Users(signername).Property("LastName");
    var signerRole = Vitro.Users(signername).Property(Vitro.USER.Role);                         
    
    if(ctrl.Properties.ID() == "auNurseSign")
    {
      
      pg1.txtDesignation1.Value(signerRole);
      pg1.txtNursePrintName.Value(signerFullname);
        
      if(pg1.auDoctorSign.Value().SignerDetails == signername)
      {       
        ctrl.Value("");   
        pg1.txtDesignation1.Value("");        
        pg1.txtNursePrintName.Value("");          
        return false;
      }
    }
    else
    {
      pg1.txtDesignation2.Value(signerRole);
      pg1.txtDoctorPrintName.Value(signerFullname);
      if (newValue.SignerDetails != Vitro.Users().Property(Vitro.USER.Name)) {
        ctrl.ReadOnly(true);
      }
      else {
        ctrl.Writeable();
      }
    } 
    
    if (!(myApp.Activity.Extra() == "Ceased" || myApp.Activity.Extra() == "Sealed")) {
      if(pg1.auNurseSign.Value() && pg1.auDoctorSign.Value())
      {
          myApp.Hide(Vitro.ACTIONS.Submit);
          myApp.Show(Vitro.ACTIONS.Seal);    
      }
    }
    
    SetReadOnlyControls(true);
  }
  else // remove sign
  { 
    if(ctrl.Properties.ID() == "auNurseSign")
    {
      pg1.txtDesignation1.Value("");
      pg1.txtNursePrintName.Value("");
    }else
    {
      pg1.txtDesignation2.Value("");
      pg1.txtDoctorPrintName.Value("");
    }
  
    if(pg1.auNurseSign.Value() == "" && pg1.auDoctorSign.Value() == "")
    {
      SetReadOnlyControls(false);
    }

    if((!pg1.auNurseSign.Value() || !pg1.auDoctorSign.Value()) && !(myApp.Activity.Extra() == "Sealed" || myApp.Activity.Extra() == "Ceased"))
    {
      myApp.Show(Vitro.ACTIONS.Submit);
      myApp.Hide(Vitro.ACTIONS.Seal); 
    }
  }
  
}

// Get last observations from the current hospital
function LastObsHandler(pg, ctrl)
{ 
  pg1.pnlPopUp.Show();
    
}

// Get the 450 app for current hospital / organisation
function Get450HospitalAppName()
{
  var hospitalName = pg1.txtHospital.Value();
    var appName = "";
  
  for(var i = 0; i < ORG_NAME.length - 1; i++)
  {
    
    var n = hospitalName.indexOf(ORG_NAME[i]);
    
    if(n > 0) 
    {
       appName = APP_450[i];      
    }
    
  }
  
  return appName;
}

// Get last observation for 450 app data
function GetLastObservation(appName)
{
  var appID = Vitro.Workflow.GetApp(appName);   

  //get the patientID
  var patientID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));  
  var MRN = myApp.Activity.Properties.Patient(Vitro.PATIENT.MRN);
  var episode = myApp.Activity.Properties.Episode(Vitro.EPISODE.Number);
  
  //get the userid
  var userID =  parseInt(Vitro.Users().Property(Vitro.USER.Id));
  //get the episodeid
  var episodeID = parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID));  
    
  //get the activities
  var activities = Vitro.Workflow.GetActivities(patientID, undefined, appID, Vitro.STATUS.Draft);

  var act = Vitro.Workflow.GetActivity(activities[activities.length-1].Id);
  
  
  switch (appName)
  {
    case "MR 450N Adult Observation Chart" :
    
      var deepAct = act.Deepen();
      var page = deepAct.ActivityPages();
      
      var controls  = deepAct.PageControls(page.pg2);
      var BP = deepAct.PageControls(deepAct.ActivityPages()["pg2"])["cht4"].Value;  
      pg1.txtBP1.Value(BP);
      break;
    
    default:
      break;
  }
  
}

// When Get data to MR 450 was checked
function OKHandler(pg, ctrl)
{ 
    
  pg1.pnlPopUp.Hide();  

  if(pg1.chkUseOBS.Value() == true)
  {
    
    var appName = Get450HospitalAppName();
    switch (appName) 
    {
      case "MR450W" :
              
        break;
      case "MR450N" :
        GetLastObservation("MR 450N Adult Observation Chart");
        break;
        
      case "MR450C":
      
        break;
        
      case "MR450H":
      
        break;
      case "MR450N":
      
        break;
      case "MR450R":
      
        break;
      case "MR450J":
      
        break;
        
      case "MR450B":
      default:
        
        break;
    }
  
  }
  
  pg1.chkUseOBS.Value(false);
  
}

// Alert OK when click
function AlertOKHandler(pg, ctrl)
{
  pg1.pnlAlert.Hide();
  
  if (pg1.lblAlert.Value() == LBL_HASDRAFT) 
  {
    myApp.Action(Vitro.ACTIONS.Delete, true);
  }

  else
  {
    // if (pg1.auDoctorSign.Value().SignerDetails == pg1.auNurseSign.Value().SignerDetails) {
    //   ctrl.Value(oldValue);
    // }
    if(pg1.auNurseSign.Value() == "" && pg1.auDoctorSign.Value() == "") 
    {
      SetReadOnlyControls(false); 
    
      
    }else
    {
      SetReadOnlyControls(true);    
    }
    
    pg1.auNurseSign.Enable();
    pg1.auDoctorSign.Enable();
  } 
  
  pg1.lblAlert.Value("");
}

// BP handler when change events
function BPHandler(pg, ctrl, oldValue, newValue)
{ 
  ctrl.Value(limitText(newValue, oldValue));
}

//return limited value for textbox
function limitText(newValue, oldValue)
{
  var maxlength = 3;
  
  if(newValue.length >= maxlength) {
    newValue = newValue.substring(0,maxlength); 
    if(parseInt(newValue) > 500) newValue = 500;
  }
  
  return newValue;
}

function SetCharLimit()
{
  // As advised, remove character limit as clinical risk
  // If it needs to be reinstated, simply remove this return call
  return;
  
    pg1.txtAbout.Attribute(Vitro.TEXTBOX.CharLimit, "250", true);
    pg1.txtBackground.Attribute(Vitro.TEXTBOX.CharLimit, "56", true);
    pg1.txtAdmitted.Attribute(Vitro.TEXTBOX.CharLimit, "40", true);
    
    pg1.txtProcedure.Attribute(Vitro.TEXTBOX.CharLimit, "37", true);
    pg1.txtSurgical.Attribute(Vitro.TEXTBOX.CharLimit, "37", true);
    
    pg1.txtProblem.Attribute(Vitro.TEXTBOX.CharLimit, "392", true);
    
    pg1.txtRecommendations.Attribute(Vitro.TEXTBOX.CharLimit, "280", true);
    pg1.txtOrder.Attribute(Vitro.TEXTBOX.CharLimit, "280", true);
    pg1.txtConfirm.Attribute(Vitro.TEXTBOX.CharLimit, "56", true);
}

function AddHospital()
{
  var hospName = pg1.txtHospital.Value();
  
  if(hospName.indexOf("North Adelaide") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital CA  St Catherine");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital CL  St Clares");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital CONT  Continence Clinic");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital DIC Day Infusion Centre");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital DPS Day Ward");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital DS  Delivery Suite");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital HE  St Helens");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital ICU Intensive Care Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital MP  Mary Potter Hospice");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital MT  Maternity");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital NY  Nursery");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4305 Calvary North Adelaide Hospital ON  Oncology");
    
  } 
    
  if(hospName.indexOf("Central Districts") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  A AWard");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  D DWard");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  DSU Day Surgery Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  G Grote Wing");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  HDU HDU");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  M MWard");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4331 Calvary Central Districts Hospital  ONC Oncology Unit");
  }
  
  if(hospName.indexOf("Wakefield") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  DOSA  DOSA");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  ANG Angiography Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  WR  Waiting Room");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  CCU CCU");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  CSD Cardiac Step Down");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  D Davidson");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  DSU Day Surgery Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  EDW Emergency Waiting Room");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  ICU ICU");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  J Jay");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  K Kidd");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  L Lyon Medical");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  T Tibbits");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "4329 Calvary Wakefield Hospital  WSC Surgicentre");    
    
  }
  
  if(hospName.indexOf("Private") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  3S  3 South (Public Ward)");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  6EWH  6 East Womens Health");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  6W  6 West");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  DAY Day Surgery");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  DOSA  DOSA");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  DS  Delivery Suite");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  HG  Hyson Green Ward");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  HGDAY Hyson Green Day");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  HGL Hyson Green Lounge");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "86 Calvary Private Hospital ACT  SSU Sleep Studies");
    
  }
  
  if(hospName.indexOf("John James") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital A Aubrey Tow");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital ICU ICU");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital C Curtin");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital D Deakin");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital DSU Day Surgery");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital G Garran");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital M Maternity");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital NN  Neonate Nursery");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital LW  Labour Ward");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital DOSA  DOSA");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "85 Calvary John James Hospital DD  Deakin Day");
  }
  
  if(hospName.indexOf("Luke") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STL  St Lukes  FW  Findlay");    
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STL  St Lukes  HWW Hardy Wilson");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STL  St Lukes  DSU St Lukes Day Surgery");     
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STL  St Lukes  SS  Sleep Studies");    
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STL  St Lukes  CCL Calvary Clinic");   
    
  }
  if(hospName.indexOf("Vincent") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STV  St Vincents JN  St Johns and BM");    
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STV  St Vincents DS  St Vincents Day Surgery");    
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STV  St Vincents JA  St James");     
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "STV  St Vincents EU  Endoscopy Unit"); 
  }
  
  if(hospName.indexOf("Riverina") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CDPC Calvary Riverina Surgicentre  CDPC  CDPC");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital DEL Delivery Suite");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital DOSA  DOSA");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital SAE St Annes East");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital SAW St Annes West");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital SCN Special Care Nursery");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital SDU Sleep Studies");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital SE  St Elizabeths");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHWW Calvary Riverina Hospital STG St Gerards");
  } 
    
  if(hospName.indexOf("Lenah") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital AEWR  AE Waiting Room");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital CCU CCU");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital DAS Day Angio Suite");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital DOSA  DOSA");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital EN  Endoscopy Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital FE  First East");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital FN  First North");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital SF  Second - Surgical");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary Lenah Valley Hospital WS  Womens Services");    
  }
  
  if (hospName.indexOf("St Johns") > -1)
  {
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital CH  Chemotherapy");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital DS  Day Surgery Unit STJ");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital GB  Gibson Unit");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital RHS Rehabilitation Services");    
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital SN  Second - Neuro");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  CCalvary St Johns Hospital  SS  Second - Surgical");
    pg1.cmbHospital.Attribute(Vitro.COMBOBOX.Add, "CHCTS  Calvary St Johns Hospital SU  Simpson Unit");
  }
}

// Get the formmatted date value
function GetFormatDate(dateVal)
{   
    var dd = dateVal.getDate();
    var mm = dateVal.getMonth()+1; //January is 0!
    var yyyy = dateVal.getFullYear();
  
    if(dd<10){
        dd='0'+dd;
    } 
    if(mm<10){
        mm='0'+mm;
    }   
    
  var formattedDate = dd +'/'+ mm +'/'+ yyyy;

  return formattedDate;
}


// check if app has active instance
function HasOtherInstance (argument) {
  var workflow = Vitro.Workflow;
  var activity = myApp.Activity;
  // get the app name
  var appName = myApp.Properties.Name();
  // get app id
  var appID = workflow.GetApp(appName)
  // get the current episode id
  var episodeID = parseInt(activity.Properties.Episode(Vitro.EPISODE.ID));
  // get the patient id
  var patientID = parseInt(activity.Properties.Patient(Vitro.PATIENT.ID)); 
  
  // collect all draft activities with in this episode
  var draftActivities = workflow.GetActivities(patientID, episodeID, appID, Vitro.STATUS.Draft);
  
  // check if array contains an item
  var hasdDraftActivities = draftActivities.length > 0; 

  // if one of collected array contains a item return true, else false
  return hasdDraftActivities;
}

function Authorisations_Check() {
  var user = Vitro.Users().Property(Vitro.USER.Name);
  // IF the activity is not Sealed AND "Signature 1” value is the same as the logged in user
  if (pg1.auNurseSign.Value().SignerDetails === user) {
    // Set “Signature 1” as writable
    pg1.auNurseSign.Writeable();
  }

  // IF the activity is not Sealed AND "Signature 2” value is the same as the logged in user
  if (pg1.auDoctorSign.Value().SignerDetails === user) {
    // Set “Signature 2” as writable
    pg1.auDoctorSign.Writeable();
  }
}