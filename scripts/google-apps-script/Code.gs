/**
 * Google Apps Script for "College Quries form"
 * Form URL: https://docs.google.com/forms/d/e/1FAIpQLSfySrK4U9_TQdbxuKSGxDymYTRcJQTEpOV-cMFMHztboQVqcQ/viewform
 *
 * This script runs inside the Google Sheet linked to your Google Form.
 * When a student submits the form, it automatically sends a webhook POST request
 * to your backend endpoint: /internal/forms/responses/sync
 */

// =========================================================================
// CONFIGURATION
// Replace with your actual backend public URL (must be HTTPS)
// Example: "https://helpdesk.institution.edu" or your ngrok/tunnel URL
// =========================================================================
var BACKEND_BASE_URL = "https://<YOUR-BACKEND-DOMAIN>"; // Do NOT include trailing slash
var SYNC_ENDPOINT = BACKEND_BASE_URL + "/internal/forms/responses/sync";

/**
 * Event handler triggered when a new form submission is received.
 * Set this up as an "On form submit" installable trigger.
 *
 * @param {Object} e - The form submit event object
 */
function onFormSubmit(e) {
  try {
    Logger.log("Received new form submission event: " + JSON.stringify(e));

    var name = "";
    var collegeEmail = "";
    var idNumber = "";
    var department = "";
    var studentPhone = "";
    var queries = "";
    var issues = "";
    var referenceId = "";

    // Extract values matching your form's exact questions
    if (e && e.namedValues) {
      name = e.namedValues["Name"] ? e.namedValues["Name"][0].trim() : "";
      collegeEmail = e.namedValues["College Email"] ? e.namedValues["College Email"][0].trim() : "";
      idNumber = e.namedValues["ID Number"] ? e.namedValues["ID Number"][0].trim() : "";
      department = e.namedValues["Department"] ? e.namedValues["Department"][0].trim() : "";
      studentPhone = e.namedValues["Student Phone number"] ? e.namedValues["Student Phone number"][0].trim() : "";
      queries = e.namedValues["Quries"] ? e.namedValues["Quries"][0].trim() : "";
      issues = e.namedValues["Issues"] ? e.namedValues["Issues"][0].trim() : "";

      // Check if "Reference Number" field is present or included in queries/issues
      if (e.namedValues["Reference Number"] && e.namedValues["Reference Number"][0]) {
        referenceId = e.namedValues["Reference Number"][0].trim();
      } else {
        // Look for HOD-REQ pattern inside queries or issues text if student typed it there
        var refMatch = (queries + " " + issues).match(/HOD-REQ-\d{8}-[A-F0-9]+/i);
        if (refMatch) {
          referenceId = refMatch[0].toUpperCase();
        }
      }
    }

    // Unique response ID based on timestamp and row number
    var row = e && e.range ? e.range.getRow() : new Date().getTime();
    var formResponseId = "GF-RESP-" + new Date().getTime() + "-R" + row;

    Logger.log("Parsed submission -> Name: " + name + " | Phone: " + studentPhone + " | Ref: " + referenceId);

    // Prepare payload for backend API
    var payload = {
      referenceId: referenceId,
      formResponseId: formResponseId,
      phone: studentPhone,
      name: name,
      email: collegeEmail,
      idNumber: idNumber,
      department: department,
      query: queries + (issues ? " | Issues: " + issues : "")
    };

    var headers = {
      "Content-Type": "application/json",
      "Bypass-Tunnel-Reminder": "true"
    };

    var options = {
      method: "post",
      contentType: "application/json",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };

    // Send HTTP POST request to backend
    var response = UrlFetchApp.fetch(SYNC_ENDPOINT, options);
    var responseCode = response.getResponseCode();
    var responseBody = response.getContentText();

    Logger.log("Backend response code: " + responseCode);
    Logger.log("Backend response body: " + responseBody);

    if (responseCode === 200) {
      Logger.log("Successfully synchronized form response: " + formResponseId);
    } else {
      Logger.log("Warning: Backend returned status " + responseCode + " - " + responseBody);
    }
  } catch (error) {
    Logger.log("Exception in onFormSubmit: " + error.toString());
  }
}

/**
 * Quick Test function to verify connectivity with your backend
 */
function testSync() {
  var testPayload = {
    referenceId: "HOD-REQ-TEST-0001",
    formResponseId: "TEST-RESPONSE-ID-123",
    phone: "919876543210",
    name: "Test Student"
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(testPayload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(SYNC_ENDPOINT, options);
  Logger.log("Status: " + response.getResponseCode());
  Logger.log("Body: " + response.getContentText());
}
