// Dev note: original spacing of the repeater is 14.74 and was adjusted for Google Chrome display.
var myApp = Vitro.RegisterApp(appActivityId);
var status = myApp.Activity.Properties.Status();
      
// The event handlers 
myApp.Events.Ready(MyApp_Ready);
myApp.Events.Loaded(MyApp_Loaded);
myApp.Events.Actions(myApp_Actions);
myApp.Events.Actioned(myApp_Actioned);
myApp.Events.Unload(myApp_Unload);

// key for communication between obschart and progress notes
var OBS_TO_NOTES_XAIM_KEY = "ObsChartToProgNotes";

// page defaults     
var PAGE_WIDTH = 794;
var PAGE_HEIGHT = 1123;

// Stciker and drawing constants
var IMAGE_XPOS = 159;
var IMAGE_YPOS = 250;
var NOTE_HEIGHT = 838;

// Character Per line
var CHARS_PER_LINE = 65;
// Lines Per Page also used to register Repeater Controls
var LINES_PER_PAGE = 54;
// Repeater Spacing
var REPEATER_SPACING = 14.73;
// Spaces for Images
var STICKER_LINES = 23;
var PHOTO_LINES = 23;
// Mark the Last Line in Entry with a Dynamic Control
var Mark = false;
// Store Sticker Index in case we have to strike a sticker
var StickerSticker_Index = 0;
// Flag if whole entry has been Striked (For Submitted Event)
var StrikeNoteAllSubmit = false;
// Array to hold all the Page IDs
var PageIDs = [];
// Flag to determine if Unstrike has occured
var Unstrike = false;
// Used for storing holder for signature line
var SIG = "Sig";
var COSIG = "CoSign";
// constant identifying where a note entry is completed
var NOTE_COMPLETED = "Completed";
// display text for the strike line
var STRIKE_TXT = "====================================================================================================================================================";
// Hold the Final Index of a Multi Strike Needed for looping
var Final_Index = 0;
//Active Page to create co-sign buttons
var Page = {};
// Store page object to check if loaded
var nxtPage = {};
// On submit stop app from closing
var DONT_CLOSE = false;
// Register the pages
var pgNotes = myApp.RegisterPage("pgNotes");
var pgClone = myApp.RegisterPage("pgClone");

// list of sticker apps for the user to select from 
var StickersList = JSON.parse(Vitro.Elements.StickerNames);
var stickerApps = [];

for (var a in StickersList){
    stickerApps.push(a);
}

// if user is in super user group
var isSuperUser = Vitro.Users().InGroup("Super User");
// if user is within group that can co-sign
var isCoSignUser = Vitro.Users().InGroup("Registered Nurse") || Vitro.Users().InGroup("Anaesthetic Technician") ||
    Vitro.Users().InGroup("Registered Midwife") || Vitro.Users().InGroup("Lactation Consultant") || 
    Vitro.Users().InGroup("Enrolled Nurse") || Vitro.Users().InGroup("Student Nurse");
// Groups to be authorised for co-signs
var AUTHORISED_GROUPS = "Registered Nurse^3|Anaesthetic Technician^3|Registered Midwife^3|Lactation Consultant^3";
// Store the Groups for populating Popup Dropdowns
var Groups = Vitro.Users().Groups();
// helping to determine if strike or unstrike
var StrikeAll = false;
// key for sending activity id from sticker and for receiving sticker id
var XAIM_STICKER_KEY = "STICKER_NOTES_COMMUNICATION";
// Mark rows depending on entry
var IMAGE_ID = "_Sticker";
var PHOTO_ID = "_Photo";  
// Current User Details
var CURRENT_USER = Vitro.Users().Property(Vitro.USER.Name);
// mark the last line with dynamic button
var Last = false;
//Finsihed Striking
var Finished = true;
var strikedFrom1stPage = false;
var endOfGroup = false;
var strikedPage = null;
// Strike sticker
var Sticker_Strike = false;

var StrikeButton = false;

var XaimText = false;

var ObsValue = null;

var NOTES = "Integrated Notes";
var NOTIFICATION = "Notification";

var dsMessageRecipient = myApp.DataSource("Message Recipient");

// Manage the button indexes
var Button_indexes = [];

var photo_strike = true; 

// image control properties
var imageParams = {
    PHOTO: {
        width: "505",
        height: "330",
        x: "120"
    },
    STICKER: {
        width: "505",
        height: "330",
        x: "120"
    },
    FREEHAND: {
        width: "505",
        height: "330",
        x: "120"
    }
};

// create xaim to send the activtiy id
var xaimObj = {
    NoteActId: appActivityId,
    IsUpdate: false,
    pageId: "",
    Colour: ""
};
// set colour defaults
var COLOURS = {
    DARK_GREY: "255,89,89,89",
    TRANS_GREY: "100, 205, 201, 201",
    LIGHT_GREY: "255,217,217,217",
    CUSTOM_GREY: "90,217,217,217",
    WHITE: "255, 255, 255, 255",
    TRANSPARENT: "0, 0, 0, 0"
};

//Need to store Colour for user per Entry
var  Colour = ""; 
// Specific User Colours
var USER_COLOURS = {
    "Doctor" : "255, 181,205,133",
    "Intensivist" : "255, 181,205,133",
    "Physiotherapist" : "255, 141, 179, 226",
    "Pharmacist" : "255, 141, 179, 226",
    "Dietician" : "255, 141, 179, 226",
    "Speech Language Therapist" : "255, 141, 179, 226",
    "Occupational Therapist" : "255, 141, 179, 226",
    "Hospital Administration" : "255, 127, 127, 127",
    "System Administrator" : "255, 127, 127, 127",
    "Registered Nurse" : "255, 194, 232, 236",
    "Student Nurse" : "255, 194, 232, 236",
    "Enrolled Nurse" : "255, 194, 232, 236",
    "Anaesthetic Technician" : "255, 194, 232, 236",
    "Registered Midwife": "255, 178, 161, 199",
    "Lactation Consultant" : "255, 194, 232, 236",
    "Super User" : "255, 252, 214, 182"
};

// Events variables
var tempEvents = {
    evSubmit: null,
    evScroll: null,
    evZoom: null,
    evResize: null
};

// Holder for Summary
var summary = "";
// store dynamic controls
var popupObj = null;
// Store Dynamic Label
var strikeButtons = [];
// Store CoSignbuttons
var coSignButtons = [];
// store all note pages
var notesPages = [];
// if switching to sticker after submit
var changingApp = false;
// Flag whether this is the newest activity for an episode (and so could be editable - older ones are not editable)
var isNewest = true;
// episode id (set as 0 if none)
var epID = (myApp.Activity.Properties.Episode(Vitro.EPISODE.ID) == "") ? 0 : parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID), 10);
// The version (change-set) number of this activity
var actVersion = 0;
// count and list of strike ids
var strikeCount = 0;
var strikeList = {};
// Flag if the pages are loaded
var Loading_Start = null;
// Defer the loading of all Pages
SetPageLoading(Loading_Start);

myApp.PageManager.Events.Added(Pages_Added);
//Displayed event so the user is pushed back to notes page if popup is visible
myApp.PageManager.Events.Displayed(Pages_Displayed);
// Show/hide the relevant actions
// If we are NEW or DRAFT or SUBMITTED
if (status != Vitro.STATUS.Sealed && status != Vitro.STATUS.Deleted) {
    
    //Hide all action buttons
    for (var a in Vitro.ACTIONS) {
        myApp.Hide(Vitro.ACTIONS[a]);
    }
    
    myApp.Show(Vitro.ACTIONS.Close);
    myApp.Show(Vitro.ACTIONS.Print);
    myApp.Enable(Vitro.ACTIONS.Close);
    myApp.Enable(Vitro.ACTIONS.Print);
}
// If this activity is SEALED or DELETED
else {
    // This user is not in the Super User group, hide unseal
    if (status == Vitro.STATUS.Sealed) {
        myApp.Show(Vitro.ACTIONS.Print);
        if(isSuperUser) {
            myApp.Show(Vitro.ACTIONS.Unseal);
        }
    }
    // Convert a Restore action to a Submit action - we are avoiding the DRAFT state
    myApp.Events.Action(function() {
        myApp.Action(Vitro.ACTIONS.Submit, false);
        return false;
    }, Vitro.ACTIONS.Restore);

    // When the state change is completed, either an Unseal or a Submit (really a Restore)
    myApp.Events.Actioned(function(a) {
        if (a == Vitro.ACTIONS.Unseal || a == Vitro.ACTIONS.Submit) {
            // Reload the same activity in the changed status
            myApp.Existing(appActivityId);
            myApp.Action(Vitro.ACTIONS.ChangeApp);
            return false;
        }
    });
}

// Handler for pages that are added to the App
// We set their default zoom to fit to the view
function Pages_Added(pg) {
    
   // register controls   
    RegisterNoteControls(pg);
    if(status != Vitro.STATUS.Sealed){
        // set events
        pg.rptNotes.Events.Click(ClickNoteEvent);
        // Panel at bottom of the page allows user to add note if page is exactly full
        pg.pnlClickNote.Events.Click(AddNote);		
    }
    
    var page = {
        "Page_Index" : null,
        "Page" :  null
    };
    // store pages & Sort them for partial page loading
    if(pg.Properties.ID() == "pgNotes"){
        page.Page_Index = 0;
        page.Page = pg;

        notesPages.push(page);
        if(status != Vitro.STATUS.Sealed){
            setTimeout(function(){
                SetupStrikeButton(pg);
            }, 100);
        }
    }
    else{
        var page_Title = pg.Properties.ID();
        var title = page_Title.replace("pgNotesof", "");
        title = parseInt(title, 10);
        page.Page_Index = title;
        page.Page =  pg;
        
        notesPages.splice(title, 0, page);
        notesPages.sort(SortByProperty("Page_Index"));
        notesPages.reverse();
        notesPages.splice(0, 0, notesPages[notesPages.length-1]);
        notesPages.splice(notesPages.length-1, 1);
        
    }
    
    var Page_Found = false;
    
    for(var i = 0; i < PageIDs.length; i++){
        if(pg.Properties.ID() == PageIDs[i].pageId){
            Page_Found = true;
            break;
        }
    }

    if(!Page_Found && pg.Properties.ID() != "pgClone"){
        nxtPage = {
                "pageId": pg.Properties.ID(),
                "Loaded" : true
                };
        PageIDs.splice(1, 0, nxtPage);
    }
}

// sort function to keep notePages aligned after page loading (Stage Loading)
function SortByProperty(property) {
    var sortFunc = function (a, b) {
        if (a[property] < b[property]) {
            return -1;
        }
        if (a[property] > b[property]) {
            return 1;
        }
        return 0;
    };

    return sortFunc;
}

// When the page is displayed to the user
function Pages_Displayed() {
    // Build co-sign buttons per page when displayed
    // Performance enhancement
    Page = myApp.PageManager.GetActive();
    strikedFrom1stPage = false;
    if(status != Vitro.STATUS.Sealed){
        SetupStrikeButton(Page);        
        Vitro.Elements.SetAddressograph(myApp, Page);
    }
}

// Ready event handler
function MyApp_Ready() {
    // Even if new, defer to the loaded method
    if (status == Vitro.STATUS.New) {
        MyApp_Loaded();
    }
}

// Loaded event handler
function MyApp_Loaded() {
    // If not deleted
    if (status != Vitro.STATUS.Deleted) {

        pgClone.Hide();   

        // Array of page IDs
        var pgIds = myApp.Properties.PageIDs();
        myApp.Page(pgIds[0]).Activate();
        Vitro.Elements.SetAddressograph(myApp, myApp.Page(pgIds[0]));
        
        if(pgNotes.Title() == NOTES){
            pgNotes.Title(SetTitle());
        }
        
        // Get all activities (for this episode, if applicable)
        var appId = Vitro.Workflow.GetApp(myApp.Properties.Name());
        var allActivities = Vitro.Workflow.GetActivities(parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID)), epID, appId);

        // Remove deleted activities from the list
        for (var i = allActivities.length - 1; i >= 0; i--) {
            if (allActivities[i].Status == Vitro.STATUS.Deleted) {
                allActivities.splice(i, 1);
            }
        }

        // For each activity
        for (var act = 0; act < allActivities.length; act++) {
            // Find this one
            if (allActivities[act].Id == appActivityId) {
                // Remember the change-set number
                actVersion = allActivities[act].VersionNumber;
                // Is this one the newest or not?
                if (act != allActivities.length - 1) { 
                    isNewest = false; 
                }
            }
        }

        // Only show the buttons if this activity is the newest and not sealed - i.e. we can only add tho this one
        if (isNewest && myApp.Activity.Properties.Status() != Vitro.STATUS.Sealed) {        
            myApp.Custom("Add Note",
                "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAADAAAAAwCAYAAABXAvmHAAAACXBIWXMAAAsTAAALEwEAmpwYAAAKTWlDQ1BQaG90b3Nob3AgSUNDIHByb2ZpbGUAAHjanVN3WJP3Fj7f92UPVkLY8LGXbIEAIiOsCMgQWaIQkgBhhBASQMWFiApWFBURnEhVxILVCkidiOKgKLhnQYqIWotVXDjuH9yntX167+3t+9f7vOec5/zOec8PgBESJpHmomoAOVKFPDrYH49PSMTJvYACFUjgBCAQ5svCZwXFAADwA3l4fnSwP/wBr28AAgBw1S4kEsfh/4O6UCZXACCRAOAiEucLAZBSAMguVMgUAMgYALBTs2QKAJQAAGx5fEIiAKoNAOz0ST4FANipk9wXANiiHKkIAI0BAJkoRyQCQLsAYFWBUiwCwMIAoKxAIi4EwK4BgFm2MkcCgL0FAHaOWJAPQGAAgJlCLMwAIDgCAEMeE80DIEwDoDDSv+CpX3CFuEgBAMDLlc2XS9IzFLiV0Bp38vDg4iHiwmyxQmEXKRBmCeQinJebIxNI5wNMzgwAABr50cH+OD+Q5+bk4eZm52zv9MWi/mvwbyI+IfHf/ryMAgQAEE7P79pf5eXWA3DHAbB1v2upWwDaVgBo3/ldM9sJoFoK0Hr5i3k4/EAenqFQyDwdHAoLC+0lYqG9MOOLPv8z4W/gi372/EAe/tt68ABxmkCZrcCjg/1xYW52rlKO58sEQjFu9+cj/seFf/2OKdHiNLFcLBWK8ViJuFAiTcd5uVKRRCHJleIS6X8y8R+W/QmTdw0ArIZPwE62B7XLbMB+7gECiw5Y0nYAQH7zLYwaC5EAEGc0Mnn3AACTv/mPQCsBAM2XpOMAALzoGFyolBdMxggAAESggSqwQQcMwRSswA6cwR28wBcCYQZEQAwkwDwQQgbkgBwKoRiWQRlUwDrYBLWwAxqgEZrhELTBMTgN5+ASXIHrcBcGYBiewhi8hgkEQcgIE2EhOogRYo7YIs4IF5mOBCJhSDSSgKQg6YgUUSLFyHKkAqlCapFdSCPyLXIUOY1cQPqQ28ggMor8irxHMZSBslED1AJ1QLmoHxqKxqBz0XQ0D12AlqJr0Rq0Hj2AtqKn0UvodXQAfYqOY4DRMQ5mjNlhXIyHRWCJWBomxxZj5Vg1Vo81Yx1YN3YVG8CeYe8IJAKLgBPsCF6EEMJsgpCQR1hMWEOoJewjtBK6CFcJg4Qxwicik6hPtCV6EvnEeGI6sZBYRqwm7iEeIZ4lXicOE1+TSCQOyZLkTgohJZAySQtJa0jbSC2kU6Q+0hBpnEwm65Btyd7kCLKArCCXkbeQD5BPkvvJw+S3FDrFiOJMCaIkUqSUEko1ZT/lBKWfMkKZoKpRzame1AiqiDqfWkltoHZQL1OHqRM0dZolzZsWQ8ukLaPV0JppZ2n3aC/pdLoJ3YMeRZfQl9Jr6Afp5+mD9HcMDYYNg8dIYigZaxl7GacYtxkvmUymBdOXmchUMNcyG5lnmA+Yb1VYKvYqfBWRyhKVOpVWlX6V56pUVXNVP9V5qgtUq1UPq15WfaZGVbNQ46kJ1Bar1akdVbupNq7OUndSj1DPUV+jvl/9gvpjDbKGhUaghkijVGO3xhmNIRbGMmXxWELWclYD6yxrmE1iW7L57Ex2Bfsbdi97TFNDc6pmrGaRZp3mcc0BDsax4PA52ZxKziHODc57LQMtPy2x1mqtZq1+rTfaetq+2mLtcu0W7eva73VwnUCdLJ31Om0693UJuja6UbqFutt1z+o+02PreekJ9cr1Dund0Uf1bfSj9Rfq79bv0R83MDQINpAZbDE4Y/DMkGPoa5hpuNHwhOGoEctoupHEaKPRSaMnuCbuh2fjNXgXPmasbxxirDTeZdxrPGFiaTLbpMSkxeS+Kc2Ua5pmutG003TMzMgs3KzYrMnsjjnVnGueYb7ZvNv8jYWlRZzFSos2i8eW2pZ8ywWWTZb3rJhWPlZ5VvVW16xJ1lzrLOtt1ldsUBtXmwybOpvLtqitm63Edptt3xTiFI8p0in1U27aMez87ArsmuwG7Tn2YfYl9m32zx3MHBId1jt0O3xydHXMdmxwvOuk4TTDqcSpw+lXZxtnoXOd8zUXpkuQyxKXdpcXU22niqdun3rLleUa7rrStdP1o5u7m9yt2W3U3cw9xX2r+00umxvJXcM970H08PdY4nHM452nm6fC85DnL152Xlle+70eT7OcJp7WMG3I28Rb4L3Le2A6Pj1l+s7pAz7GPgKfep+Hvqa+It89viN+1n6Zfgf8nvs7+sv9j/i/4XnyFvFOBWABwQHlAb2BGoGzA2sDHwSZBKUHNQWNBbsGLww+FUIMCQ1ZH3KTb8AX8hv5YzPcZyya0RXKCJ0VWhv6MMwmTB7WEY6GzwjfEH5vpvlM6cy2CIjgR2yIuB9pGZkX+X0UKSoyqi7qUbRTdHF09yzWrORZ+2e9jvGPqYy5O9tqtnJ2Z6xqbFJsY+ybuIC4qriBeIf4RfGXEnQTJAntieTE2MQ9ieNzAudsmjOc5JpUlnRjruXcorkX5unOy553PFk1WZB8OIWYEpeyP+WDIEJQLxhP5aduTR0T8oSbhU9FvqKNolGxt7hKPJLmnVaV9jjdO31D+miGT0Z1xjMJT1IreZEZkrkj801WRNberM/ZcdktOZSclJyjUg1plrQr1zC3KLdPZisrkw3keeZtyhuTh8r35CP5c/PbFWyFTNGjtFKuUA4WTC+oK3hbGFt4uEi9SFrUM99m/ur5IwuCFny9kLBQuLCz2Lh4WfHgIr9FuxYji1MXdy4xXVK6ZHhp8NJ9y2jLspb9UOJYUlXyannc8o5Sg9KlpUMrglc0lamUycturvRauWMVYZVkVe9ql9VbVn8qF5VfrHCsqK74sEa45uJXTl/VfPV5bdra3kq3yu3rSOuk626s91m/r0q9akHV0IbwDa0b8Y3lG19tSt50oXpq9Y7NtM3KzQM1YTXtW8y2rNvyoTaj9nqdf13LVv2tq7e+2Sba1r/dd3vzDoMdFTve75TsvLUreFdrvUV99W7S7oLdjxpiG7q/5n7duEd3T8Wej3ulewf2Re/ranRvbNyvv7+yCW1SNo0eSDpw5ZuAb9qb7Zp3tXBaKg7CQeXBJ9+mfHvjUOihzsPcw83fmX+39QjrSHkr0jq/dawto22gPaG97+iMo50dXh1Hvrf/fu8x42N1xzWPV56gnSg98fnkgpPjp2Snnp1OPz3Umdx590z8mWtdUV29Z0PPnj8XdO5Mt1/3yfPe549d8Lxw9CL3Ytslt0utPa49R35w/eFIr1tv62X3y+1XPK509E3rO9Hv03/6asDVc9f41y5dn3m978bsG7duJt0cuCW69fh29u0XdwruTNxdeo94r/y+2v3qB/oP6n+0/rFlwG3g+GDAYM/DWQ/vDgmHnv6U/9OH4dJHzEfVI0YjjY+dHx8bDRq98mTOk+GnsqcTz8p+Vv9563Or59/94vtLz1j82PAL+YvPv655qfNy76uprzrHI8cfvM55PfGm/K3O233vuO+638e9H5ko/ED+UPPR+mPHp9BP9z7nfP78L/eE8/sl0p8zAAAABGdBTUEAALGOfPtRkwAAACBjSFJNAAB6JQAAgIMAAPn/AACA6QAAdTAAAOpgAAA6mAAAF2+SX8VGAAAGDElEQVR42uyZXWxbZxnHf+fDduLYSe3G2dJ8tmnXtZ1GV6ltxtZcUTIJIaYOJFgpYx9A0bZGAnExDcR2gbhAcMGXxAVcTKwSBK0XW6ut0tayjhtasTUUlsYhrRPbsZ0cf8XHxz4+57xc1OlokzIvcSJH2l868rFsHf3/z/N/3vd5zisJIdjIkNngUBdvXjw92wz8HDgG+BqQaxr4PfDDn3yh01wiAPhVwKs+3dmmIjUgewHB2Zz1g0zRUoDv3yLgxdOzCvC4IkEqbzW6348tEVC1TLNuOhvB9qFlawBgQTcav2jdHu4oYCMkQL3tu3TsjxF6NrnaBGTzRqXhBbQ1u5jJVqRXjvZ+JKhiC2Xxx5XCcgSqvPbrV8UWSzOSWLDsFrc8c5cV7VnREicEC4ZN0KuuKXlbCPJqz/U7Wuqlrw2uOPqXZgwG+7xrKqBYcfjeqfj/rYm64N9TUfzeJoyyufqiVRRKZoXd27prKuq6oefu9roGpNZVCYDX3/1HTQ92qQqPfPYzn3aj9dwXAPji0L5P54H6NtIaxsWLiFwWgJ+OniD26KNrW8T1gplIIP/lT+TyWdR7duILfE7ZEEVsWRbZ+XnmX36ZzR0dND30EPnRUYZ7cwGgC4g1tIVSqRRJTUO0tmIkkxTOnAFJYtf1Sz5N139RFdGYRZxKpQiHw7SHQvS/8AIfnBjBp2kEm5uxdB1H1w/S0rIZiDVcBuLxOOPj4/T399Pf10fRcfA/9RSaLDMZiZCv2CLidr+CJF1tuCKem5sjHA6zZ88evF4vE+FJSqUSZVnG/cwzqG+d5VLvUHr4/ddewradhirirBbjypVJ9u69H5/Px/jVCUzTRJIkCoUCss9H4Phx/h5uXzjf/7CzOA80hIUcM0b8n7/G31SgqamZaCyGEAKPx0OxqCMh8Kgq27cNNN5ObGhnyIRH6Nv+TaJXTzJ5OY8reACPx0MymaRklJAVlaGhIUwhA7n16UZrQSnzNunw84QGngM5T+fWN5hLNKNrNmpwEF0v4PG4CfUMoKoqZsVZv3b641DOnkMb/zah7ScQIomZ+xmOYeF1TpJNxDHLNh53L4cOPUx4JtlY7bShnSY9MUJo4Ds41jTlhV/imBalNEyPmUjq2wTv3sfewcdRVdcn70ZXi4C/hZnE/LITmVx8B7f2I+4aeAK7Mk059zucioWZh+i/FGS3zKYdO3C6nmAqNoeqKAT8LevbTneGAnfw/Dm0+I9p33YMpxKnOP8HhG1jlSE6riI3yYTu2U334AVkpbb3y+r6Few7aOPfIrT161jGNfTkSYRj49gwO6mieGQ2b99N98Haya+bgEXPt/d+mYo+gZ4aBXGDfPK6C9ktE9i66xOTXxcBpfRZ0hMjbO75ElZp+iPyDsxFb5Df1LOLrhWQX/OduJw9j3b1u7T3PoZdjt9Cfj7mQlKr5A+cXxH5NRVQSr/J/IdP09731SWR12ZdSIpMW1eVvNpW36F+NRCOjZEcIz01QnvfESxjCj35Z8DBcSCdcIEs07plF137V0d+TTJQzkXQPnwTf+A4FT2xhLyQ6kf+pgAVq26vlTPXruEO7KecC5KPugC5ruTF8gJsSWL1Z3uWoWNkUng3dWBbXoR0gLLxJJnUgwhJxt+5s26RvylgmAuSil2XDMyOvUdb1wDl+SiScFDVAFZ5P8Lai79zJ90H3l01eUlCGuaCdEsGlBsCVifCLGIVs6iSwMwmsUsFTD2LqWdo2/IgPYMX6xN5scwq5Ec35uxW+xuvTq/4uU1jr/Ls4XvxJq9TMUsUiiWKlszfpIN8EOnHiSTqYhmXIjlLBOwhXMYO38eNI8xuoAPw1rpKCceRr5D5zam/XuIrD2wpYuquBdl/6j9O67kQUQ4TXfG0CRSBFBAF5rAp3i5AVC/zf+a1LOCq2upjrXV5bGxfJBJpavX7Lo86zm937L7vfey6mEUAFaBQ5WYC4i0OiaO3bWQCsKp/NIFMNfo11cXU1FRHMBh84JHPH46Xlpv7VifCqXIzq59imAvA0SUCnKpaq9bIL+LIkSNnAUrmmhzTimWum/jvALAVulXkskgrAAAAAElFTkSuQmCC");
            myApp.Order("Add Note", 5);
            // Its event handler
            myApp.Events.Action(AddNote, "Add Note");

            // Add Photo custom action butto
            myApp.Custom("Add Photo", 
            "data:image/png;base64,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AeydB5wcd3n3n5md7eWK7k530smWZVnYcpFcsLENuNCxCfASA3lDCyGUQPISCC0Jsc2bkBBaQiCUEAgBApgXcMCAKW64YAvcbbnJsspJd7p+2+vM+3tmdu5WsiRU7k63u7//5/Zmdvp8Z3bm/3QRNhIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARIgARJoGwJG25wpT5QESIAESIAE2oiA48gB3vHOPhT2v5hhyL4L7rMev5IACZAACZAACTQbgf2/9ZvtLHi8JEACJEACJNCEBDwhvVHOvrr+Xr6y4Wy+i2mb69MvwvTH6+NnY3wrxk/FcLs7bdu2PcZqfBP/39CYt+wgpg1PeeM6f39toMuRIdE/GRzsxUFtc/9k9fKGAzzekc0Pi6yfapi2DuO31Le4HuNX1Odd3bCXK2eXNwxjdrxhAY6SAAmQAAmQAAksAoGDdwYW4QC4CxIgARIgARJoBQL7F+avxKmpAN+LjwruENq33GFus5LGaituSCBqiAnB3IwYYoSNqfSI2dXVJTOZitnRgVUzQUy3jIxZNJIKKYH/RgHbSei32cHc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7+d28+OwO9lnQHVvi3knzvd299lu/tsCggclARIgARIggb1CYL8/XOwVjqwHCZAACZAACQwicKO/tTe6/6B63Sz7jTrlN7r/zTovlksCJEACJEAC+57Afnuo2PfAeQIkQAIkQAIksA0C+/V3mk78Ni4ys5IACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACZAACRxSAv8/yTB5pphb+LoAAAAASUVORK5CYII=");
            myApp.Order("Add Photo", 5);
            // Its event handler
            myApp.Events.Action(AddPhoto, "Add Photo");

            // Add Sticker custom action button
            myApp.Custom("Add Sticker", 
            "data:image/png;base64,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");
            myApp.Order("Add Sticker", 5);
            // Its event handler
            myApp.Events.Action(SelectSticker, "Add Sticker");

            // Handover Note custom action button
            myApp.Custom("Handover Note");
            myApp.Events.Action(HandOverNote, "Handover Note");
            
            // Send Message custom action button
            myApp.Custom("Send Message");
            myApp.Events.Action(SendMessage, "Send Message");
            if(isSuperUser){
                myApp.Show(Vitro.ACTIONS.Seal);
                myApp.Show(Vitro.ACTIONS.History);
            }
        }
        
        var key = OBS_TO_NOTES_XAIM_KEY;
        ObsValue = Vitro.Xaim(key).Initialisation();
        if(ObsValue != "" && ObsValue !== null && ObsValue !== undefined){
            ObsValue = ObsValue.obsValues;
            XaimText = true;
            AddNote();
        }
        SetUpDataSource();
    }
    if (status == Vitro.STATUS.Sealed)
    {
        myApp.Show(Vitro.ACTIONS.Print);
        if (isSuperUser)
        {
            myApp.Show(Vitro.ACTIONS.Unseal);
        }
        else
        {
            myApp.Hide(Vitro.ACTIONS.Unseal);
        }
    }

    // Big check in here and may cause a reload
    HandleReload();
    // Clean the app so that we dont incorrectly show the "unsaved changes" dialog. All submits are controlled via input dialogs and workflow anyway.
    myApp.Clean();
}

// Generic handler for when Submit is completed
function myApp_Actions(action) {
    
    if (action == Vitro.ACTIONS.Submit) {
        // we disable the close button to prevent user closing app before submit completes
        myApp.Disable(Vitro.ACTIONS.Close);
        // we hide the action to prevent double clicking
        myApp.Hide(Vitro.ACTIONS.Submit);
    }
}

// Generic handler for when Submit is completed
function myApp_Actioned(action) {
    
    if (action == Vitro.ACTIONS.Submit) {
        // Reset the activity from workflow (it will have a new revision)
        actVersion = Vitro.Workflow.GetActivity(appActivityId).VersionNumber;

        // If we were storing data - remove it (Needs to be here to remove the value)
        var storedVal = Vitro.Xaim(appActivityId).Initialisation();
        // if a sticker was selected, change app after submit is completed
        if (changingApp) {
            myApp.Action(Vitro.ACTIONS.ChangeApp);
            return false;
        } 
        else {
            RestoreDefaults(pgNotes);
        }
    }
    
    // Dont close the App host
    if(DONT_CLOSE){
        DONT_CLOSE = false;
        return false;
    }
}

// Unload handler
function myApp_Unload() {
    Vitro.ReleaseApp(appActivityId);
    myApp = null;
}

// returns group in the list
function GetGroupColor(color) {
    var ret = color;
    if (Groups.length > 1) {
        for (var s = 0; s < Groups.length; s++) {
            if (Groups[s] != "Super User") {
                ret = Groups[s];
                break;
            }
        }
    }     
    return ret;
}

// Reload Data into the App
// Rerload Data into the App
function HandleReload() {
    var xaimVal = Vitro.Xaim(appActivityId).Initialisation();
    // If we have data defined for reloading
    if (xaimVal) {
        // there are strikes
        if (xaimVal.Strike) {
            // For each strike out
            for (var s in xaimVal.Strike) {
                // Get page and index
                var pg_ctl = s.split("~");
                var pg = myApp.Page(pg_ctl[0]);
                var index = parseInt(pg_ctl[1], 10);
                // if its the first page, check that the note is still there
                if (pg === pgNotes) {
                    // if note is there, continue with the add
                    var userName = pg.lblUser[index].Attribute(Vitro.LABEL.Content).replace(IMAGE_ID, "");
                    if (userName == Vitro.Users().Property(Vitro.USER.Name)) {
                        SetStrike(pg, index);
                    } 
                    // otherwise, go through pages from newest to oldest, looking for note
                    else {
                        for (var i = notesPages.length - 1; i > 0; i--) {
                            // get username on current page
                            userName = notesPages[i].Page.lblUser[index].Attribute(Vitro.LABEL.Content).replace(IMAGE_ID, "");
                            // if there is a note at the index from the user, we assume it is the one
                            if (userName == Vitro.Users().Property(Vitro.USER.Name)) {
                                SetStrike(notesPages[i].Page, index);
                                break;
                            }
                        }
                    }
                }
                // if not the first page then strike position will never move
                else {
                    SetStrike(pg, index);
                } 
            }
            // force reload
            ReloadApp({
                Strike: strikeList
            });
        }
        // there is a note
        else if (xaimVal.Note) {
            // Set the values and insert
            Colour = xaimVal.UserColour;
            InsertNote(pg, xaimVal.Note);
        }
        // there is a sticker
        else if (xaimVal.Sticker) {
            var stickerInfo = xaimVal.Sticker;
            // if it is an update
            if (stickerInfo.IsUpdate) {
                FindSticker(stickerInfo.StickerActId, stickerInfo.StickerPageId, stickerInfo.StickerStatus, stickerInfo.Page);
            }
            // if it is a new sticker
            else {
                Colour = stickerInfo.UserColour;    
                AddSticker(stickerInfo.StickerActId, stickerInfo.StickerPageId, stickerInfo.StickerStatus);
            }
        }
        // there is a photo
        else if (xaimVal.Photo) {
            var photoInfo = xaimVal.Photo;
            Colour = photoInfo.UserColour;
            InsertPhoto(photoInfo.imgPhoto, photoInfo.fhDrawing, photoInfo.txtNote);
        }
    }
    // if no data for reloading, check for sticker info
    else {
        var xaimInfo = Vitro.Xaim(XAIM_STICKER_KEY).Initialisation();
        if (xaimInfo) {
            // get sticker info
            var stickerActId = parseInt(xaimInfo.stickerId, 10);
            var stickerAct = Vitro.Workflow.GetActivity(stickerActId);
            if (stickerAct !== null) {
                // if adding a new sticker
                if (!xaimInfo.IsUpdate) {
                    summary = xaimInfo.stickerName;
                    // Colour = xaimInfo.UserColour; 
                    Colour = GetGroupColor(xaimInfo.UserColour);//Groups[0];
                    AddSticker(stickerActId, stickerAct.Pages[0].Id, xaimInfo.stickerCompleted);
                }
                // if updating an existing sticker
                else {
                    FindSticker(stickerActId, stickerAct.Pages[0].Id, xaimInfo.stickerCompleted, xaimInfo.pageId);
                }
            }
        }
    }
}

// remove all co-sign buttons then re-add them if user is not a student
function SetupStrikeButton(pg) {    
    // remove dynamic buttons
    RemoveStrikeButton(pg);
    RemoveCoSignButton(pg);

    var pos = "";
    var rep_spacing = 14.73;
    // re-add them
    for (var i = 0; i < LINES_PER_PAGE; i++) {
        
        var name = pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content).replace(" " + SIG, "");
        var sigName = pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content);
        var n = sigName.split(" ");
        var k = sigName.split(" ");  
        if (n[1] == "CoSign") { 
            name = pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content).replace(" CoSign", "");
        } 
              
         // if the user entry is from student / enrolled nurse
        var isStudentEntry = false;
        
        if (n[0] != "") {
            var userEntryName = n[0];
            if (n[0].toString().indexOf("_") !== -1) {
                    var nn = n[0].toString().split("_");
                    userEntryName = nn[0];                   
            }
            if (userEntryName != "" && userEntryName != "Completed") {
                isStudentEntry = Vitro.Users(userEntryName).InGroup("Student Nurse") || Vitro.Users(userEntryName).InGroup("Enrolled Nurse");       
            }
        }
        
        if(n[1] !== undefined && (n[1] == SIG) && (name == CURRENT_USER || isSuperUser) && sigName != "" && pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content) != NOTE_COMPLETED){
        
            // Positon the Dynamic Button
            pos = 675 + "," + (228 + (rep_spacing * i));
            // pos = 675 + "," + (GetYPos(i) - 19);
            // make button at position
            CreateStrikeButton(pg, pos, i);
            // Making sure to remove duplication of strike in 2nd index when there is already 0 index on pgnotes for cosign #59622
            if (pg.Control("txtStkIndex[0]").Value() && strikeButtons.length != 0) {
                strikeButtons[1].pg.DestroyControl(strikeButtons[1].strikeButton);
            }
        }

        if(k[1] !== undefined && k[1] == "CoSign" && sigName != "" &&
            pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content) != NOTE_COMPLETED &&
            pg.Control("lblCoSign[" + (i + 2) + "]").Value() == "" &&
            isCoSignUser && isStudentEntry){
                
            // Positon the Dynamic Button
            // pos = 570 + "," + (GetYPos(i) + 9);
            pos = 570 + "," + (258 + (rep_spacing * i));
            // make button at position
            CreateCoSignButton(pg, pos, i);

                if (i == 0)
                {
                    // setting strike when cosignuser to fix the bug of missing strike #59622
                    pos = 675 + "," + (258 + (rep_spacing * i));                  
                    // make button at position
                    CreateStrikeButton(pg, pos, i);
                }
        }
    }
}

// remove all co-sign buttons and clear array
function RemoveStrikeButton() {
    // remove dynamic buttons
    if (strikeButtons.length !== 0) {
        for (var i = 0; i < strikeButtons.length; i++) {
            // Remove buttons on pgNotes only
            strikeButtons[i].pg.DestroyControl(strikeButtons[i].strikeButton);
        }
    }
    strikeButtons = [];
}

// remove all co-sign buttons and clear array
function RemoveCoSignButton() {
    // remove dynamic buttons
    if (coSignButtons.length !== 0) {
        for (var i = 0; i < coSignButtons.length; i++) {
            // Remove buttons on pgNotes only
            coSignButtons[i].pg.DestroyControl(coSignButtons[i].signButton);
            coSignButtons[i].pg.DestroyControl(coSignButtons[i].auSign);
        }
    }
    coSignButtons = [];
}

// set co-signer details to the page
function SetButtonStrike(pg, index, CURRENT_USER, Striking) {
    // Determine if we are striking or clearing
    // Check a chunk of lines to make sure we are doing the correct action
    if(!Striking){
        StrikeAll = false;
        Unstrike = true;
    }
    else{
        StrikeAll = true;
        Unstrike = false;
    }
    // Set Submit event for Strike all action
    StrikeNoteAllSubmit = true;
    Mark = true;
    StrikeNoteAll(pg, index);
    if(Unstrike){
        for(var i =0; i<Button_indexes.length; i++){
            if(Button_indexes[i].Index === index && Button_indexes[i].page === pg){
                Button_indexes.splice(i, 1);
                break;
            }
        }
    }
    else{
        Button_indexes.push({
            page: pg,
            Index : index
        });
    }
}

// find what page the sticker is on and update it
function FindSticker(stickerActId, StickerpgId, isCompleted, pg) {
    // compare sticker ids
    //Get the page object
    pg = myApp.Page(pg);
    // Load the page the sticker needs to be updated on
    SetPageLoading(pg);
    
    // Which Image on the page are we updating
    if (pg.txtStickerId.Value() != "" && parseInt(pg.txtStickerId.Value()) === stickerActId) {
        // update sticker image
        UpdateSticker(pg, stickerActId, StickerpgId);
    }
    else if(pg.txtStickerId1.Value() != "" && parseInt(pg.txtStickerId1.Value()) === stickerActId) {
        // update sticker image
        UpdateSticker(pgNotes, stickerActId, StickerpgId);
    }
        
    // if sticker is completed, seal it
    if (isCompleted) {
        pgNotes.txtStickerId.Value("");
        // get sticker info
        var stickerAct = Vitro.Workflow.GetActivity(stickerActId);
        stickerAct.Status = Vitro.STATUS.Sealed;
        stickerAct.Update();
    }
        
    // store what you want to submit and reload app in case there is a conflict with a concurrent user  
    ReloadApp({
        Sticker: {
            StickerActId: stickerActId,
            StickerPageId: StickerpgId,
            StickerStatus: isCompleted,
            IsUpdate: true
        }   
    });
}   

// Select Sticker
function SelectSticker() {
    // create dynamic popup
    if(popupObj !== null){
        return false;
    }
    
    CreateDynamicStickerPopup(pgNotes, true);
    // set events
    popupObj.ddSticker.Events.Change(EnableOKEvent);
    // allowing for popup to get setup
    setTimeout(function() {
       popupObj.ddSticker.Focus();
    }, 100);
    
    popupObj.btnOK.Events.Click(StickerOkClickEvent);
    popupObj.btnCancel.Events.Click(ClearPopupEvent);
}

// Handover Note
function HandOverNote() {
    if(popupObj !== null){
        return false;
    }
    
    // create dynamic popup
    CreateDynamicHandoverPopup(pgNotes);
    // set events
    popupObj.btnCancel.Events.Click(ClearPopupEvent);
    popupObj.btnOK.Events.Click(NotePopupOkEvent);
    // set focus for user to begin typing
    setTimeout(function() {
        if(XaimText){
            popupObj.txtNote.Value(ObsValue);
            popupObj.btnOK.Enable();
        }
        popupObj.txtNote.Focus();
    }, 100);
    
}

// Send Message
function SendMessage() {
   // Hide all Page Tabs and disable Action Buttons.
   DisableActions();
    myApp.PageNavigationVisibility(false);
   // Create and display the Send Message Dialog. 
   // Zoom dialog to be full screen.
   // Populate user full name in the “Entry made by” Textbox
   // Set focus to the textbox in the dialog.
   // Disable Submit Button
       // create dynamic popup
    if(popupObj !== null){
        return false;
    }
    
    CreateDynamicSendMessagePopup(pgNotes);
    // // allowing for popup to get setup
    // setTimeout(function() {
    //    popupObj.ddSticker.Focus();
    // }, 100);

    popupObj.btnOK.Events.Click(Send_Message);
    popupObj.btnCancel.Events.Click(ClearPopupEvent);
    popupObj.txtMessageRecipient.Events.Click(RecipientDS_Load);


}

// Add a Sticker
function AddSticker(actId, pgId, stickerCompleted) {
    // get space for sticker
    var stickerSpace = "";
    var first = false;
    // Add 25 lines for the Sticker Space
    for (var i = 0; i < STICKER_LINES; i++) { stickerSpace += "\n"; }
    // add space to page and get index for sticker
    var imageIndex = AddSpace(stickerSpace, IMAGE_ID);
    
    //if this is the first sticker
    if(pgNotes.imgSticker.Value() === null){
        // set sticker position
        PositionImage(pgNotes.imgSticker, imageParams.STICKER, imageIndex);
        pgNotes.imgSticker.Attribute(Vitro.CONTROL.ZIndex, "2", true).Show().ReadOnly(true);
        // get sticker value and add to page
        UpdateSticker(pgNotes, actId, pgId);
        first = true;
    }
    else{
        // set sticker position
        PositionImage(pgNotes.imgSticker1, imageParams.STICKER, imageIndex);
        pgNotes.imgSticker1.Attribute(Vitro.CONTROL.ZIndex, "2", true).Show().ReadOnly(true);
        // get sticker value and add to page
        UpdateSticker(pgNotes, actId, pgId);
    }
    
    // Add the signature with the sticker
    AddText("", false);
    
    // if sticker not completed, store id for reopening
   if (!stickerCompleted) { 
        if(first){
            pgNotes.txtStickerId.Value(actId);
        } 
        else{
            pgNotes.txtStickerId1.Value(actId);
        }
    }
    // otherwise seal it
    else {
        var stickerAct = Vitro.Workflow.GetActivity(actId);
        if (stickerAct !== null) {
            stickerAct.Status = Vitro.STATUS.Sealed;
            stickerAct.Update();
        }
    }
    
    // store what you want to submit and reload app in case there is a conflict with a concurrent user  #
    ReloadApp({
        Sticker: {
            StickerActId: actId,
            StickerPageId: pgId,
            StickerStatus: stickerCompleted,
            IsUpdate: false,
            UserColour : Colour
        }
    }); 
}

 //update existing sticker with new image
function UpdateSticker(pg, actId, pgId) {
    var dimensions = CalcWidth(actId, 330, 505);

    // get sticker value and add to page
    var val = {
        Base64: ExportPage(actId, pgId),
        FileType: ".png",
        IsImageFromURI: false,
        IsImageUriPersisting: false,
        RenderedHeight: dimensions.Height,
        RenderedWidth: dimensions.Width
    }; 
    var width = ""+dimensions.Width;
    var height = ""+dimensions.Height;
    if(pg.imgSticker.Value() === null || parseInt(pg.txtStickerId.Value()) === actId){
        pg.imgSticker.Value("");
        pg.imgSticker.Value(val);
    }
    else{
        pg.imgSticker1.Value("");
        pg.imgSticker1.Value(val);
    }
}

// Helper Function to calculate the ratio for the width of the sticker
function CalcWidth(actId, imgCtlHeight, imgCtlWidth){
    var activity = Vitro.Workflow.GetActivity(actId);
    //Get the width of the activity from sticker list
    var actWidth = StickersList[activity.AppName].Width;
    //Get the height of the activity from sticker list
    var actHeight = StickersList[activity.AppName].Height;
    var perc = 0;
    var scaleType = null;
    
    // Calc Ratio for scaling app
    if(actWidth > actHeight){
        // starting point width
        perc = Math.floor((imgCtlHeight / actWidth) * 100);
    }
    else{
        // starting point height
        perc = (imgCtlHeight / actHeight) * 100;
    }
    
    var calcHeight = Math.round((actHeight * perc) / 100);
    var calcWidth = Math.round((actWidth * perc) / 100);
        
    var dimensions = {"Height": calcHeight, "Width": calcWidth};
    return dimensions;
}

// Add a Photo
function AddPhoto() {
    if(popupObj !== null){
        return false;
    }
    // create dynamic buttons
    CreateDynamicPhotoPopup(pgNotes);
    // set up popup
    popupObj.btnOK.Disable();
    // set photo events
    popupObj.fhDrawing.Events.Click(ImageEnteredEvent);
    popupObj.imgPhoto.Events.Change(ImageEnteredEvent);
    // set button events
    popupObj.btnSwitch.Events.Click(SwitchToDrawEvent);
    popupObj.btnCancel.Events.Click(ClearPopupEvent);
    popupObj.btnOK.Events.Click(OkPhotoEvent);
}

function InsertPhoto(imgVal, fhVal, txtVal) {
    // add space for photo
    var photoSpace = "";
    // Create Space for the Photo
    for (var i = 0; i < PHOTO_LINES; i++) { photoSpace += "\n"; }
    
    // add space to page and get index for photo
    var imageIndex = AddSpace(photoSpace, PHOTO_ID);
    // put value into controls
    if(pgNotes.imgSticker.Value() === null && pgNotes.fhDrawing.Value().length === 0){
        // set image position
        PositionImage(pgNotes.fhDrawing, imageParams.FREEHAND, imageIndex);
        PositionImage(pgNotes.imgSticker, imageParams.PHOTO, imageIndex);
        pgNotes.imgSticker.Value(imgVal).Attribute(Vitro.CONTROL.ZIndex, "0", true).Show().ReadOnly(true);
        pgNotes.fhDrawing.Value(fhVal).Attribute(Vitro.CONTROL.ZIndex, "1", true).Show().ReadOnly(true);
    }
    else{
        PositionImage(pgNotes.fhDrawing1, imageParams.FREEHAND, imageIndex);
        PositionImage(pgNotes.imgSticker1, imageParams.PHOTO, imageIndex);
        pgNotes.imgSticker1.Value(imgVal).Attribute(Vitro.CONTROL.ZIndex, "0", true).Show().ReadOnly(true);
        pgNotes.fhDrawing1.Value(fhVal).Attribute(Vitro.CONTROL.ZIndex, "1", true).Show().ReadOnly(true);
    }
  
    // get note
    var photoText = ProcessNote(txtVal, CHARS_PER_LINE);
    // add text to page or Signature
    AddText(photoText, false);

    // store what you want to submit and reload app in case there is a conflict with a concurrent user
    ReloadApp({
        Photo: {
            imgPhoto: imgVal,
            fhDrawing: fhVal,
            txtNote: txtVal,
            UserColour : Colour
        }
    });
}

// position image control based on how many lines are on the page
function PositionImage(ctrl, imageAtt, numLines) {
    if (numLines == 0) {
        numLines++;     
    }
    
    // var pos = "159," + (GetYPos(numLines)-10);
    var pos = IMAGE_XPOS + "," + (GetYPos(numLines) - 25);
    ctrl.Attribute(Vitro.CONTROL.Width, imageAtt.width, true);
    ctrl.Attribute(Vitro.CONTROL.Height, imageAtt.height, true);
    ctrl.Attribute(Vitro.CONTROL.Position, pos, true);
}

// get y position of control
function GetYPos(index) {
    
    return Math.round(IMAGE_YPOS + ((index * NOTE_HEIGHT) / LINES_PER_PAGE));
}

// Sets the note position to center in the FOV
function NotePosition() {
    var pg = pgNotes;
   
    if(popupObj !== null){
    // Get the coords
        var scrollX = pg.Properties.ScrollX();
        var scrollY = pg.Properties.ScrollY();
        var pgZoom = pg.Properties.Zoom();

        // View with and height in form scale
        var viewW = myApp.Properties.ViewWidth() / pgZoom;
        var viewH = myApp.Properties.ViewHeight() / pgZoom;

        // Enforce page limits
        if (viewW > PAGE_WIDTH) {
            viewW = PAGE_WIDTH;
        }
        if (viewH > PAGE_HEIGHT) {
            viewH = PAGE_HEIGHT;
        }

        // Get the dialog size
        var popupH = popupObj.panPopup.Attribute(Vitro.CONTROL.Height);
        var popupW = popupObj.panPopup.Attribute(Vitro.CONTROL.Width);

        // If the panel width or height is greater than the viewable area then no adjustment.
        if (popupW > viewW || popupH > viewH) {
            return;
        }

        // Calc the position to center
        var px = Math.round(scrollX / pgZoom + (viewW - popupW) / 2.0);
        var py = Math.round(scrollY / pgZoom + (viewH - popupH) / 2.0);

        // Stringify and set
        var pos = px + "," + py;
        popupObj.panPopup.Attribute(Vitro.CONTROL.Position, pos, false);
    }
}

// The heart of App determines the event to be fired
function ClickNoteEvent(pg, ctl, x, y) {

    if(popupObj !== null){
        return false;
    }
    
    // get the current line number for adding/remove strikes
    // var theline = Math.floor(y * (LINES_PER_PAGE / NOTE_HEIGHT)) + 1;
    var theline = Math.floor(y / REPEATER_SPACING) + 1;
    var index = theline - 1;
    // If last line avoid click for adding note #59622
    if (index >= LINES_PER_PAGE) {
        return false;
    }
    // get username of person who added the note (remove sticker marker)
    var UserName = pg.lblUser[index].Attribute(Vitro.LABEL.Content).replace(IMAGE_ID, "");
    var Photo = pg.lblUser[index].Attribute(Vitro.LABEL.Content).replace(PHOTO_ID, "");
    var Sig = pg.lblUser[index].Attribute(Vitro.LABEL.Content).replace(CURRENT_USER+" ", "");
    
    if(index > 2){
        var StrikeSticker = false;
        if(pg.lblUser[index-2].Attribute(Vitro.LABEL.Content).indexOf(IMAGE_ID) !== -1){
            StrikeSticker = true;
        }
    }
    
    if(Sig === SIG){
        Sticker_Strike = true; 
    }
    else{
        Sticker_Strike = false; 
    }
    
    if(Sig === NOTE_COMPLETED){
        return false;
    }
    else{
        // The user is allowed to mark it (they are the originating user)
        // if it is a sticker/ photo, check it's status and find all matching rows in section
        if ((pg.lblUser[index].Attribute(Vitro.LABEL.Content).indexOf(IMAGE_ID) !== -1 || StrikeSticker) && (pg.lblUser[index].Attribute(Vitro.LABEL.Content).split("_")[0] == Vitro.Users().Property(Vitro.USER.Name) || isSuperUser)) {
            
            // check if the id is stored for opening
            if (pg.txtStickerId.Value() != "" || pg.txtStickerId1.Value() != "") {
                StickerSticker_Index = index;
                var theid = pg.Properties.ID() + "~" + index;
                // if it has a strike through and it is on the list, un-strike it
                if (pg.lblStrike[index].Properties.IsVisible()) {
                    if (!strikeList[theid]) {
                        pg.txtStickerId.Value("");
                        pg.txtStickerId1.Value("");
                    } 
                    else {
                        StickerStrike(pg, index);
                    }
                }
                // otherwise show popup for either striking or opening app
                else {
                    // create dynamic popup
                    CreateDynamicStickerPopup(pg, false);
                    // set events
                    popupObj.btnOpen.Events.Click(OpenStickerClickEvent);
                    popupObj.btnStrike.Events.Click(StrikeStickerClickEvent);
                    popupObj.btnCancel.Events.Click(ClearPopupEvent);
                }
            }
            // if not opening an app, strike through
            else {
                StickerStrike(pg, index);
            }
        }
        else if(UserName == Vitro.Users().Property(Vitro.USER.Name) || Photo === CURRENT_USER || isSuperUser && pg.lblUser[index].Attribute(Vitro.LABEL.Content) !== "") {
            if(pg.lblUser[index].Attribute(Vitro.LABEL.Content).indexOf(PHOTO_ID) !== -1){
                // Strike all for photo
                StrikePhotoAll(pg, index);
            }
            // if it is a normal note, add or remove strike from current location
            else {
                SetStrike(pg, index);
            }
        }
        else if ((UserName.indexOf("CoSign") != -1 || UserName.indexOf("Sig") != -1) && pg.lblUser[index].Attribute(Vitro.LABEL.Content) !== ""
        && (UserName == Vitro.Users().Property(Vitro.USER.Name) || UserName.split(" ")[0] == Vitro.Users().Property(Vitro.USER.Name))) {
            SetStrike(pg, index);
        } 
        // Only add a note on the front page, where it is clear
        else if (strikeCount === 0 && isNewest){
            AddNote();
        }
    }
}

function ClearUnstrikePopUp(pg, ctrl, xlocation, ylocation) {
    // make sure all unsubmitted strikes are accounted for
    if(strikeCount !== 0){
        DestroyPopup();
        DisableActions();
        RemoveStrikeButton(pg);

        RemoveCoSignButton(pg);

        // only show submit and close
        myApp.Show(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Close);
    }
    else{
        EnableActions();
    }
}

function StrikePhotoAll(pg, index) {
    var index_Start = 0;
    var index_End = 0;

    // Determine what to do with action buttons
    if(pg.lblStrike[index].Properties.IsVisible()){
        photo_strike = false;
    }
    
    for(var i = index; i < LINES_PER_PAGE; i++){
        if(pg.lblUser[i].Attribute(Vitro.LABEL.Content).indexOf(PHOTO_ID) === -1){
            index_End = i;
            Final_Index = index_End + 2;
            break;
        }
    }

    var MyStrikeButton = null;
    for(var j = 0; j < strikeButtons.length; j++){
        if(strikeButtons[j].Index === Final_Index && pg.Properties.ID() == strikeButtons[j].pg.Properties.ID()){
            MyStrikeButton = strikeButtons[j].strikeButton;
        }
    }
    
    if(MyStrikeButton !== null) {
        if(Finished){
            if(MyStrikeButton.Attribute(Vitro.LABEL.Content) == ""){
                MyStrikeButton.Attribute(Vitro.LABEL.Content, "STK");
                MyStrikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
                pg.lblStrikeName[Final_Index].Value("");
                StrikeButton = false;
            }
            else{
                MyStrikeButton.Attribute(Vitro.LABEL.Content, "");
                MyStrikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT);
                MyStrikeButton.Attribute(Vitro.CONTROL.Border, "False");
                StrikeButton = true;
            }
            
            if(pg.lblStrikeName[Final_Index].Value() != ""){
                StrikeButton = false;
            }
            
            SetButtonStrike(pg, Final_Index, CURRENT_USER, StrikeButton);
        }
    }

    
    var SigName = pg.lblUser[Final_Index].Attribute(Vitro.LABEL.Content).replace(" Sig", "");
    var Sig = pg.lblUser[Final_Index].Attribute(Vitro.LABEL.Content).replace(SigName+" ", "");
    if(Sig == "Sig"){
        Final_Index += 2;
    }
    
    for(var k = index_End - 2; k >= 0; k--){
        if(pg.lblUser[k].Attribute(Vitro.LABEL.Content) == "" || k === 0){
            if(k === 0){
                index_Start = k;
                break;
            }
            else{
                index_Start = k+1;
                break;
            }
        }
    }

    for(var x = index_Start; x < Final_Index; x++){
        if(x !== Final_Index){
            Sticker_Strike = true;
        }
        else{
            Sticker_Strike = false;
        }
        // SetStrike(pg, x);
    }
    
    Sticker_Strike = false;

    if(photo_strike){
        DisableActions();
        // only show submit and close
        myApp.Show(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Close);

    }
    else if(strikeCount === 0){
        myApp.Hide(Vitro.ACTIONS.Submit);
        EnableActions();
    }
}

//Strikes all of note and loops through pages if needed
function StrikeNoteAll(pg, start_index) {
    
    if(strikeCount === 0) {
        myApp.Hide(Vitro.ACTIONS.Submit);
    }
    var index = 0;
    //Strike the signature line
    if(!Mark) {
        index = start_index + 1;
    }
    else {
        index = start_index;
    }
    //wipe the co-sign button when submitting
    Final_Index = index;
    // Is the start line found
    var Found = false;
    // reverse back through the lines adding strike or removing them
    Finished = false;
    for(var i = index; i > -1; i--) {
        
       endOfGroup = false;
       var sigName = pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content);
       var n = sigName.split(" ");   
       var prevn = "";    
       var prevSigName = "";

       if (i < index) {
            prevSigName = pg.Control("lblUser[" + (i+1) + "]").Attribute(Vitro.LABEL.Content);      
            prevn = prevSigName.split(" ");       
       }      

        if ((pg.Control("txtStkIndex[" + i + "]").Value() != "") && i < index) {
            endOfGroup = true;
        } else if (prevSigName && n[0] !== prevn[0] && n[0].indexOf(IMAGE_ID) == -1 && n[0].indexOf(PHOTO_ID) == -1) {
            endOfGroup = true;
        }

        // Check if strike will happen to next page then look for the signature of the last entry so we will stop the strike     
        if (strikedFrom1stPage) {
            
            if (pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content).indexOf("Sig") !== -1 || strikedPage.Control("lblUser[0]").Attribute(Vitro.LABEL.Content) !== pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content) && strikedPage.Control("lblUser[0]").Attribute(Vitro.LABEL.Content).indexOf(pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content)) || i == 53 && pg.Control("txtStkIndex[52]").Value() || i == 53 && !pg.Control("lblUser[" + i + "]").Value()) {
                
                endOfGroup = true;
                Finished = true;
                break;             

            }
        }

        if((pg.Properties.IsVisible() && pg.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content) !== "" && endOfGroup == false) || i === index) {
            if(Mark){
                if(i === Final_Index) {
                    Last = true;
                    Mark = false;
                }
                else {
                    Last = false;
                }
            }
            SetStrikeAll(pg, i, endOfGroup);
        }
        else {
            Found = true;
            Mark = false;
            Finished = true;
            if(!Unstrike) {
                myApp.Show(Vitro.ACTIONS.Submit);
                myApp.Enable(Vitro.ACTIONS.Submit);
                myApp.Enable(Vitro.ACTIONS.Close);
            }
            else {
                if(strikeCount === 0) {
                    myApp.Hide(Vitro.ACTIONS.Submit);
                    Unstrike = false;
                    EnableActions();
                }
            }
            return false;
        }
        
        if(i === 0 && PageIDs[PageIDs.length-1].pageId == pg.Properties.ID()) {
            Found = true;
            Mark = false;
            Finished = true;
            if(!Unstrike) {
                myApp.Show(Vitro.ACTIONS.Submit);
                myApp.Enable(Vitro.ACTIONS.Submit);
                myApp.Enable(Vitro.ACTIONS.Close);
            }
            else {
                if(strikeCount === 0) {
                    myApp.Hide(Vitro.ACTIONS.Submit);
                    Unstrike = false;
                    EnableActions();
                }
            }
            return false;
        }
        else {
            Mark = false;
            Found = false;
        }
    }
    
    if(!Found && pg.Control("lblUser[" + 0 + "]").Attribute(Vitro.LABEL.Content).match(/_Sticker/g) === null && pg.Control("lblUser[" + 0 + "]").Attribute(Vitro.LABEL.Content).match(/_Photo/g) === null) {
        var new_Index = LINES_PER_PAGE - 2;
        for(var x = 0; x < PageIDs.length; x++) {
            //Find the current page

            if(pg.Properties.ID() == PageIDs[x].pageId && pg.Properties.ID() !== PageIDs[PageIDs.length - 1].pageId) {
                var nextPage = myApp.Page(PageIDs[x + 1].pageId);
                strikedFrom1stPage = true;  
                strikedPage = pg;
                StrikeNoteAll(nextPage, new_Index);
                break;
            }
        }
    }
    else {
        if(!Unstrike || strikeCount != 0) {
            myApp.Show(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Close);
            Finished = true;
        }
        else {
            Unstrike = false;
            EnableActions();
            Finished = true;
        }
    }
    strikedFrom1stPage = false;
}

// Find the Indexes for the Sticker
function StickerStrike(pg, index) {
    // var MyStrikeButton = {};
    if(pg.lblUser[index].Attribute(Vitro.LABEL.Content).match(/_Photo/g) !== null){
        StrikePhotoAll(pg, index);
        return false;
    }
    
    var sticker_strike_action = true; 
    if(pg.lblStrike[index].Properties.IsVisible()) {
        sticker_strike_action = false;
    }
        
    var index_Start = 0;
    var index_End = 0;
    
    for(var i = index; i < LINES_PER_PAGE; i++){
        var SigName = pg.lblUser[i].Attribute(Vitro.LABEL.Content).replace(" Sig", "");
        var Sig = pg.lblUser[i].Attribute(Vitro.LABEL.Content).replace(SigName+" ", "");
        if(Sig === "Sig"){
            index_End = i+1;
            Final_Index = index_End;
            break;
        }
    }
    
    var MyStrikeButton = null;
    for(var j=0; j<strikeButtons.length; j++){
        if(strikeButtons[j].Index+1 === Final_Index && pg.Properties.ID() == strikeButtons[j].pg.Properties.ID()){
            MyStrikeButton = strikeButtons[j].strikeButton;
        }
    }
       
    if(MyStrikeButton !== null) {
        if(Finished){
            if(MyStrikeButton.Attribute(Vitro.LABEL.Content) == ""){
                MyStrikeButton.Attribute(Vitro.LABEL.Content, "STK");
                MyStrikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
                pg.lblStrikeName[Final_Index - 1].Value("");
                StrikeButton = false;
            }
            else{
                MyStrikeButton.Attribute(Vitro.LABEL.Content, "");
                MyStrikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT);
                MyStrikeButton.Attribute(Vitro.CONTROL.Border, "False");
                StrikeButton = true;
            }
            
            if(pg.lblStrikeName[Final_Index - 1].Value() != ""){
                StrikeButton = false;
            }
            
            SetButtonStrike(pg, Final_Index - 1, CURRENT_USER, StrikeButton);
        }
    }

    for(var x = index; x >= 0; x--){
        if(pg.lblUser[x].Attribute(Vitro.LABEL.Content) === ""){
            index_Start = x;
            break;
        }
    }
    
    if(Final_Index === -1){
        return false;
    }
    
    if(index < (LINES_PER_PAGE / 2)){
        // find all lines that the sticker runs through
        if(index_Start !== 0){
            index_Start = index_Start + 1;
        }
    
        for (var y = index_Start; y <Final_Index; y++) {
            if(y !== Final_Index-1){
                Sticker_Strike = true;
            }
            else{
                Sticker_Strike = false;
            }
            
        }
    }
    else{
        //find all lines that the sticker runs through
        for (var n = Final_Index; n >= index_Start+1; n--) {
            if(n !== Final_Index){
                Sticker_Strike = true;
            }
            else{
                Sticker_Strike = false;
            }
            
        }
    }
    Sticker_Strike = false;
    
    if(sticker_strike_action){
        DisableActions();
        // only show submit and close
        myApp.Show(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Submit);
        myApp.Enable(Vitro.ACTIONS.Close);
    }
    else{
        if(strikeCount === 0){
            myApp.Hide(Vitro.ACTIONS.Submit);
            EnableActions();
        }
    }
}

// add or remove stirkes
function SetStrike(pg, index) {
    // Make a key
    var strikeId = pg.Properties.ID() + "~" + index;
    // if the label is visible and the it is on the strike list, we are toggling off
    // note we reference the controls in this way for unregistered partially loaded pages in the activity
    if (pg.Control("lblStrike[" + index + "]").Properties.IsVisible() && strikeList[strikeId]) {
        // Hide, clear content and default the border colour        
        pg.Control("lblStrike[" + index + "]").Hide().Value("");
        if(pg.Control("lblUser[" + index + "]").Attribute(Vitro.LABEL.Content).replace(CURRENT_USER + " ", "") !== SIG){
            pg.Control("lblStrikeName[" + index + "]").Hide().Value("");
        }
        
        // Remove it from the list 
        delete strikeList[strikeId];
        strikeCount--;
        // if no strikes left, reset events
        if (strikeCount === 0) {
            if(Final_Index > 0){
                pg.Control("lblStrikeName[" + (Final_Index-1) + "]").Hide().Value("");
            }
            EnableActions();
            myApp.Hide(Vitro.ACTIONS.Submit);
        }
    }
    // if the label is hidden, we are toggling on
    else if (!pg.Control("lblStrike[" + index + "]").Properties.IsVisible()) {
        // get user intials and date to sign strike with
        var today = new Date();
        var init = Vitro.Users().Property(Vitro.USER.FirstName).charAt(0) + Vitro.Users().Property(Vitro.USER.LastName).charAt(0) +
            " " + (today.getDate() < 10 ? "0" : "") + today.getDate()+ "/" + ((today.getMonth() + 1) < 10 ? "0" : "") + (today.getMonth() + 1);
        // Show, set the content and clear border colour
        pg.Control("lblStrike[" + index + "]").Value(STRIKE_TXT).Show();
        if(!Sticker_Strike){
            pg.Control("lblStrikeName[" + index + "]").Value(init).Show();
        }
        // store strike in case of reload
        strikeList[strikeId] = true;
        strikeCount++;
        
        // if this is the first strike, set submit event
        if (strikeCount > 0) {
            // Disable actions
            DisableActions();
            // only show submit and close
            myApp.Show(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Close);
            // set submit event only once
            if (tempEvents.evSubmit === null) {
                tempEvents.evSubmit = myApp.Events.Actions(function(action) {
                    if (action == Vitro.ACTIONS.Submit) {
                        // store what you want to submit and reload app in case there is a conflict with a concurrent user
                        if(Final_Index > 1){
                            pg.Control("lblUser[" + Final_Index - 1 + "]").Attribute(Vitro.LABEL.Content, NOTE_COMPLETED, true);
                        }
                        Final_Index = -1;
                        ReloadApp({
                            Strike: strikeList
                        });
                        DONT_CLOSE = true;
                        return false;
                    }
                });
            }
        }
    }
}

// add or remove stirkes
function SetStrikeAll(pg, index, endOfGroup) {
    // Make a key
    var strikeId = pg.Properties.ID() + "~" + index;
    // if the label is visible and the it is on the strike list, we are toggling off
    if (!StrikeAll && strikeList[strikeId] && (pg.Control("lblStrikeName[" + index + "]").Value() == "")){
        // Hide, clear content and default the border colour
        pg.Control("lblStrike[" + index + "]").Hide().Value("");
        pg.Control("lblStrikeName[" + index+ "]").Hide().Value("");
        // Remove it from the list
        delete strikeList[strikeId];
        strikeCount--;
        // if no strikes left, reset events
        if (strikeCount === 0 && Object.keys(strikeList).length === 0) {
            var Page = myApp.PageManager.GetActive();
            RestoreDefaults(Page);
            myApp.Hide(Vitro.ACTIONS.Submit);
        }
    }
    // if the label is hidden, we are toggling on
    else if(StrikeAll){       
        // get user intials and date to sign strike with
        var today = new Date();
        var init = Vitro.Users().Property(Vitro.USER.FirstName).charAt(0) + Vitro.Users().Property(Vitro.USER.LastName).charAt(0) +
            " " + (today.getDate() < 10 ? "0" : "") + today.getDate()+ "/" + ((today.getMonth() + 1) < 10 ? "0" : "") + (today.getMonth() + 1);
        // Show, set the content and clear border colour
        if (!endOfGroup) {
            if(!pg.Control("lblStrike[" + index + "]").Properties.IsVisible()){
                // store strike in case of reload
                strikeList[strikeId] = true;
                strikeCount++;        
                pg.Control("lblStrike[" + index + "]").Value(STRIKE_TXT).Show();    
            }            
        }

        if(Last){
            Last = false;
            pg.Control("lblStrikeName[" + index + "]").Value(init).Show();
        }

        // if this is the first strike, set submit event
        if (StrikeNoteAllSubmit) {
            StrikeNoteAllSubmit = false;
            // Disable actions
            DisableActions();
            // only show submit and close
            myApp.Show(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Submit);
            myApp.Enable(Vitro.ACTIONS.Close);
            // set submit event only once
            
            if(tempEvents.evSubmit !== null){
                tempEvents.evSubmit.Remove();
                tempEvents.evSubmit = null;
            }
            
            if (tempEvents.evSubmit === null) {
                tempEvents.evSubmit = myApp.Events.Actions(function(action) {
                    if (action == Vitro.ACTIONS.Submit) {
                        // store what you want to submit and reload app in case there is a conflict with a concurrent user
                        for(var i = 0; i < Button_indexes.length; i++){
                            Button_indexes[i].page.Control("lblUser[" + Button_indexes[i].Index + "]").Attribute(Vitro.LABEL.Content, NOTE_COMPLETED, true);
                        } 
                        Final_Index = -1;
                        ReloadApp({
                            Strike: strikeList
                        });
                        
                        DONT_CLOSE = true;
                        return false;
                    }
                });
            }
        }
    }
}

// Method to add a note
function AddNote() {
    
    if(popupObj !== null){
        return false;
    }
    
    // create dynamic popup
    CreateDynamicNotePopup(pgNotes);
    // set events
    popupObj.btnCancel.Events.Click(ClearPopupEvent);
    popupObj.btnOK.Events.Click(NotePopupOkEvent);
    // set focus for user to begin typing
    setTimeout(function() {
        if(XaimText){
            popupObj.txtNote.Value(ObsValue);
            popupObj.btnOK.Enable();
        }
        popupObj.txtNote.Focus();
    }, 100);
}

// Method to insert a note into the page(s)
function InsertNote(pg, noteText) {
    // if note is from hand over
    if (popupObj.txtHandOver !== undefined) {
        var patientId = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));
        // Update the “Current Patient Table” Col6 with the comments entered into the dialog (Note: Remove ****HANDOVER*** from update text)
        // Craig Change
        // Issue was we were selecting a currentpatient object using patientid 
        // We can only select ALL currentpatients with the patient
        var currPatient = Vitro.Workflow.GetCurrentPatients(patientId);
        if(currPatient.length != null){
            currPatient[0].Col6 = noteText;
            currPatient[0].Update();
            noteText = "****HANDOVER**** " + noteText;
        }
    }
    // Nothing in the note? 
    if(noteText == ""){ 
        return; 
    }

    // get note
    var newNote = ProcessNote(noteText, CHARS_PER_LINE);
    // add text to page
    AddText(newNote, true);


    // store what you want to submit and reload app in case there is a conflict with a concurrent user
    ReloadApp({
        Note: noteText,
        UserColour : Colour
    });
}

// get signature and and add space if student for extra signature
function GetSignature(flag, username) {
    
    var text = "";
    // get the signature (right aligned)
    var sig = "[" + GetUserDetails(username).Normal + "]";
    // Add padding for a weird alignment issue.
    if (sig.length === CHARS_PER_LINE + 5) {
        sig = "[" + sig + "]";
    }
    // add signature

    text += "\r";
    if(!flag){
        for (var j = 0; j < CHARS_PER_LINE - (sig.length); j++) {
            text += " ";
        }
        text += sig;
        
        var isStudentEntry = Vitro.Users().InGroup("Student Nurse") || Vitro.Users().InGroup("Enrolled Nurse");                 
        if (isStudentEntry === true) {
            text += "\n";
        }
        
    }
    else{
        
        text = GetDateTimeStrings().date+" "+GetDateTimeStrings().time;
        var totalLength = sig.length + text.length;
        for (var i = 0; i < CHARS_PER_LINE - (totalLength); i++) {
            text += " ";
        }       
        
        text += sig;
    }
    // add extra line if note is by student
    return text;
}

// add a space to the page for putting an image over
function AddSpace(spaceText, id) {
    var dateString = GetDateTimeStrings();
    // Get the current data in the page and count the number of lines
    var note = pgNotes.txtNotes.Value();
    var oldLines = CountLines(note, CHARS_PER_LINE);
    // Add space to note
    if (oldLines >= 27 && (id == PHOTO_ID || id == IMAGE_ID)) {
        note += "\n";
    }
    note += spaceText;
    // Count the number of lines now
    var newLines = CountLines(note, CHARS_PER_LINE);
    var isCloned = false;
    // if a new page is needed
    if ((newLines + 3) > LINES_PER_PAGE) {
        // make a new note page
        var pgNotesCloned = CloneNotePage(false);
        isCloned = true;                            
        //pgNotesCloned.Title(SetTitle());
        pgNotesCloned.Title(pgNotes.Title());

        // copy notes to cloned page and clear first page
        pgNotesCloned.txtNotes.Value(pgNotes.txtNotes.Value());
        pgNotes.txtNotes.Value("");
        // reset line info
        oldLines = 0;
        note = spaceText;
        newLines = CountLines(note, CHARS_PER_LINE);
    }
    // add space to page
    pgNotes.txtNotes.Value(note);
    
    var userName = Vitro.Users().Property(Vitro.USER.Name);
    if(id == PHOTO_ID){
        // add image tag to username so strike happens to whole photo
        userName += PHOTO_ID;
    }
    else{
        userName += IMAGE_ID;
    }
    
    // Set the user 
    for (var i = oldLines; i < newLines + 1; i++) {
        pgNotes.lblUser[i].Attribute(Vitro.LABEL.Content, userName, true);
        pgNotes.txtDate[i].Attribute(Vitro.CONTROL.BackgroundColour, USER_COLOURS[Colour], true);
    }
    
    pgNotes.txtDate[oldLines].Value(SetTitle()).Show();
    pgNotes.txtDate[oldLines + 1].Value(dateString.time).Show();
    
    if(isCloned){
        pgNotes.Title(SetTitle());
    }
    
    // return start index for placing image
    return oldLines;
}

// add text to page and create overflows if needed
function AddText(newNote, showDate) {
    var i;
    var dateString = GetDateTimeStrings();
    var cloned = false;
    var dated = false;
    var continued = false;
    // get user name for strikes
    var userName = Vitro.Users().Property(Vitro.USER.Name);
    // Get the current data in the page and count the number of lines
    var note = pgNotes.txtNotes.Value();
    var oldLines = CountLines(note, CHARS_PER_LINE);
    // Ensure a min of two lines per entry
    // So if we are one line from the end of the page - insert a new line
    if (oldLines === (LINES_PER_PAGE)) {
        note += "\r";
        oldLines++;
    }
    // If there is already content - start a new line.
    if (note != "") { note += "\r"; }
    // Add new note
    note += newNote;

    // Count the number of lines now
    var newLines = CountLines(note, CHARS_PER_LINE);
    
    // While the number of lines is more than a page full....
    if(newLines === LINES_PER_PAGE){
        note += "\n";
    }
    
    note += GetSignature(false);
    
    newLines = CountLines(note, CHARS_PER_LINE);

    while (newLines > LINES_PER_PAGE) {
        // Making sure to check if last 2 lines of note is end of entry
        if (pgNotes.Control("lblUser[53]").Attribute(Vitro.LABEL.Content).indexOf("Sig") !== -1 || pgNotes.Control("lblUser[52]").Attribute(Vitro.LABEL.Content).indexOf("Sig") !== -1) {
            continued = false;
        } else {
            continued = true;
        }
        
        // Clone the notes page
        var pgNotesCloned = CloneNotePage(cloned);
    
        // Set the notes on the cloned page with the front page + the addition - or the remaining portion fits at least
        pgNotesCloned.Control("txtNotes").Value(GetLines(note, CHARS_PER_LINE, 0, LINES_PER_PAGE));
        
        // On the first page being cloned, copy the existing values from the front page
        if (cloned === false) {
            // Set the additional lines from the cloned page with the user 
            for (i = oldLines; i < LINES_PER_PAGE; i++) {
                pgNotesCloned.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content, userName, true);
                pgNotesCloned.Control("txtDate[" + i + "]").Attribute(Vitro.CONTROL.BackgroundColour, USER_COLOURS[Colour], true);
                pgNotesCloned.Control("txtDate[" + i + "]").Show();
            }
            // if not at the end of a page before the note was added, add the date
            if (oldLines < LINES_PER_PAGE && showDate && !dated) {
                // Then set/show the date and time on the cloned page
                pgNotesCloned.Control("txtDate[" + oldLines + "]").Value(SetTitle()).Show();
                pgNotesCloned.Control("txtDate[" + (oldLines + 1) + "]").Value(dateString.time).Show();
                dated = true;
            }
            pgNotesCloned.Title(pgNotes.Title());
            oldLines = 0;
        }
        // if this is a second clone for the same note  
        else {
            // Set the user on this current cloned page
            for (i = 0; i < LINES_PER_PAGE; i++) {
                pgNotesCloned.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content, userName, true);
                pgNotesCloned.Control("txtDate[" + i + "]").Attribute(Vitro.CONTROL.BackgroundColour, USER_COLOURS[Colour], true);
                pgNotesCloned.Control("txtDate[" + i + "]").Show();
            }
            
            pgNotesCloned.Control("txtDate[" + oldLines + "]").Value(SetTitle()).Show();
            pgNotesCloned.Control("txtDate[" + (oldLines + 1) + "]").Value(dateString.time).Show();
            pgNotesCloned.Control("txtDate[" + (oldLines + 2) + "]").Value("Continued").Show();
            pgNotesCloned.Title(SetTitle());
        }
        // Reduce the number of lines by the number of lines in the page
        newLines -= LINES_PER_PAGE;
        // Get the remaining text to allocate to a page.
        note = GetLines(note, CHARS_PER_LINE, LINES_PER_PAGE + 1, 0);
        // Set a flag to indicate that we were cloned at least once
        cloned = true;
    }
    // There are lines remaining
    if (newLines) {
        // Set the notes
        pgNotes.txtNotes.Value(note + "\n");
        // Set/show the date and time on the front page
        if (showDate || cloned){
            pgNotes.txtDate[oldLines].Value(SetTitle()).Show();
            pgNotes.txtDate[oldLines + 1].Value(dateString.time).Show();
            if(continued){
                pgNotes.txtDate[oldLines + 2].Value("Continued").Show();
                pgNotes.Title(SetTitle());
            }
        }
        // Set the user k
        for (i = oldLines; i < newLines; i++) {
            pgNotes.lblUser[i].Attribute(Vitro.LABEL.Content, userName, true);
            pgNotes.txtDate[i].Attribute(Vitro.CONTROL.BackgroundColour, USER_COLOURS[Colour], true);
            pgNotes.txtDate[i].Show();
        }

        pgNotes.lblUser[newLines - 1].Attribute(Vitro.LABEL.Content, userName + " Sig", true);
        if (pgNotes.lblUser[newLines - 3] === undefined) {
            if (pgNotes.lblUser[newLines - 2] === undefined) {
                pgNotes.lblUser[newLines - 1].Attribute(Vitro.LABEL.Content, userName + " CoSign", true);    
            } else {
                pgNotes.lblUser[newLines - 2].Attribute(Vitro.LABEL.Content, userName + " CoSign", true);
            }
            
        }
        else {
            pgNotes.lblUser[newLines - 3].Attribute(Vitro.LABEL.Content, userName + " CoSign", true);
        }
        
    }
}

// Process each characters in note
function ProcessNote(text, lettersPerLine) {
    var note = "";
    var sections = text.split(" ");
    var i, j;
    var counter = 0;
    var blocks;

    // If the text is empty
    if (text == "") {
        return note;
    }
    // For each section that is separated by a space
    for (i = 0; i < sections.length; i++) {
        // Was split on a double space - just add a space
        if (sections[i].length === 0) {
            // At end of the line - convert the space to a CR
            if (counter == lettersPerLine) {
                note += "\r";
                counter = 0;
            } 
            else {
                note += " ";
                counter++;
            }
            continue;
        }

        // Split the CRs - if any
        blocks = sections[i].split("\r");

        if (blocks.length === 0) {
            blocks = sections[i].split("");
        }

        // For each block that is separated by a CR
        for (j = 0; j < blocks.length; j++) {
            // Split on a double CR - just add a CR
            if (blocks[j].length === 0 && j + 1 != blocks.length) {
                note += "\r";
                counter = 0;
                continue;
            }
            // We need to split anyway, because the number of characters in the word is too long.
            else if (blocks[j].length > lettersPerLine) {
                var remaining = blocks[j];
                // While the remaaining text is too long for the line
                while (remaining.length > lettersPerLine) {
                    // Just add to the space available
                    note += remaining.substr(0, lettersPerLine - counter) + "\r";
                    // Our remainder is shortened
                    remaining = remaining.substr(lettersPerLine - counter);
                    // Character counter is reset
                    counter = 0;
                }
                // Any remainder is added and counter value updated
                note += remaining;
                counter = remaining.length;
            }
            // If the word goes over the remaining line
            else if (counter + blocks[j].length > lettersPerLine) {
                // Go to a new line an insert the word
                note += "\r" + blocks[j];
                // Set the counter equal to the word length
                counter = blocks[j].length;
            }
            // Otherwise
            else {
                // Just add the word block to the note and increment the char counter
                note += blocks[j];
                counter += blocks[j].length;
            }

            // If we have more blocks to go, we need to append a CR on each block
            if (j + 1 != blocks.length) {
                note += "\r";
                counter = 0;
            }
        }

        // If we have more sections to go, we need to append a space on each section
        if (i + 1 != sections.length) {
            // At the end of a line - cover to a CR
            if (counter == lettersPerLine) {
                note += "\r";
                counter = 0;
            } 
            else {
                note += " ";
                counter++;
            }
        }
    }
    // Return the note
    return note;
}

// makes a new note page, copiess values from the first page on to it
// returns cloned page
function CloneNotePage(firstCloned) {
    // Clone the notes page
    var pgNotesCloned = myApp.PageManager.Clone(pgClone);    

    if (pgNotesCloned) {
        Vitro.Elements.SetAddressograph(myApp, pgNotesCloned);
        pgNotesCloned.Show(true).PrintVisibility(true).ChartVisibility(true);
        // Set viewable zoom size
        Pages_Added(pgNotesCloned);
        // as first page is used as latest page ensure patient label is up-to-date     
        // copy header      
        // Vitro.Elements.SetPatientLabel(myApp, pgNotes);             
        pgNotesCloned.Deletable(false).Show(true).Order(3);             
        pgNotesCloned.ChartVisibility(true);
        // if this is the first page being cloned
        // copy the existing values from the front page
        if (firstCloned === false) {
            // For each line
            for (var i = 0; i < LINES_PER_PAGE; i++) {
                // copy dates and clear original
                pgNotesCloned.Control("txtDate[" + i + "]").Value(pgNotes.txtDate[i].Value());
                pgNotesCloned.Control("txtDate[" + i + "]").Attribute(Vitro.CONTROL.BackgroundColour, pgNotes.txtDate[i].Attribute(Vitro.CONTROL.BackgroundColour), true);
                pgNotes.txtDate[i].Value("");
                pgNotes.txtDate[i].Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE, true);
                // Copy user details and clear original
                
                pgNotesCloned.Control("lblUser[" + i + "]").Attribute(Vitro.LABEL.Content, pgNotes.lblUser[i].Attribute(Vitro.LABEL.Content), true);
                pgNotes.lblUser[i].Attribute(Vitro.LABEL.Content, "", true);
                // copy strikes and clear original
                if (pgNotes.lblStrike[i].Value() != "") {
                    pgNotesCloned.Control("lblStrike[" + i + "]").Value(pgNotes.lblStrike[i].Value()).Show();
                    pgNotesCloned.Control("lblStrike[" + i + "]").Attribute(Vitro.LABEL.TextColour, pgNotes.lblStrike[i].Attribute(Vitro.LABEL.TextColour), true);
                    pgNotes.lblStrike[i].Value("").Hide();
                }
                
                if (pgNotes.lblStrikeName[i].Value() != "") {
                    pgNotesCloned.Control("lblStrikeName[" + i + "]").Value(pgNotes.lblStrikeName[i].Value()).Show();
                    pgNotes.lblStrikeName[i].Value("").Hide();
                }
                
                // copy co-sign and clear original
                if (pgNotes.lblCoSign[i].Value() != "") {
                    pgNotesCloned.Control("lblCoSign[" + i + "]").Value(pgNotes.lblCoSign[i].Value()).Show();
                    pgNotes.lblCoSign[i].Value("").Hide();
                }

                if (pgNotes.Control("txtStkIndex[" + i + "]").Value() != "") {
                    pgNotesCloned.Control("txtStkIndex[" + i + "]").Value(pgNotes.Control("txtStkIndex[" + i + "]").Value()).Show();
                    pgNotes.Control("txtStkIndex[" + i + "]").Value("").Hide();
                }
            }
        }

        // copy sticker
        if (pgNotes.imgSticker.Value() != "") {
            pgNotesCloned.Control("imgSticker").Value(pgNotes.imgSticker.Value());
            // copy position
            pgNotesCloned.Control("imgSticker").Attribute(Vitro.CONTROL.Position, pgNotes.imgSticker.Attribute(Vitro.CONTROL.Position), true).Show();
            pgNotesCloned.Control("imgSticker").Attribute(Vitro.CONTROL.ZIndex, pgNotes.imgSticker.Attribute(Vitro.CONTROL.ZIndex), true).ReadOnly(true);
            // copy width and height
            pgNotesCloned.Control("imgSticker").Attribute(Vitro.CONTROL.Height, pgNotes.imgSticker.Attribute(Vitro.CONTROL.Height), true);
            // copy height
            pgNotesCloned.Control("imgSticker").Attribute(Vitro.CONTROL.Width, pgNotes.imgSticker.Attribute(Vitro.CONTROL.Width), true);
            // clear original
            pgNotes.imgSticker.Value("").Attribute(Vitro.CONTROL.ZIndex, "0", true).Hide();
        }
        
        // copy sticker
        if (pgNotes.imgSticker1.Value() != "") {
            pgNotesCloned.Control("imgSticker1").Value(pgNotes.imgSticker1.Value());
            // copy position
            pgNotesCloned.Control("imgSticker1").Attribute(Vitro.CONTROL.Position, pgNotes.imgSticker1.Attribute(Vitro.CONTROL.Position), true).Show();
            pgNotesCloned.Control("imgSticker1").Attribute(Vitro.CONTROL.ZIndex, pgNotes.imgSticker1.Attribute(Vitro.CONTROL.ZIndex), true).ReadOnly(true);
            // copy width
            pgNotesCloned.Control("imgSticker1").Attribute(Vitro.CONTROL.Width, pgNotes.imgSticker1.Attribute(Vitro.CONTROL.Width), true);
            // copy height
            pgNotesCloned.Control("imgSticker1").Attribute(Vitro.CONTROL.Height, pgNotes.imgSticker1.Attribute(Vitro.CONTROL.Height), true);
            // clear original
            pgNotes.imgSticker1.Value("").Attribute(Vitro.CONTROL.ZIndex, "0", true).Hide();
        }
        
        // copy sticker id and clear original
        if (pgNotes.txtStickerId.Value() != "") {
            pgNotesCloned.Control("txtStickerId").Value(pgNotes.txtStickerId.Value());
            pgNotes.txtStickerId.Value("");
        }
        
        // copy sticker id and clear original
        if (pgNotes.txtStickerId1.Value() != "") {
            pgNotesCloned.Control("txtStickerId1").Value(pgNotes.txtStickerId1.Value());
            pgNotes.txtStickerId1.Value("");
        }
        
        // copy drawing
        if (pgNotes.fhDrawing.Value() != "") {
            pgNotesCloned.Control("fhDrawing").Value(pgNotes.fhDrawing.Value());
            // copy position
            pgNotesCloned.Control("fhDrawing").Attribute(Vitro.CONTROL.Position, pgNotes.fhDrawing.Attribute(Vitro.CONTROL.Position), true).Show();
            pgNotesCloned.Control("fhDrawing").Attribute(Vitro.CONTROL.ZIndex, pgNotes.fhDrawing.Attribute(Vitro.CONTROL.ZIndex), true).ReadOnly(true);
            // copy width
            pgNotesCloned.Control("fhDrawing").Attribute(Vitro.CONTROL.Width, pgNotes.fhDrawing.Attribute(Vitro.CONTROL.Width), true);
            // copy height
            pgNotesCloned.Control("fhDrawing").Attribute(Vitro.CONTROL.Height, pgNotes.fhDrawing.Attribute(Vitro.CONTROL.Height), true);
            // clear original
            pgNotes.fhDrawing.Value("").Attribute(Vitro.CONTROL.ZIndex, "0", true).Hide();
        }
        
        // copy drawing
        if (pgNotes.fhDrawing1.Value() != "") {
            pgNotesCloned.Control("fhDrawing1").Value(pgNotes.fhDrawing1.Value());
            // copy position
            pgNotesCloned.Control("fhDrawing1").Attribute(Vitro.CONTROL.Position, pgNotes.fhDrawing1.Attribute(Vitro.CONTROL.Position), true).Show();
            pgNotesCloned.Control("fhDrawing1").Attribute(Vitro.CONTROL.ZIndex, pgNotes.fhDrawing1.Attribute(Vitro.CONTROL.ZIndex), true).ReadOnly(true);
            // copy width
            pgNotesCloned.Control("fhDrawing1").Attribute(Vitro.CONTROL.Width, pgNotes.fhDrawing1.Attribute(Vitro.CONTROL.Width), true);
            // copy height
            pgNotesCloned.Control("fhDrawing1").Attribute(Vitro.CONTROL.Height, pgNotes.fhDrawing1.Attribute(Vitro.CONTROL.Height), true);
            // clear original
            pgNotes.fhDrawing1.Value("").Attribute(Vitro.CONTROL.ZIndex, "0", true).Hide();
        }
    }
    return pgNotesCloned;
}

// Helper function to count the number of lines in a text block
function CountLines(text, lettersPerLine) {
    var i;
    // If the text is not empty, there will be at least one line
    var numlines = (text != "") ? 1 : 0;

    // Count the number of new lines
    for (i = 0; i < text.length; i++) {
        if (text.charAt(i) == "\r" || text.charAt(i) == "\n") {
            numlines++;
        }
    }

    text = text.replace(/\n/g, "\r");
    var textArr = text.split("\r");

    // For each section, increment the number of lines if the length warrants it
    for (i = 0; i < textArr.length; i++) {
        numlines += Math.floor(textArr[i].length / (lettersPerLine + 1));
    }

    return (numlines);
}

// Helper function to extract lines from text
function GetLines(text, lettersPerLine, lineFrom, lineTo) {
    var i;
    var lineNow = 1;
    var charNow = 0;
    var charStart = 0;
    var charEnd = 0;

    // Find the starting line, indexed from 1
    if (lineFrom > 1) {
        // Char count is zero
        charNow = 0;

        // Loop through the text
        for (i = 0; i < text.length; i++) {
            charNow++;

            // New lines?
            if (text.charAt(i) == "\r" || text.charAt(i) == "\n") {
                // Start of a new line - is it ours?
                if (++lineNow == lineFrom) {
                    // To skip the \r char
                    i++;
                    break;
                }
                // otherwise reset the char count
                charNow = 0;
            }
            // Not a new line - so it is a character
            // Are we over the number of letters in the line
            else if (charNow > lettersPerLine) {
                // Start of a new line - is it ours?
                if (++lineNow == lineFrom) break;

                // Otherwise reset the char countr on the row
                charNow = 1;
            }
        }

        // When we break or finish, store the char position for the start of the line
        charStart = i;
    }

    // Is the line ending ignored - i.e. get all lines to the end?
    if (lineTo <= 0) {
        // The ending index is the last
        charEnd = text.length;
    } 
    else {
        charNow = 0;

        // From the start of the lineFrom to the end
        for (i = charStart; i < text.length; i++) {
            charNow++;

            // A new line?
            if (text.charAt(i) == "\r" || text.charAt(i) == "\n") {
                // We've reached the end of the line we wanted
                if (lineNow >= lineTo) {
                    // To skip the "\r" character
                    break;
                }

                // else increment of line count
                lineNow++;
                // Reset the character count
                charNow = 0;
            }
            // Chars in the line equals the number of letters in the line
            else if (charNow > lettersPerLine) {
                // We've reached the end of the line we wanted
                if (lineNow > lineTo) {
                    i++;
                    break;
                }

                // else increment the line count
                lineNow++;
                // Reset the char counter
                charNow = 1;
            }
        }

        charEnd = i;
    }

    // Return the sliced text
    return (text.slice(charStart, charEnd));
}

// Disable all actions
function DisableActions() {
    for (var a in Vitro.ACTIONS) {
        myApp.Disable(Vitro.ACTIONS[a]);
    }
    myApp.Disable("Add Note");
    myApp.Disable("Add Photo");
    myApp.Disable("Add Sticker");
    myApp.Disable("Handover Note");
    myApp.Disable("Send Message");
}

// Enable all actions
function EnableActions() {
    for (var a in Vitro.ACTIONS) {
        myApp.Enable(Vitro.ACTIONS[a]);
    }
    myApp.Enable("Add Note");
    myApp.Enable("Add Photo");
    myApp.Enable("Add Sticker");
    myApp.Enable("Handover Note");
    myApp.Enable("Send Message");

    myApp.Hide(Vitro.ACTIONS.Submit);
    myApp.Show(Vitro.ACTIONS.Print);
}

// register controls on the note pages
function RegisterNoteControls(pg) {
    // Register the controls into the namespace     
    pg.RegisterControls("txtSurname", "txtFirstName", "pnlClickNote", "txtStickerNames");
        
    pg.RegisterControls("txtNotes", "rptNotes", "imgSticker", "txtStickerId", "fhDrawing", "imgSticker1", "fhDrawing1", "txtStickerId1");
    pg.RegisterRepeater("rptDate", LINES_PER_PAGE);
    pg.RegisterRepeater("txtDate", LINES_PER_PAGE);
    pg.RegisterRepeater("lblUser", LINES_PER_PAGE);
    pg.RegisterRepeater("lblStrike", LINES_PER_PAGE);
    pg.RegisterRepeater("lblStrikeName", LINES_PER_PAGE);
    pg.RegisterRepeater("lblCoSign", LINES_PER_PAGE);
}

// returns users full name and role formatted
function GetUserDetails(username) {
    // if no username provided, use current user
    if (!username) { 
        username = Vitro.Users().Property(Vitro.USER.Name); 
    }
    // return first name last name and role
    return {
        Normal: Vitro.Users(username).Property(Vitro.USER.FirstName) + " " + Vitro.Users(username).Property(Vitro.USER.LastName) + " (" + Vitro.Users(username).Property(Vitro.USER.Role) + ")",
        PopUp: Vitro.Users(username).Property(Vitro.USER.FirstName) + " " + Vitro.Users(username).Property(Vitro.USER.LastName)
    };
}

// get date and time as strings
function GetDateTimeStrings() {
    var today = new Date();
    return {
        date: (today.getDate() < 10 ? "0" : "") + today.getDate() + "/" + ((today.getMonth() + 1) < 10 ? "0" : "") + (today.getMonth() + 1) + "/" + today.getFullYear().toString(),
        time: (today.getHours() < 10 ? "0" : "") + today.getHours() + ":" + (today.getMinutes() < 10 ? "0" : "") + today.getMinutes()
    };
}

// Set Date to page title
function SetTitle() {
    var today = new Date();
    var date =  (today.getDate() < 10 ? "0" : "") + today.getDate() + "/" + ((today.getMonth() + 1) < 10 ? "0" : "") + (today.getMonth() + 1) + "/";
    var year = today.getFullYear().toString();
    year = year.substr(2);
    date += year;
    return date;
}

// store what you want to submit and reload app in case there is a conflict with a concurrent user
function ReloadApp(reloadObj) {
    // Store what we want to submit in case there is a conflict with a concurrent user  
    Vitro.Xaim(appActivityId).Initialisation(reloadObj);

    // We were gesumped - the version is older than ours - we'll reload automatically
    if (Vitro.Workflow.GetActivity(appActivityId).VersionNumber > actVersion) {
        // remove dynamic controls
        RemoveStrikeButton(Page);
        DestroyPopup();
        // reload app
        myApp.Clean();
        myApp.Existing(appActivityId);
        myApp.Action(Vitro.ACTIONS.ChangeApp);
    }
    // submit to store change and reset events and pages
    else {
        var summaryText = myApp.Activity.Summary();
        if(summaryText !== null && summary != "") {
            if(summaryText.indexOf(summary) === -1) {
                summaryText += ", " + summary;
                myApp.Activity.Summary(summaryText);
                summary = "";
            }
        }
        else{
            if(summary == "") {
                summary = summaryText;
            }
            myApp.Activity.Summary(summary);
            summary = "";
        }
        myApp.Action(Vitro.ACTIONS.Submit, false);
    }
}

// create cover for popups
function CreatePopupBG(pg) {
    var panCover = pg.CreateControl(Vitro.TYPE.Panel);
    panCover.Attribute(Vitro.CONTROL.Width, PAGE_WIDTH.toString());
    panCover.Attribute(Vitro.CONTROL.Height, PAGE_HEIGHT.toString());
    panCover.Attribute(Vitro.CONTROL.Position, "0,0");
    panCover.Attribute(Vitro.CONTROL.ZIndex, "3");
    panCover.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
    return panCover;
}

// create popup window
function CreatePopupWindow(pg, width, height) {
    var panPopup = pg.CreateControl(Vitro.TYPE.Panel, null, popupObj.panCover);
    panPopup.Attribute(Vitro.CONTROL.Width, width);
    panPopup.Attribute(Vitro.CONTROL.Height, height);
    panPopup.Attribute(Vitro.CONTROL.Position, "150, 50");
    panPopup.Attribute(Vitro.CONTROL.Border, "true");
    panPopup.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.LIGHT_GREY);
    return panPopup;
}

// create a button with default properties
function CreateDynamicButton(pg, width, position, text) {
    var btn = pg.CreateControl(Vitro.TYPE.Button, null, popupObj.panPopup);
    btn.Attribute(Vitro.CONTROL.Width, width);
    btn.Attribute(Vitro.CONTROL.Height, "35");
    btn.Attribute(Vitro.CONTROL.Position, position);
    btn.Attribute(Vitro.CONTROL.Border, "True");
    btn.Attribute(Vitro.CONTROL.FontSize, "13");
    btn.Attribute(Vitro.CONTROL.FontWeight, "Bold");
    btn.Attribute(Vitro.BUTTON.TextAlignment, "Center");
    btn.Attribute(Vitro.BUTTON.ButtonText, text);
    return btn;
}

// create a label with default properties
function CreateDynamicLabel(pg, position, text) {
    var lbl = pg.CreateControl(Vitro.TYPE.Label, null, popupObj.panPopup);
    lbl.Attribute(Vitro.CONTROL.Width, "490");
    lbl.Attribute(Vitro.CONTROL.Height, "26");
    lbl.Attribute(Vitro.CONTROL.Position, position);
    lbl.Attribute(Vitro.CONTROL.Border, "false");
    lbl.Attribute(Vitro.CONTROL.FontSize, "15");
    lbl.Attribute(Vitro.CONTROL.FontFamily, "Portable User Interface");
    lbl.Attribute(Vitro.CONTROL.FontWeight, "Bold");
    lbl.Value(text);
    return lbl;
}

// create a label with default properties
function CreateDynamicTextBox(pg, width, height, position) {
    var txt = pg.CreateControl(Vitro.TYPE.Textbox, null, popupObj.panPopup);
    txt.Attribute(Vitro.CONTROL.Width, width);
    txt.Attribute(Vitro.CONTROL.Height, height);
    txt.Attribute(Vitro.CONTROL.Position, position);
    txt.Attribute(Vitro.CONTROL.Border, "True");
    txt.Attribute(Vitro.CONTROL.FontSize, "13");
    txt.Attribute(Vitro.CONTROL.FontFamily, "Courier New");
    txt.Attribute(Vitro.TEXTBOX.TextWrapping, "Wrap");
    txt.Attribute(Vitro.TEXTBOX.AutoScroll, "True");
    txt.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE);
    return txt;
}

// create a Dropdown with default properties
function CreateDynamicDropdown(pg, width, position) {
    var txt = pg.CreateControl(Vitro.TYPE.DropDown, null, popupObj.panPopup);
    txt.Attribute(Vitro.CONTROL.Width, width);
    txt.Attribute(Vitro.CONTROL.Height, "35");
    txt.Attribute(Vitro.CONTROL.Position, position);
    txt.Attribute(Vitro.CONTROL.Border, "True");
    txt.Attribute(Vitro.CONTROL.FontSize, "13");
    txt.Attribute(Vitro.CONTROL.FontFamily, "Courier New");
    return txt;
}

// create signature control for co-signing student entries
function CreateStrikeButton(pg, pos, index) {
    var strikeButton = pg.CreateControl(Vitro.TYPE.Label);
    // set properties
    strikeButton.Attribute(Vitro.CONTROL.Width, "60");
    strikeButton.Attribute(Vitro.CONTROL.Height, "22");
    strikeButton.Attribute(Vitro.CONTROL.Position, pos);
    strikeButton.Attribute(Vitro.CONTROL.ZIndex, "2");
    strikeButton.Attribute(Vitro.LABEL.TextAlignment, "Center");
    strikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
    // Set Properties on different state
    if(pg.lblStrikeName[index].Value() == ""){
        strikeButton.Attribute(Vitro.LABEL.Content, "STK");
        strikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
    }
    else{
        strikeButton.Attribute(Vitro.LABEL.Content, "");
        strikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT);
        strikeButton.Attribute(Vitro.CONTROL.Border, "False");
    }
    
    // set index of stk button
    pg.Control("txtStkIndex[" + index + "]").Value(index);
    strikeButton.Events.Click(function(pg, ctrl, xLocation, yLocation) {
        
        if(Finished){
            if(strikeButton.Attribute(Vitro.LABEL.Content) == ""){
                strikeButton.Attribute(Vitro.LABEL.Content, "STK");
                strikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
                pg.lblStrikeName[index].Value("");
                StrikeButton = false;
            }
            else{
                strikeButton.Attribute(Vitro.LABEL.Content, "");
                strikeButton.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT);
                strikeButton.Attribute(Vitro.CONTROL.Border, "False");
                StrikeButton = true;
            }
            
            if(pg.lblStrikeName[index].Value() != ""){
                StrikeButton = false;
            }
            
            SetButtonStrike(pg, index, CURRENT_USER, StrikeButton);
        }
    });
    
    // store button info for removal
    strikeButtons.push({
        pg: pg,
        strikeButton : strikeButton,
        User: CURRENT_USER,
        Index: index
    });
}

// create signature control for co-signing student entries
function CreateCoSignButton(pg, pos, index) {
    
    var coSign = pg.CreateControl(Vitro.TYPE.Label);
    // set properties
    coSign.Attribute(Vitro.CONTROL.Width, "1");
    coSign.Attribute(Vitro.CONTROL.Height, "1");
    coSign.Attribute(Vitro.CONTROL.Position, pos);
    coSign.Attribute(Vitro.CONTROL.ZIndex, "0");
    coSign.Attribute(Vitro.LABEL.TextAlignment, "Center");
    coSign.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
            
    // Create hidden auth                                                                   
    // When user adds a username and password into the validation pop-up , Co-sign permission   
    var auCoSign = pg.CreateControl(Vitro.TYPE.Authorisation);  
    
    auCoSign.Attribute(Vitro.CONTROL.Width, "80");
    auCoSign.Attribute(Vitro.CONTROL.Height, "27");
    auCoSign.Attribute(Vitro.CONTROL.Position, pos);
    auCoSign.Attribute(Vitro.CONTROL.ZIndex, "2");
    
    auCoSign.Attribute(Vitro.AUTHORISATION.SignType, "Stamp");
    // auCoSign.Attribute(Vitro.AUTHORISATION.RequiresPassword, "True");    
    auCoSign.Attribute(Vitro.AUTHORISATION.AuthorisedUsers, AUTHORISED_GROUPS); 

  // Set Properties on different state
    if(pg.lblCoSign[index].Value() == ""){      
        auCoSign.Attribute(Vitro.AUTHORISATION.AuthoriseContent, "Co-Sign");    
        auCoSign.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANS_GREY);
    }
    else{
        
        auCoSign.Attribute(Vitro.AUTHORISATION.AuthoriseContent, "");           
        auCoSign.Attribute(Vitro.CONTROL.Border, "False");
        auCoSign.Hide();
    }   

    auCoSign.Events.Change(function(pg, ctrl, oldValue, newValue) {
    
            var entryName = pg.Control("lblUser[" + index + "]").Attribute(Vitro.LABEL.Content).split(" "); 
                
            var sig = GetSignature(true, newValue.SignStamp);       
                         
            if (newValue.SignStamp != entryName[0] && entryName[0] !== undefined) {
                pg.lblCoSign[index + 2].Value(sig);
                pg.lblCoSign[index + 2].Show();             
                
                auCoSign.Attribute(Vitro.AUTHORISATION.AuthoriseContent, "Co-Sign");    
                auCoSign.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.TRANSPARENT);
                auCoSign.Attribute(Vitro.CONTROL.Border, "False");
                ctrl.Hide(true);
                // Submit but do not close the activity
                myApp.Action(Vitro.ACTIONS.Submit, false);
                myApp.Show(Vitro.ACTIONS.Submit);
            }
            else {
                ctrl.Value("");         
            }
                
    }); 
    
      // store button info for removal
    coSignButtons.push({
        pg: pg,
        signButton : coSign,
        auSign : auCoSign,
        User: CURRENT_USER,
        Index: index
    });
    
}

// create popup for adding a note
function CreateDynamicNotePopup(pg) {
    
    // Set Zoom
    myApp.ZoomTo(1);
    popupObj = {};
    popupObj.pg = pg;
    // cover panel
    popupObj.panCover = CreatePopupBG(pg);
    // popup panel
    popupObj.panPopup = CreatePopupWindow(pg, "640", "485");
    // header   
    popupObj.lblHeader = CreateDynamicTextBox(pg, "620", "25", "10, 10");
    
    popupObj.lblHeader.Value("Add Note for: " +pgNotes.txtFirstName.Value() + " " + pgNotes.txtSurname.Value()).ReadOnly();
    // text
    popupObj.txtNote = CreateDynamicTextBox(pg, "620", "360", "10, 40");
    //User
    popupObj.lblUser = CreateDynamicTextBox(pg, "620", "25", "10, 405");
    
    popupObj.lblUser.Value("Entry made by: " +  GetUserDetails().PopUp).ReadOnly();
    
    popupObj.Dropdown = CreateDynamicDropdown(pg, "300", "10,435");
    popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, "");
    // sort groups list alphabetically
    var sortedGroups = [];
    for (var s = 0; s < Groups.length; s++) {
        sortedGroups.push(Groups[s]);
    }
    sortedGroups.sort();
    //populate dropdown with group names
    for(var i = 0; i < sortedGroups.length; i++) {
        popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, sortedGroups[i]);
    }
    popupObj.Dropdown.Value(sortedGroups[0]);
    // OK button
    popupObj.btnOK = CreateDynamicButton(pg, "150", "320, 435", "Submit");
    // Disable Submit Button
    popupObj.btnOK.Disable();
    
    popupObj.txtNote.Attribute(Vitro.TEXTBOX.EventOnCharChange, "True");
    
    popupObj.txtNote.Events.Change(function(pg, ctrl, oldValue, newValue){
        if(newValue != ""){
            popupObj.btnOK.Enable();
        }
        else{
            popupObj.btnOK.Disable();
        }
    });
    
    // Cancel button
    popupObj.btnCancel = CreateDynamicButton(pg, "150", "480, 435", "Cancel");
    // set popup postion and lock user to page
    SetupPopup(pg);
}

// create popup for adding a photo
function CreateDynamicPhotoPopup(pg) {
    myApp.ZoomTo(1);
    popupObj = {};
    popupObj.pg = pg;
    // cover panel
    popupObj.panCover = CreatePopupBG(pg);
    // popup panel
    popupObj.panPopup = CreatePopupWindow(pg, "545", "650");
    
    popupObj.lblHeader = CreateDynamicTextBox(pg, "525", "25", "10, 10");
    
    popupObj.lblHeader.Value("Add Photo for: " +pgNotes.txtFirstName.Value() + " " + pgNotes.txtSurname.Value()).ReadOnly();
    // drawing 
    popupObj.fhDrawing = pg.CreateControl(Vitro.TYPE.Freehand, null, popupObj.panPopup);
    popupObj.fhDrawing.Attribute(Vitro.CONTROL.Width, "505");
    popupObj.fhDrawing.Attribute(Vitro.CONTROL.Height, "345");
    popupObj.fhDrawing.Attribute(Vitro.CONTROL.Position, "20, 50");
    popupObj.fhDrawing.Attribute(Vitro.CONTROL.ZIndex, "0").ReadOnly();
    // image
    popupObj.imgPhoto = pg.CreateControl(Vitro.TYPE.Image, { "RectangularRoundingRadii": "0, 0" }, popupObj.panPopup);
    popupObj.imgPhoto.Attribute(Vitro.CONTROL.Width, "505");
    popupObj.imgPhoto.Attribute(Vitro.CONTROL.Height, "345");
    popupObj.imgPhoto.Attribute(Vitro.CONTROL.Position, "20, 50");
    popupObj.imgPhoto.Attribute(Vitro.CONTROL.ZIndex, "1");
    popupObj.imgPhoto.Attribute(Vitro.CONTROL.BackgroundColour, COLOURS.WHITE);
    // switch button
    popupObj.btnSwitch = CreateDynamicButton(pg, "232", "165, 425", "Switch to Drawing");
    // text
    popupObj.txtNote = CreateDynamicTextBox(pg, "525", "100", "10, 465");
    
    popupObj.lblUser = CreateDynamicTextBox(pg, "525", "25", "10, 570");
    popupObj.lblUser.Value("Photo taken by: " +  GetUserDetails().PopUp).ReadOnly();
    
    popupObj.Dropdown = CreateDynamicDropdown(pg, "200", "10,605");
    popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, "");
    // sort groups list alphabetically
    var sortedGroups = [];
    for (var s = 0; s < Groups.length; s++) {
        sortedGroups.push(Groups[s]);
    }
    sortedGroups.sort();
    //populate dropdown with group names
    for(var i = 0; i < sortedGroups.length; i++) {
        popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, sortedGroups[i]);
    }
    popupObj.Dropdown.Value(sortedGroups[0]);
    // OK button
    popupObj.btnOK = CreateDynamicButton(pg, "150", "225, 605", "Submit");
    // Disable Submit Button
    popupObj.btnOK.Disable();
 
    // Cancel button
    popupObj.btnCancel = CreateDynamicButton(pg, "150", "385, 605", "Cancel");
    // set popup postion and lock user to page
    SetupPopup(pg);
}

// create popup for adding or updating a sticker
function CreateDynamicStickerPopup(pg, addSticker) {
    popupObj = {};
    popupObj.pg = pg;
    // cover panel
    popupObj.panCover = CreatePopupBG(pg);
    // popup panel
    popupObj.panPopup = CreatePopupWindow(pg, "510", "125");
    // if called from add sticker button
    if (addSticker) {
        // header
        popupObj.lblHeader = CreateDynamicLabel(pg, "10, 10", "Please Select a Sticker Type:");
        // sticker dropdown
        popupObj.ddSticker = pg.CreateControl(Vitro.TYPE.DropDown, null, popupObj.panPopup);
        popupObj.ddSticker.Attribute(Vitro.CONTROL.Width, "490");
        popupObj.ddSticker.Attribute(Vitro.CONTROL.Height, "26");
        popupObj.ddSticker.Attribute(Vitro.CONTROL.Position, "10, 40");
        popupObj.ddSticker.Attribute(Vitro.CONTROL.FontSize, "14");
        popupObj.ddSticker.Attribute(Vitro.DROPDOWN.Add, "");
        for (var i = 0; i < stickerApps.length; i++) {
            popupObj.ddSticker.Attribute(Vitro.DROPDOWN.Add, stickerApps[i]);
        }
        // OK button
        popupObj.btnOK = CreateDynamicButton(pg, "150", "10, 80", "Submit");
        popupObj.btnOK.Disable();
    } 
    else {
        // header
        popupObj.lblHeader = CreateDynamicLabel(pg, "10, 10", "Please select an action for this sticker:");
        // Strike button
        popupObj.btnStrike = CreateDynamicButton(pg, "150", "10, 80", "Strike Sticker");
        // Open button
        popupObj.btnOpen = CreateDynamicButton(pg, "150", "180, 80", "Open Sticker");
        // Cancel button
        popupObj.btnCancel = CreateDynamicButton(pg, "150", "350, 80", "Cancel");
    }
    // Cancel button
    popupObj.btnCancel = CreateDynamicButton(pg, "150", "350, 80", "Cancel");
    // set popup postion and lock user to page
    SetupPopup(pg);
}

// create popup for handover action
function CreateDynamicHandoverPopup(pg) {
   // Set Zoom
    myApp.ZoomTo(1);
    popupObj = {};
    popupObj.pg = pg;
    // cover panel
    popupObj.panCover = CreatePopupBG(pg);
    // popup panel
    popupObj.panPopup = CreatePopupWindow(pg, "640", "485");
    // header   
    popupObj.lblHeader = CreateDynamicTextBox(pg, "620", "25", "10, 10");
    
    popupObj.lblHeader.Value("Add Note for: " +pgNotes.txtFirstName.Value() + " " + pgNotes.txtSurname.Value()).ReadOnly();
    // text Hand Over
    popupObj.txtHandOver = CreateDynamicTextBox(pg, "620", "30", "10, 40");
    popupObj.txtHandOver.Value("****HANDOVER****");
    popupObj.txtHandOver.Attribute(Vitro.TEXTBOX.TextAlignment, "Center");
    popupObj.txtHandOver.ReadOnly();
    // text
    popupObj.txtNote = CreateDynamicTextBox(pg, "620", "330", "10, 70");
    popupObj.txtNote.Attribute(Vitro.TEXTBOX.CharLimit, "255");
    //User
    popupObj.lblUser = CreateDynamicTextBox(pg, "620", "25", "10, 405");
    
    popupObj.lblUser.Value("Entry made by: " +  GetUserDetails().PopUp).ReadOnly();
    
    popupObj.Dropdown = CreateDynamicDropdown(pg, "300", "10,435");
    popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, "");
    // sort groups list alphabetically
    var sortedGroups = [];
    for (var s = 0; s < Groups.length; s++) {
        sortedGroups.push(Groups[s]);
    }
    sortedGroups.sort();
    //populate dropdown with group names
    for(var i = 0; i < sortedGroups.length; i++) {
        popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, sortedGroups[i]);
    }
    popupObj.Dropdown.Value(sortedGroups[0]);
    // OK button
    popupObj.btnOK = CreateDynamicButton(pg, "150", "320, 435", "Submit");
    // Disable Submit Button
    popupObj.btnOK.Disable();
    
    popupObj.txtNote.Attribute(Vitro.TEXTBOX.EventOnCharChange, "True");
    
    popupObj.txtNote.Events.Change(function(pg, ctrl, oldValue, newValue){
        if(newValue != ""){
            popupObj.btnOK.Enable();
        }
        else{
            popupObj.btnOK.Disable();
        }
    });
    
    // Cancel button
    popupObj.btnCancel = CreateDynamicButton(pg, "150", "480, 435", "Cancel");
    // set popup postion and lock user to page
    SetupPopup(pg);
}

// create popup for handover action
function CreateDynamicSendMessagePopup(pg) {
   // Set Zoom
    myApp.ZoomTo(1);
    popupObj = {};
    popupObj.pg = pg;
    // cover panel
    popupObj.panCover = CreatePopupBG(pg);
    // popup panel
    popupObj.panPopup = CreatePopupWindow(pg, "640", "485");
    // header   
    popupObj.txtMessageRecipientLabel = CreateDynamicTextBox(pg, "155", "25", "10, 10");
    popupObj.txtMessageRecipientLabel.Value("Message Recipient: ").ReadOnly();
    popupObj.txtMessageRecipient = CreateDynamicTextBox(pg, "465", "25", "165, 10");
    popupObj.txtMessageRecipient.Value("Click to select user").ReadOnly();
    popupObj.txtMessageRecipient.Attribute(Vitro.TEXTBOX.BackgroundColour, "80,255,255,0");
    popupObj.txtMessage = CreateDynamicTextBox(pg, "620", "345", "10, 45");
    popupObj.txtMessage.Focus();
    popupObj.txtEntryByLabel = CreateDynamicTextBox(pg, "155", "25", "10, 400");
    popupObj.txtEntryByLabel.Value("Entry made by").ReadOnly();
    popupObj.txtEntryBy = CreateDynamicTextBox(pg, "465", "25", "165, 400");
    popupObj.txtEntryBy.Value(GetUserDetails().PopUp).ReadOnly();
    // // text Hand Over
    // popupObj.txtHandOver = CreateDynamicTextBox(pg, "620", "30", "10, 40");
    // popupObj.txtHandOver.Value("****HANDOVER****");
    // popupObj.txtHandOver.Attribute(Vitro.TEXTBOX.TextAlignment, "Center");
    // popupObj.txtHandOver.ReadOnly();
    // // text
    // popupObj.txtNote = CreateDynamicTextBox(pg, "620", "330", "10, 70");
    // popupObj.txtNote.Attribute(Vitro.TEXTBOX.CharLimit, "255");
    // //User
    // popupObj.lblUser = CreateDynamicTextBox(pg, "620", "25", "10, 405");
    
    // popupObj.lblUser.Value("Entry made by: " +  GetUserDetails().PopUp).ReadOnly();
    
    // popupObj.Dropdown = CreateDynamicDropdown(pg, "300", "10,435");
    // popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, "");
    // // sort groups list alphabetically
    // var sortedGroups = [];
    // for (var s = 0; s < Groups.length; s++) {
    //     sortedGroups.push(Groups[s]);
    // }
    // sortedGroups.sort();
    // //populate dropdown with group names
    // for(var i = 0; i < sortedGroups.length; i++) {
    //     popupObj.Dropdown.Attribute(Vitro.DROPDOWN.Add, sortedGroups[i]);
    // }
    // popupObj.Dropdown.Value(sortedGroups[0]);
    // // OK button
    popupObj.btnOK = CreateDynamicButton(pg, "150", "320, 435", "Send");
    // Disable Submit Button
    popupObj.btnOK.Disable();
    
    popupObj.txtMessage.Attribute(Vitro.TEXTBOX.EventOnCharChange, "True");
    
    popupObj.txtMessage.Events.Change(function(pg, ctrl, oldValue, newValue){
        if(newValue != "" && popupObj.txtMessageRecipient.Value() != "Click to select user"){
            popupObj.btnOK.Enable();
        }
        else{
            popupObj.btnOK.Disable();
        }
    });
    
    // Cancel button
    popupObj.btnCancel = CreateDynamicButton(pg, "150", "480, 435", "Cancel");
    // set popup postion and lock user to page
    SetupPopup(pg);
}


// when the user changes the text in the note textbox
function NotePopupOkEvent(pg, ctrl, xlocation, ylocation) {
    // check if Vitro is online before proceeding as workflow call is made
    if (Vitro.Properties.IsOnline() === true) {
        // prevent user from double clicking by disabling
        ctrl.Disable();
        //Set the Colour for the user
        Colour = popupObj.Dropdown.Value();
        
        InsertNote(pg, popupObj.txtNote.Value());
    }
}

function SetupPopup(pg) {
    // Set handlers for scrolling, zooming or browser resizing to re-center the dialoge
    tempEvents.evScroll = pg.Events.Scrolled(NotePosition);
    tempEvents.evZoom = pg.Events.Zoomed(NotePosition);
    tempEvents.evResize = Vitro.Events.Resized(NotePosition);
    NotePosition();
    // disable the actions
    DisableActions();
    // hide the page navigation
    myApp.PageNavigationVisibility(false);
    pg.Activate();
}

// clear the popup and reset events
function ClearPopupEvent(pg, ctrl, xlocation, ylocation) {
    // prevent user from double clicking by disabling
    ctrl.Disable();
    if(strikeCount !== 0){
        ClearUnstrikePopUp(pg, ctrl, xlocation, ylocation);
    }
    else{
        RestoreDefaults(pg);
    }
}

// destroy popup control
function DestroyPopup() {
    if (popupObj) {
        popupObj.pg.DestroyControl(popupObj.panCover);
        popupObj = null;
        tempEvents.evScroll.Remove();
        tempEvents.evZoom.Remove();
        tempEvents.evResize.Remove();
    }
    // show page navigation
    myApp.PageNavigationVisibility(true);
}

// click event for when the user presses the Ok button after selecting a sticker
function StickerOkClickEvent(pg, ctrl, xlocation, ylocation) {
    // prevent user from double clicking by disabling
    ctrl.Disable();
    var patID = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID), 10);
    // create new activity of sticker
    var stickerID = Vitro.Workflow.GetApp(popupObj.ddSticker.Value());
    var stickerAct = Vitro.Workflow.CreateActivity(stickerID, patID, epID);
    // clear popup
    RestoreDefaults(pg);
    xaimObj.pageId = pg.Properties.ID();
    xaimObj.UserColour = Groups[0];
    // setup xaim
    Vitro.Xaim(XAIM_STICKER_KEY).Initialisation(xaimObj);
    // if activity created successfully
    if(stickerAct) {
        // change app
        myApp.Existing(stickerAct.Id);
        // if app is new, submit before changing
        if (status == Vitro.STATUS.New) {
            changingApp = true;
            myApp.Action(Vitro.ACTIONS.Submit, false);
        }
        // otherwise there should be no unsaved changes
        else {
            myApp.Clean();
            myApp.Action(Vitro.ACTIONS.ChangeApp, false);
        }
    }
}

// enable the ok button when control has a value
function EnableOKEvent(pg, ctrl, oldvalue, newvalue) {
    if (newvalue != "") {
        popupObj.btnOK.Enable();
    } 
    else {
        popupObj.btnOK.Disable();
    }
}

// event for when the suer selects to strike the sticker
function StrikeStickerClickEvent(pg, ctrl, xlocation, ylocation) {

    // prevent user from double clicking by disabling
    ctrl.Disable();
    // clear popup
    DestroyPopup();
    // set strike for striker
    StickerStrike(pg, StickerSticker_Index);
}

// click event for when the user selects to open a sticker
function OpenStickerClickEvent(pg, ctrl, xlocation, ylocation) {
    // clear popup
    RestoreDefaults(pg);
    // setup xaim
    xaimObj.IsUpdate = true;
    // SetPage for returning sticker
    xaimObj.pageId = pg.Properties.ID();
    // setup xaim
    Vitro.Xaim(XAIM_STICKER_KEY).Initialisation(xaimObj);
    var actId = 0;
    if(StickerSticker_Index < 31 || pg.txtStickerId1.Value() == "") {
    // get activity
        if(pg.txtStickerId.Value() != "") {
            actId = parseInt(pg.txtStickerId.Value(), 10);
            // open activity
            myApp.Clean();
            myApp.Existing(actId);
            myApp.Action(Vitro.ACTIONS.ChangeApp);
        }
    }
    else{
        actId = parseInt(pg.txtStickerId1.Value(), 10);
        // open activity
        myApp.Clean();
        myApp.Existing(actId);
        myApp.Action(Vitro.ACTIONS.ChangeApp);
    }
}

// when user presses the switch button
function SwitchToDrawEvent(pg, ctrl, xlocation, ylocation) {
    if (popupObj.btnSwitch.Attribute(Vitro.BUTTON.ButtonText) == "Switch to Photo") {
        popupObj.btnSwitch.Attribute(Vitro.BUTTON.ButtonText, "Switch to Drawing");
        popupObj.fhDrawing.Attribute(Vitro.CONTROL.ZIndex, "0", true).ReadOnly();
        popupObj.imgPhoto.Attribute(Vitro.CONTROL.ZIndex, "1", true).Writeable();
    } 
    else {
        popupObj.btnSwitch.Attribute(Vitro.BUTTON.ButtonText, "Switch to Photo");
        popupObj.fhDrawing.Attribute(Vitro.CONTROL.ZIndex, "1", true).Writeable();
        popupObj.imgPhoto.Attribute(Vitro.CONTROL.ZIndex, "0", true).ReadOnly();
    }
}

// when eithrer an image or drawing has been entered
function ImageEnteredEvent() {
    popupObj.btnOK.Disable();
    // Drawing is set
    if (popupObj.fhDrawing.Value() != "" && popupObj.fhDrawing.Value().length !== 0) {
        popupObj.btnOK.Enable();
    }
    // if image is set
    else if (popupObj.imgPhoto.Value() !== null) {
        if (popupObj.imgPhoto.Value().Base64 != null) {
            popupObj.btnOK.Enable();
        }
    }
    // if image is removed
    if (popupObj.imgPhoto.Value() == null && popupObj.fhDrawing.Value().length === 0) {
        popupObj.btnOK.Disable();
    } else {
        if (popupObj.imgPhoto.Value() !== null) {
            if ((popupObj.imgPhoto.Value().Base64 == null) &&
                popupObj.fhDrawing.Value().length === 0) {
                popupObj.btnOK.Disable();
            }
        }
    }

}

// when the user clicks ok for the photo
function OkPhotoEvent() {
    // check if Vitro is online before proceeding as workflow call is made
    if (Vitro.Properties.IsOnline() === true) {
        // prevent user from double clicking by disabling
        popupObj.btnOK.Disable();
        Colour = popupObj.Dropdown.Value();
        InsertPhoto(popupObj.imgPhoto.Value(), popupObj.fhDrawing.Value(), popupObj.txtNote.Value());
    }
}

// clear note popop and reset events and pages
function RestoreDefaults(pg) {
    DestroyPopup();

    SetupStrikeButton(pg);
    
    // remove all temp events
    for (var event in tempEvents) {
        if (tempEvents.hasOwnProperty(event)) {
            // if event is not null, remove
            if (tempEvents[event] !== null) {
                tempEvents[event].Remove();
                tempEvents[event] = null;
            }
        }
    }
    // show page navigation
    myApp.PageNavigationVisibility(true);
    // Re-enable the actions
    EnableActions();
    // reset strike lists
    strikeCount = 0;
    strikeList = {};
    myApp.Clean();
}

function SetPageLoading(pg){

    if(pg === null){
        var pgIds = myApp.Properties.PageIDs();     
        
        if(pgIds.length>1){
            Page_Loading = true;
        }
        // set all pages to partial load
        // Build object in PageIDs array to keep track of loaded pages      
        //  for(var i = pgIds.length-1; i >= 0; i--) {  
         for(var i = 0; i <= pgIds.length-1; i++) {  
            if(pgIds[i] == "pgNotes"){
                nxtPage = {
                    "pageId": pgIds[i],
                    "Loaded" : true
                };
                PageIDs.push(nxtPage);
            }
            else{
                if (pgIds[i] != "pgClone") {
                    myApp.Load(pgIds[i], false);
                    nxtPage = {
                        "pageId": pgIds[i],
                        "Loaded" : false
                    };              
                    PageIDs.push(nxtPage);
                }
            }
        }
    }
    else{
        var pgId = pg.Properties.ID();
        nxtPage ={
                "pageId": pgId,
                "Loaded" : true
                };
        PageIDs.push(nxtPage);
//        myApp.Load(pg, true);
    }
}

// Using integration to export pages for the sticker activities
function ExportPage(activityId, pageId, callback) {
    var async = (typeof callback === "function");
    // name parameter has to be valid
    if (typeof activityId != "number" || typeof pageId != "number") {
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

// Make the default URL for web service requests to W/F
var vwfurl = window.location.protocol.toString() + "//" + window.location.hostname.toString();
if (window.location.port != "")
    vwfurl += ":" + window.location.port.toString() + "/";

vwfurl += window.location.pathname.substring(0, window.location.pathname.lastIndexOf("/")) + "/" +
    "Services/IntegrationService.svc/web/";

// Helper function - internal to workflow
function makeHttpObject() {
    try {
        return new XMLHttpRequest();
    } catch (error) {}
    try {
        return new ActiveXObject("Msxml2.XMLHTTP");
    } catch (error) {}
    try {
        return new ActiveXObject("Microsoft.XMLHTTP");
    } catch (error) {}

    return null;
}
// Internal to workflow module
// Send request and callback response
// Request and response are converted to/from JSON
function ExecuteResponseCallback(url, params, async, callback) {
    try {
        var xmlHttp = makeHttpObject(); 
        if (xmlHttp === null) return false;

        // JSON and post to WS
        xmlHttp.open("POST", vwfurl + url, async);
        xmlHttp.setRequestHeader("Content-Type", "application/json; charset=utf-8");

        // If asynchronous
        if (async) {
            // The function to call when a resposne is received
            xmlHttp.onreadystatechange = function() {
                // Only when we get a 200 and a readyState of 4
                if (xmlHttp.readyState === 4 && xmlHttp.status === 200) {
                    // If response received and was blank - service sent a null;
                    if (xmlHttp.responseText === "") callback(null);
                    else callback(JSON.parse(xmlHttp.responseText));
                }
            };
        }

        // Send (stringify is needed)
        if (typeof params == "undefined")
            xmlHttp.send();
        else
            xmlHttp.send(JSON.stringify(params));

        // We wait for the response
        if (!async) {
            // Get the valid response - then un-JSON
            if (xmlHttp.status === 200) {
                // If response received and was blank - service sent a null;
                if (xmlHttp.responseText == "") return callback(null);
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

// Loads the data source
function RecipientDS_Load() {
    dsMessageRecipient.Launch();
}

// setup datasource UI for finding matching patient
function SetUpDataSource() {
    dsMessageRecipient.Property(Vitro.DATASOURCE.Table, "[dbo].Users");

    dsMessageRecipient.Property(Vitro.DATASOURCE.PreLoad, "true");
    dsMessageRecipient.Property(Vitro.DATASOURCE.Rows, "100");
    dsMessageRecipient.Property(Vitro.DATASOURCE.Title, "Doctors");
    dsMessageRecipient.Property(Vitro.DATASOURCE.Display, "Please choose a Doctor");

    dsMessageRecipient.Column("last_name", "Family Name", true);
    dsMessageRecipient.Column("middle_name", "Middle Name", true);
    dsMessageRecipient.Column("first_name", "Given Name", true);
    dsMessageRecipient.Column("user_name", "username", false);
    dsMessageRecipient.Column("employee_role", "Role", true);

    // loop and check if user belongs to the Doctor group

    dsMessageRecipient.Property(Vitro.DATASOURCE.Order, "last_name, first_name");

    dsMessageRecipient.Initialise();

    dsMessageRecipient.Events.Closed(function (r) {
        if (r == "OK") {
            // var userStamp = GetUserDetails().SignatureStamp;
            var name = dsMessageRecipient.Value(0, "first_name") + " " + dsMessageRecipient.Value(0, "last_name") + " - " + 
                dsMessageRecipient.Value(0, "employee_role");
            // Populate the Doctor's name into the PrescriberName textbox
            popupObj.txtMessageRecipient.Value(name);
            popupObj.txtMessageRecipient.Attribute(Vitro.TEXTBOX.BackgroundColour, COLOURS.TRANSPARENT);
            if(popupObj.txtMessage.Value() != "" && popupObj.txtMessageRecipient.Value() != "Click to select user") {
                popupObj.btnOK.Enable();
            }
            else{
                popupObj.btnOK.Disable();               
            }
        }
    });
}

// Creates a notification app and sends it to the user
function Send_Message() {
    // Create new activity of this app in a submitted state
    var appId = parseInt(Vitro.Workflow.GetApp(NOTIFICATION));
    var patientId = parseInt(myApp.Activity.Properties.Patient(Vitro.PATIENT.ID));
    var epID = parseInt(myApp.Activity.Properties.Episode(Vitro.EPISODE.ID));
    var userId = parseInt(Vitro.Users().Property(Vitro.USER.Id));
    var newAct = Vitro.Workflow.CreateActivity(appId, patientId, epID, userId);
    newAct.Status = Vitro.STATUS.Submitted;
    newAct.Update(userId);
    var user = [dsMessageRecipient.Value(0, "user_name")];
    
    var appName = "Message";
    var body = popupObj.txtMessage.Value() + "\n\n" + GetUserDetails().Normal;

    Vitro.Elements.SendNotification(appActivityId, appName, body, null, user, patientId, epID);
    EnableActions();
    DestroyPopup();
}