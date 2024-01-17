const ADDON_TITLE = "Email GPT support";
const API_KEY = "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";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');

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

    let threadId = thread.getId();
    let message = lastMessage.getPlainBody();
    let formattedMessage = message.split('wrote:')[0].split('\n').filter(line => line.trim() !== '').join('\n');

    let assistantResponse = null;

    let assistantThreadId = getAssistantThreadId(threadId);
    addMessageToAssistantThread(assistantThreadId, formattedMessage);
    let runId = runAssistantThread(assistantThreadId);

    let runStatus;
    while ((runStatus = retrieveRunStatus(assistantThreadId, runId)) !== "completed") {
      if (runStatus === "queued") {
        Utilities.sleep(5000); // Add a sleep interval (5 seconds in this case) to avoid constant polling
      }
    }

    assistantResponse = getAssistantMessages(assistantThreadId);

    lastMessage.reply(assistantResponse)
  });

  const updatedSettings = {
    ...settings,
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

    if (i === parseInt(maxEmails)) {
      break;
    }
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

const checkIsSummaryCreated = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let isSummaryCreated = settings.isSummaryCreated

  while(isSummaryCreated != true) {
    Utilities.sleep(5000);
    isSummaryCreated = settings.isSummaryCreated
  }
}

const createInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

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
    isSummaryCreated: true,
    isFileCreated: true,
    docsFileId: docsFileId,
    docsFileLink: docsFileLink,
    lastUpdatedDate: docsFileLastUpdatedTimeStamp
  }
  saveSettings(updatedSettings);
}