var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();

// Constant variables
var PAGE_WIDTH = "794";
var PAGE_HEIGHT = "1123";
var CUSTOM_CEASE = "Cease";
var CUSTOM_PROGRESSNOTES = "Progress Notes";

// Page variable
var pgAdmission1 = myApp.RegisterPage("pgAdmission1");
var pgAdmission2 = myApp.RegisterPage("pgAdmission2");
var actionsFlag = false;

// Controls collection
var checkboxCtrlsPg1 = pgAdmission1.Controls(
    "cblAmountOfTime", "cblAccomplished", "cblOtherActivities", "cblPastWeeks");
var checkboxCtrlsPg2 = pgAdmission2.Controls(
    "cblFullOfLife", "cblNervous", "cblDownDumps", "cblCalm", "cblEnergy", "cblDown", 
    "cblWornOut", "cblHappy", "cblTired", "cblPastWeeks");

var question1Ctrls = pgAdmission1.Controls(
    "chkYesA", "chkNoA", "chkYesB", "chkNoB", "chkYesC", "chkNoC");
var question2Ctrls = pgAdmission1.Controls(
    "chkNotAtAll", "chkLittleBit", "chkModerately", "chkQuiteABit", "chkExtremely");
var q3StandardScoringCtrls = pgAdmission2.Controls(
    "chkAllTimeB", "chkMostTimeB", "chkGoodBitTimeB", "chkSomeTimeB", "chkLittleTimeB", "chkNoneTimeB",
    "chkAllTimeC", "chkMostTimeC", "chkGoodBitTimeC", "chkSomeTimeC", "chkLittleTimeC", "chkNoneTimeC",
    "chkAllTimeF", "chkMostTimeF", "chkGoodBitTimeF", "chkSomeTimeF", "chkLittleTimeF", "chkNoneTimeF",
    "chkAllTimeG", "chkMostTimeG", "chkGoodBitTimeG", "chkSomeTimeG", "chkLittleTimeG", "chkNoneTimeG",
    "chkAllTimeI", "chkMostTimeI", "chkGoodBitTimeI", "chkSomeTimeI", "chkLittleTimeI", "chkNoneTimeI");
var q3ReverseScoringCtrls = pgAdmission2.Controls(
    "chkAllTimeA", "chkMostTimeA", "chkGoodBitTimeA", "chkSomeTimeA", "chkLittleTimeA", "chkNoneTimeA",
    "chkAllTimeD", "chkMostTimeD", "chkGoodBitTimeD", "chkSomeTimeD", "chkLittleTimeD", "chkNoneTimeD", 
    "chkAllTimeE", "chkMostTimeE", "chkGoodBitTimeE", "chkSomeTimeE", "chkLittleTimeE", "chkNoneTimeE", 
    "chkAllTimeH", "chkMostTimeH", "chkGoodBitTimeH", "chkSomeTimeH", "chkLittleTimeH", "chkNoneTimeH");
var question4Ctrls = pgAdmission2.Controls(
    "chkAllTime", "chkMostTime", "chkSomeTime", "chkLittleTime", "chkNoneTime")


// Mental Health (MH) Controls - 3b, 3c, 3d, 3f, 3h
var MH_Ctrls = pgAdmission2.Controls(
    "chkAllTimeB", "chkMostTimeB", "chkGoodBitTimeB", "chkSomeTimeB", "chkLittleTimeB", "chkNoneTimeB",
    "chkAllTimeC", "chkMostTimeC", "chkGoodBitTimeC", "chkSomeTimeC", "chkLittleTimeC", "chkNoneTimeC",
    "chkAllTimeD", "chkMostTimeD", "chkGoodBitTimeD", "chkSomeTimeD", "chkLittleTimeD", "chkNoneTimeD",
    "chkAllTimeF", "chkMostTimeF", "chkGoodBitTimeF", "chkSomeTimeF", "chkLittleTimeF", "chkNoneTimeF",
    "chkAllTimeH", "chkMostTimeH", "chkGoodBitTimeH", "chkSomeTimeH", "chkLittleTimeH", "chkNoneTimeH");

// Vitality (VT) Controls - 3a, 3e, 3g, 3i
var VT_Ctrls = pgAdmission2.Controls(
    "chkAllTimeA", "chkMostTimeA", "chkGoodBitTimeA", "chkSomeTimeA", "chkLittleTimeA", "chkNoneTimeA",
    "chkAllTimeE", "chkMostTimeE", "chkGoodBitTimeE", "chkSomeTimeE", "chkLittleTimeE", "chkNoneTimeE",
    "chkAllTimeG", "chkMostTimeG", "chkGoodBitTimeG", "chkSomeTimeG", "chkLittleTimeG", "chkNoneTimeG",
    "chkAllTimeI", "chkMostTimeI", "chkGoodBitTimeI", "chkSomeTimeI", "chkLittleTimeI", "chkNoneTimeI");

// Role Functioning (RF) Controls - 1a, 1b, 1c
var RF_Ctrls = question1Ctrls;
// Social Functioning (SF) Controls - 2, 4
var SF_Ctrls_P1 = question2Ctrls;
var SF_Ctrls_P2 = question4Ctrls;

// Objects - Store MCQ selections per row.
var question1Obj = {
    A: 0,
    B: 0,
    C: 0 
};
// Split Q3 - Standard (0 .. 100) & Reverse (100 .. 0).
var q3_StandardScoreObj = {
    B: 0,
    C: 0,
    F: 0,
    G: 0,
    I: 0
}
var q3_ReverseScoreObj = {
    A: 0,
    D: 0,
    E: 0,
    H: 0
}

// Store total value per question - default values as set out in app spec.
// Default 2 & 4 = 9, single parts
var question2Total = 0;
var question4Total = 0;
// MCQ's 1 & 3, multiple parts
var question1Total = 0;
// Split Q3 - Standard (0 .. 100) & Reverse (100 .. 0)
var question3StandardTotal = 0;
var question3ReverseTotal = 0;

// Track number of valid responses - used in total calculation
var validResponses = 0;

// Action buttons to be displayed as per SBR
Vitro.Elements.SetActionButtonVisibility(myApp);
// Create Cease Action Button and implementation according to SBR
Vitro.Elements.CreateCeaseButton(myApp, PAGE_WIDTH, PAGE_HEIGHT);
// Create Action Progress Notes Button and implementation according to SBR
Vitro.Elements.CreateProgressNotesButton(myApp, true);
// Set Unseal implementation according to SBR
Vitro.Elements.SetUnsealAction(myApp, appActivityId);

// App level event handlers
myApp.Events.Loaded(myApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Unload(myApp_Unload);

// Show Action Button "Patient Mode" for all users
myApp.Show(Vitro.ACTIONS.PatientMode);

// Default Loaded handler
function myApp_Loaded() {
    if (status == Vitro.STATUS.Submitted) {
        // Call Client Logo Wrap legacy VitroApplication.js function in Typesafe call
        Vitro.Elements.GetClientLogo(myApp, pgAdmission1.Control("imgClientLogo"));
        Vitro.Elements.GetClientLogo(myApp, pgAdmission2.Control("imgClientLogo"));
        // Register controls and set events
        RegisterAllControls();
        SetEvents();
        
        // The Date field on page 1 green section has no value
        if (pgAdmission1.dpGreenSection.Value() == "") {
            // Populate Datepicker Page 1 with Today’s Date
            pgAdmission1.dpGreenSection.Value(new Date());
        }
        // Populate the patient label (Section 1) 
        Vitro.Elements.SetAddressograph(myApp);

        // Check if total not set - if so default to 999
        if (pgAdmission1.Control("txtTotalScore").Value() == "") {
            pgAdmission1.Control("txtTotalScore").Value(999);
        }
    }
}

// Set the event handlers
function SetEvents() {
    // Navigate to Page 2
    pgAdmission1.btnNext.Events.Click(function(){
        pgAdmission2.Activate();
    });

    // Navigate to Page 1
    pgAdmission2.btnPrevious.Events.Click(function(){
        pgAdmission1.Activate();
    });

    // Register CE for each CB per question.
    // Question 1 CE
    question1Ctrls.Each.Events.Change(function(){
        SetQuestion1Values();
        SetTotal();
    });
    // Question 2 CE
    question2Ctrls.Each.Events.Change(function(){
        SetQuestion2Values();
        SetTotal();
    });
    // Question 3 CE
    q3StandardScoringCtrls.Each.Events.Change(function(){
        SetQuestion3StandardValues();
        SetTotal();
    });
    q3ReverseScoringCtrls.Each.Events.Change(function(){
        SetQuestion3ReverseValues();
        SetTotal();
    });
    // Question 4 CE
    question4Ctrls.Each.Events.Change(function(){
        SetQuestion4Values();
        SetTotal();
    });
}

// Set value of Total Textbox on P1 based on user input - Question 1
function SetQuestion1Values() {
    // Set mapping for indivudal CBs & Corresponding Score Value
    const valueMapping = {
        "Yes": 0,
        "No": 100
    };
    // Get current score of MCQs Q1.
    question1Total = Vitro.Elements.GetMultiMCQsScore(question1Ctrls, question1Obj, valueMapping);
}

// Set value of Total Textbox on P1 based on user input - Question 2
function SetQuestion2Values() {
    // Set mapping for indivudal CBs & Corresponding Score Value
    const valueMapping = {
        "Not": 100,
        "Little": 75,
        "Moderate": 50,
        "Quite": 25,
        "Extreme": 0,
    };
    // Set key values in question2 based off CB ticked.
    question2Total = Vitro.Elements.GetMCQScore(question2Ctrls, valueMapping);
}

// Set value of Total Textbox on P1 based on user input - Question 3
function SetQuestion3StandardValues() {
    // Set mapping for indivudal CBs & Corresponding Score Value
    const valueMapping = {
        "All": 0,
        "Most": 20,
        "Good": 40,
        "Some": 60,
        "Little": 80,
        "None": 100
    };
    // Set key values in question3 based off CB ticked.
    question3StandardTotal = Vitro.Elements.GetMultiMCQsScore(q3StandardScoringCtrls, q3_StandardScoreObj, valueMapping);
}

// Set value of Total Textbox on P1 based on user input - Question 3
function SetQuestion3ReverseValues() {
    // Set mapping for indivudal CBs & Corresponding Score Value
    const valueMapping = {
        "All": 100,
        "Most": 80,
        "Good": 60,
        "Some": 40,
        "Little": 20,
        "None": 0
    };
    // Set key values in question3 based off CB ticked.
    question3ReverseTotal = Vitro.Elements.GetMultiMCQsScore(q3ReverseScoringCtrls, q3_ReverseScoreObj, valueMapping);
}

// Set value of Total Textbox on P1 based on user input - Question 2
function SetQuestion4Values() {
    // Set mapping for indivudal CBs & Corresponding Score Value
    const valueMapping = {
        "All": 0,
        "Most": 25,
        "Some": 50,
        "Little": 75,
        "None": 100
    };
    // Set question4 value based on controls.
    question4Total = Vitro.Elements.GetMCQScore(question4Ctrls, valueMapping);
}

// Update total questionnaire score on P1.
function SetTotal() {
    // Verify if minimum controls per category have been completed.    
    if (Vitro.Elements.CategoriesCompleted(MH_Ctrls, VT_Ctrls, RF_Ctrls, SF_Ctrls_P1, SF_Ctrls_P2)) {
        // Get total sections answered - this is the number of Valid Responses
        validResponses = Vitro.Elements.GetAnsweredTotal(MH_Ctrls, VT_Ctrls, RF_Ctrls, SF_Ctrls_P1, SF_Ctrls_P2);
        // Calculate MCQScore (A) & the divide that by the valid number of responses (B)
        let MCQScore = question1Total + question2Total + question3StandardTotal + question3ReverseTotal + question4Total;
        let totalScore = MCQScore / validResponses;
        // Set Total TB & round number to 2 deicmal places.
        pgAdmission1.Control("txtTotalScore").Value(Math.round(totalScore * 100) / 100);
    } else { // Minimum number of valid responses not met, default Score to 999
        pgAdmission1.Control("txtTotalScore").Value(999);
    }
}

// Actions handler
function myApp_Actions(action) {
    // Submit: Set Controls to ReadOnly.
    if (action == Vitro.ACTIONS.Submit) {
        // Make Datepicker Page 1 Read-Only Persist
        pgAdmission1.dpGreenSection.ReadOnly(true);
        // Make all Checkboxlists on Pages 1 & 2 Read-only Persist
        checkboxCtrlsPg1.Each.ReadOnly(true);
        checkboxCtrlsPg2.Each.ReadOnly(true);
    }
    
    // Patient Mode: Hide Actions & Total Score
    if (action == Vitro.ACTIONS.PatientMode) {
        if(!actionsFlag) {
            // Hide Actions, Total (Score), Re-enable PatientMode action so user can exit.
            EnableDisableActions(false, [CUSTOM_CEASE, CUSTOM_PROGRESSNOTES]);
            pgAdmission1.Control("txtTotalScore").Hide();
            actionsFlag = true;
        } else {
            EnableDisableActions(true, [CUSTOM_CEASE, CUSTOM_PROGRESSNOTES]);
            pgAdmission1.Control("txtTotalScore").Show();
            actionsFlag = false;
        }
        myApp.Enable(Vitro.ACTIONS.PatientMode);
    }
}

// Enable / Disable Action buttons (optional custom buttons ["Cease", "Progress Notes"])
function EnableDisableActions(enable, custom) {
    var arr = custom || [];
    var arrLen = arr.length;

    if (enable) {
        for (var a in Vitro.ACTIONS) {
            myApp.Enable(Vitro.ACTIONS[a]);
        }

        for (var i = 0; i < arrLen; i++) {
            myApp.Enable(arr[i]);
        }
    } else {
        for (var b in Vitro.ACTIONS) {
            myApp.Disable(Vitro.ACTIONS[b]);
        }

        for (var j = 0; j < arrLen; j++) {
            myApp.Disable(arr[j]);
        }
    }
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
    myApp = null;
}

// Register controls
function RegisterAllControls() {
    pgAdmission1.RegisterControls("dpGreenSection", "btnNext");
    pgAdmission2.RegisterControls("btnPrevious");
}