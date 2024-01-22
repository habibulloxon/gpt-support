const ADDON_TITLE = "Email GPT support";
const API_KEY = "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";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');

const formatMessageSender = (str) => {
  const parts = str.split('<');
  const contentBeforeAngleBracket = parts[0].trim();
  return contentBeforeAngleBracket.replace(/"/g, '');
}

const formatAssistantResponse = (inputString) => {
  let outputString = inputString.replace(/【.*?】/g, "");

  return outputString
}

const sendSummaryCreationEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let fileLink = settings.docsFileLink

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary created`;
  const template = HtmlService.createTemplateFromFile("summary-creation-notification");

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href=${fileLink}>Click here to view file</a>`

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!")
}

const sendAssistantCreationEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let assistantId = settings.assistantId

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - assistant created`;
  const template = HtmlService.createTemplateFromFile("assistant-creation-notification");

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `${assistantId}`

  htmlOutput = htmlOutput.replace("{{assistant_id}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!")
}

const sendSummaryUpdateEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let fileLink = settings.docsFileLink

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary updated`;
  const template = HtmlService.createTemplateFromFile("summary-update-notification");

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href=${fileLink}>Click here to view file</a>`

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!")
}

const replyUnredMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const currentTimestamp = getCurrentTimeStamp()
  const previousCheckDate = settings.checkTimeStamp;

  const searchQuery = `is:unread after:${previousCheckDate}`;
  const searchedThreads = GmailApp.search(searchQuery);

  searchedThreads.forEach((thread) => {
    let messages = thread.getMessages();
    let messageCount = thread.getMessageCount();
    let lastMessage = messages[messageCount - 1];
    let lastMessageSender = lastMessage.getFrom()

    let formattedMessageSender = formatMessageSender(lastMessageSender)

    let threadId = thread.getId();
    let message = lastMessage.getPlainBody();
    let formattedMessage = message.split('wrote:')[0].split('\n').filter(line => line.trim() !== '').join('\n');

    let assistantResponse = null;

    let assistantThreadId = getAssistantThreadId(threadId);
    addMessageToAssistantThread(assistantThreadId, formattedMessage);
    let runId = runAssistantThread(assistantThreadId, formattedMessageSender);

    let runStatus;
    while ((runStatus = retrieveRunStatus(assistantThreadId, runId)) !== "completed") {
      if (runStatus === "queued") {
        Utilities.sleep(5000); // Add a sleep interval (5 seconds in this case) to avoid constant polling
      }
    }

    assistantResponse = getAssistantMessages(assistantThreadId);

    let formattedAssistantResponse = formatAssistantResponse(assistantResponse)

    lastMessage.reply(formattedAssistantResponse)
    thread.markRead()
  });

  let newSettings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let updatedSettings = {
    ...newSettings,
    checkTimeStamp: currentTimestamp,
  };
  saveSettings(updatedSettings);
};

const getAllMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let maxEmails = settings.emailsLimit

  let allMessages = "";
  let threads = GmailApp.getInboxThreads();
  for (let i = 0; i < threads.length; i++) {
    if (i === parseInt(maxEmails)) {
      break;
    }
    let threadId = threads[i].getId();
    let thread = GmailApp.getThreadById(threadId)
    let threadSubject = thread.getFirstMessageSubject()
    let threadMessages = thread.getMessages()
    let allThreadMessages = ""
    for (let i = 0; i < threadMessages.length; i++) {
      let threadMessage = threadMessages[i]
      let messageText = threadMessage.getPlainBody()
      let formattedMessage = messageText.split('wrote:')[0].split('\n').filter(line => line.trim() !== '').join('\n');
      allThreadMessages += formattedMessage
    }
    allMessages += `Subject: ${threadSubject}\nMessages:\n${allThreadMessages}\n\n`;
    allThreadMessages = "";
  }

  let blobDoc = Utilities.newBlob(allMessages, 'text/plain', `${USERNAME}-emails.txt`);

  sendFileTG(blobDoc)

  return allMessages
}

const compareUpdatedDates = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let docsFileLastUpdatedSettings = settings.lastUpdatedDate;
  let docsFileId = settings.docsFileId

  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(new Date(docsFileLastUpdated).getTime() / 1000)

  if (parseInt(docsFileLastUpdatedSettings) != docsFileLastUpdatedTimeStamp) {
    return true
  } else {
    return false
  }
}

const retrieveSummaryCreationStatus = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));
  let isRunning = settings.summaryCreatingStatus

  return isRunning
}

const retrieveSummaryUpdateStatus = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));
  let isRunning = settings.summaryUpdatingStatus

  return isRunning
}

const checkSummaryCreatingStatus = () => {
  let runStatus;
  while ((runStatus = retrieveSummaryCreationStatus()) !== "finished") {
    if (runStatus === "running") {
      Utilities.sleep(3000)
    }
  }

  deleteTriggers()
}

const checkSummaryUpdateStatus = () => {
  let runStatus;
  while ((runStatus = retrieveSummaryUpdateStatus()) !== "finished") {
    if (runStatus === "running") {
      Utilities.sleep(3000)
    }
  }

  deleteTriggers()
}


const createInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let temporarySettings = { ...settings, summaryCreatingStatus: "running" };
  saveSettings(temporarySettings);

  let docsFile = DocumentApp.create(`${USERNAME}-emails-summary`);
  let docsFileId = docsFile.getId();
  let docsFileLink = DocumentApp.openById(docsFileId).getUrl();
  let inboxEmails = getAllMessages();
  let summarizedEmails = summarization(inboxEmails);

  docsFile.getBody().insertParagraph(0, summarizedEmails);
  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(new Date(docsFileLastUpdated).getTime() / 1000);

  let updatedSettings = {
    ...settings,
    summaryCreatingStatus: "finished",
    isSummaryCreated: true,
    isFileCreated: true,
    docsFileId: docsFileId,
    docsFileLink: docsFileLink,
    lastUpdatedDate: docsFileLastUpdatedTimeStamp
  };
  saveSettings(updatedSettings);

  sendSummaryCreationEmail()
};

const updateInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let temporarySettings = { ...settings, summaryUpdatingStatus: "running" };
  saveSettings(temporarySettings);

  let docsFileId = settings.docsFileId;

  let docsFile = DocumentApp.openById(docsFileId)
  let docBody = docsFile.getBody()

  docBody.clear()

  let inboxEmails = getAllMessages()
  let summarizedEmails = summarization(inboxEmails)

  docBody.insertParagraph(0, summarizedEmails)
  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(new Date(docsFileLastUpdated).getTime() / 1000);

  let updatedSettings = {
    ...settings,
    summaryUpdatingStatus: "finished",
    lastUpdatedDate: docsFileLastUpdatedTimeStamp
  };
  saveSettings(updatedSettings);

  sendSummaryUpdateEmail()
};