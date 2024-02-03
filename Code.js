const ADDON_TITLE = "Email GPT support";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, "-");

const formatMessageSender = (str) => {
  const parts = str.split("<");
  const contentBeforeAngleBracket = parts[0].trim();
  return contentBeforeAngleBracket.replace(/"/g, "");
};

const formatAssistantResponse = (inputString) => {
  let outputString = inputString.replace(/【.*?】/g, "");
  return outputString;
};

const sendSummaryAndAssistantCreationEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;
  let assistantId = addonSettings.assistantId;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary created`;
  const template = HtmlService.createTemplateFromFile(
    "creation-notification.html"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `
    <p>Summary file</p>
    <a href=${fileLink}>Click here to view file</a>

    <p>Assistant ID:</p>
    <p>${assistantId}</p>
  `;

  htmlOutput = htmlOutput.replace("{{content}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};

const sendSummaryUpdateEmail = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let fileLink = addonSettings.docsFileLink;

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary updated`;
  const template = HtmlService.createTemplateFromFile(
    "summary-update-notification"
  );

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href=${fileLink}>Click here to view file</a>`;

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!");
};

const convertDateToTimeStamp = (date) => {
  let dateObject = new Date(date);
  let parsedDateObject = Date.parse(dateObject);
  let timeStamp = Math.floor(parsedDateObject / 1000);

  return timeStamp;
};

const replyUnredMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let autoReply = userSettings.autoReply;

  if (autoReply === "true") {
    const previousCheckDate = settings.checkTimeStamp;

    const searchQuery = `is:unread after:${previousCheckDate}`;
    const searchedThreads = GmailApp.search(searchQuery);

    let lastMessageTimeStamp;

    searchedThreads.forEach((thread) => {
      let messages = thread.getMessages();
      let messageCount = thread.getMessageCount();
      let lastMessage = messages[messageCount - 1];
      let lastMessageSender = lastMessage.getFrom();
      let lastMessageDate = lastMessage.getDate();

      lastMessageTimeStamp = convertDateToTimeStamp(lastMessageDate);

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

      lastMessage.reply(formattedAssistantResponse);
      thread.markRead();
    });

    let newAddonSettings = JSON.parse(
      userProperties.getProperty("addonSettings")
    );

    let updatedAddonSettings = {
      ...newAddonSettings,
      checkTimeStamp: lastMessageTimeStamp,
    };
    saveAddonSettings(updatedAddonSettings);
  }
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

const compareUpdatedDates = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let docsFileLastUpdatedSettings = addonSettings.lastUpdatedDate;
  let docsFileId = addonSettings.docsFileId;

  if (docsFileId) {
    let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
    let docsFileLastUpdatedTimeStamp = Math.floor(
      new Date(docsFileLastUpdated).getTime() / 1000
    );

    console.log("docsFileLastUpdatedTimeStamp", docsFileLastUpdatedTimeStamp);
    console.log("docsFileLastUpdatedSettings", docsFileLastUpdatedSettings);

    let difference = parseInt(docsFileLastUpdatedSettings) - docsFileLastUpdatedTimeStamp;
    console.log(difference)

    if (parseInt(docsFileLastUpdatedSettings) != docsFileLastUpdatedTimeStamp) {
      return true;
    } else {
      return false;
    }
  }
};

function test() {
  let status = compareUpdatedDates()
  console.log(status)
}

const testParagraph = () => {
  let lorem =
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Aenean erat lorem, laoreet iaculis lorem ut, pharetra placerat tortor. Phasellus consectetur, lectus non ultricies tincidunt, metus velit convallis sem, sed tincidunt sapien massa eu nulla. Sed sed posuere dui. Vestibulum suscipit, arcu in scelerisque ornare, orci metus pellentesque enim, eget volutpat elit quam eget tortor. In eleifend ipsum vestibulum arcu congue posuere. Mauris mattis mauris nisi, eget aliquet velit mattis et. Praesent posuere odio at fermentum tincidunt. Nam urna augue, consectetur ac egestas non, dignissim quis turpis.";

  return lorem;
};

const createInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let docsFile = DocumentApp.create(`${USERNAME}-emails-summary`);
  let docsFileId = docsFile.getId();
  let docsFileLink = DocumentApp.openById(docsFileId).getUrl();

  // let inboxEmails = getAllMessages();
  // let summarizedEmails = summarization(inboxEmails);

  let placeholderText = testParagraph();

  docsFile.getBody().insertParagraph(0, placeholderText);
  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(
    new Date(docsFileLastUpdated).getTime() / 1000
  );

  let updatedAddonSettings = {
    ...addonSettings,
    docsFileId: docsFileId,
    docsFileLink: docsFileLink,
    lastUpdatedDate: docsFileLastUpdatedTimeStamp,
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isSummaryCreated: true,
  };
  saveBooleanSettings(updatedBooleanSettings);

  Utilities.sleep(2000);

  createAssistant();

  sendSummaryAndAssistantCreationEmail();

  installTimeDrivenTrigger()

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const updateInboxSummary = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(userProperties.getProperty("booleanSettings"));

  let docsFileId = addonSettings.docsFileId;

  let docsFile = DocumentApp.openById(docsFileId);
  let docBody = docsFile.getBody();

  docBody.clear();

  let inboxEmails = getAllMessages();
  let summarizedEmails = summarization(inboxEmails);

  docBody.insertParagraph(0, summarizedEmails);
  let docsFileLastUpdated = DriveApp.getFileById(docsFileId).getLastUpdated();
  let docsFileLastUpdatedTimeStamp = Math.floor(
    new Date(docsFileLastUpdated).getTime() / 1000
  );

  let updatedAddonSettings = {
    ...addonSettings,
    updateFunctionStatus: "finished",
    lastUpdatedDate: docsFileLastUpdatedTimeStamp,
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isFileUpdated: true
  }
  saveBooleanSettings(updatedBooleanSettings)

  sendSummaryUpdateEmail();
};
