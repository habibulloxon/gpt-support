const ADDON_TITLE = "Email GPT support";
const API_KEY = "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";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');
const PAST_TIME_STAMP_DAYS = 10

/**
 * Gets current time stamp
 *
 * @returns {integer} - time stamp.
 */
const getCurrentTimeStamp = () => {
  let currentTimestamp = Math.floor(Date.now() / 1000);

  return currentTimestamp
}

/**
 * Gets three days ago time stamp
 *
 * @returns {integer} - three days ago time stamp.
 */
const getPastTimeStamp = () => {
  const newDate = new Date();
  newDate.setDate(newDate.getDate() - PAST_TIME_STAMP_DAYS);

  const pastTimeStamp = Math.floor(newDate.getTime() / 1000);

  return pastTimeStamp;
}

/**
 * Runs thread under specific id
 * 
 * @param {string} threadId - assistant thread id
 * @returns {integer} - run id.
 */
const runAssistantThread = (threadId) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const assistantId = settings.assistantId

  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/runs`;

    let headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1'
    };

    let payload = {
      'assistant_id': assistantId
    };

    let options = {
      'method': 'post',
      'headers': headers,
      'payload': JSON.stringify(payload)
    };

    let response = UrlFetchApp.fetch(url, options);

    let result = JSON.parse(response);

    let runId = result.id;

    return runId;
  } catch (error) {
    // Handle the error as per your requirements
    console.error(`Error in running thread ID: ${threadId}:`, error);
  }
}

/**
 * Retrieves thread run status
 * 
 * @param {string} threadId - assistant thread id
 * @param {string} runId - run id
 * @returns {string} - run status.
 */
const retrieveRunStatus = (threadId, runId) => {
  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;

    let headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1'
    };

    let options = {
      'method': 'get',
      'headers': headers
    };

    let response = UrlFetchApp.fetch(url, options);

    let result = JSON.parse(response);

    let runStatus = result.status;

    return runStatus;
  } catch (error) {
    // Handle the error as per your requirements
    console.error(`Error in retrieving run status ID: ${runId} of thread ID: ${threadId}:`, error);
  }
}

/**
 * Gets assistant messages
 * 
 * @param {string} threadId - assistant thread id
 * @returns {string} - response from assistant.
 */
const getAssistantMessages = (threadId) => {
  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/messages`;
    let headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${API_KEY}`,
      "OpenAI-Beta": "assistants=v1"
    };

    let options = {
      method: "get",
      headers: headers
    };

    let response = UrlFetchApp.fetch(url, options);
    let result = JSON.parse(response);

    let output = result.data[0].content[0].text.value

    return output;
  } catch (error) {
    // Handle the error as per your requirements
    console.error(`Error in getting messages in thread ID: ${threadId}:`, error);
  }
}
/**
 * Gets unread messages and respond them
 */
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

/**
 * Creates new assistant thread
 * 
 * @returns {integer} - created thread id.
 */
const createNewThread = () => {
  try {
    let url = 'https://api.openai.com/v1/threads';

    let headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1'
    };

    let options = {
      'method': 'post',
      'headers': headers,
      'payload': JSON.stringify({})
    };

    let response = UrlFetchApp.fetch(url, options);

    let result = JSON.parse(response);
    let threadId = result.id;

    return threadId;
  } catch (error) {
    console.error('Error in creating new thread:', error);
  }
}

/**
 * Adds message to particullar thread
 * 
 * @param {string} assistantThreadId - assistant thread id.
 * @param {string} message - message from user.
 * @returns {integer} - added message thread id.
 */
const addMessageToAssistantThread = (assistantThreadId, message) => {
  try {
    let url = `https://api.openai.com/v1/threads/${assistantThreadId}/messages`;

    let headers = {
      'Authorization': `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
      'OpenAI-Beta': 'assistants=v1'
    };

    let payload = {
      "role": "user",
      "content": message
    };

    let options = {
      'method': 'post',
      'headers': headers,
      'payload': JSON.stringify(payload)
    };

    let response = UrlFetchApp.fetch(url, options);

    let result = JSON.parse(response);
    let messageId = result.id;

    return messageId;
  } catch (error) {
    console.error(`Error in adding message to thread ID: ${assistantThreadId}:`, error);
  }
}

/**
 * Checks is there connection of email thread and assistant thread in properties
 * 
 * @param {string} emailThreadId - email thread id.
 * @returns {string} - assistant thread id.
 */
const getAssistantThreadId = (emailThreadId) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const settingsThreadIds = settings.threadIds;

  let assistantThread = null

  for (let object of settingsThreadIds) {
    let key = Object.keys(object)[0];
    if (key === emailThreadId) {
      assistantThread = object[key];
      break;
    }
  }

  if (assistantThread === null) {
    let newAssistantThreadId = createNewThread();
    let newThreadIds = [{ [emailThreadId]: newAssistantThreadId }];
    settingsThreadIds.push(...newThreadIds)
    let updatedSettings = {
      ...settings,
      threadIds: settingsThreadIds
    }

    saveSettings(updatedSettings);

    return newAssistantThreadId;
  } else {
    return assistantThread
  }
}

/**
 * Saves settings to user properties
 * 
 * @param {object} settings - settings object.
 */
const saveSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();

    if (settings) {
      userProperties.setProperty("settingsAPB", JSON.stringify(settings));
      console.log(`Settings in ${ADDON_TITLE} were saved successfully.`);
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }

    let temp = userProperties.getProperty("settingsAPB");
    let parsedSettings = JSON.parse(temp);
    console.log("Settings: ", parsedSettings);

    refreshCard()
  } catch (error) {
    console.error("Error saving or retrieving settings:", error);
  }
};

/**
 * summirizes all emails and create template email
 * 
 * @param {string} input - all emails.
 * @returns {string} - summarized template.
 */
const summarization = (input) => {
  try {
    const url = "https://api.openai.com/v1/chat/completions";

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${API_KEY}`,
    };

    const options = {
      headers,
      method: "GET",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        model: "gpt-4-1106-preview", // gpt-3.5-turbo
        messages: [
          {
            role: "system",
            content: ``,
          },
          {
            role: "user",
            content: `Review the gathered Q&A correspondence and provide a summary, emphasizing the anticipation that future iterations of the GPT language model will be tasked with autonomously crafting reply emails to user inquiries in a support assistant role.
            
            ${input}`,
          },
        ],
        temperature: 0,
      }),
    };

    const response = JSON.parse(
      UrlFetchApp.fetch(url, options).getContentText(),
    );

    let summarizedText = response.choices[0].message.content;
    return summarizedText;
  } catch (error) {
    console.error("Error in summarization:", error);
  }
};

/**
 * Gets all emails, summirize them and creates file
 * 
 * @returns {string} - summarized template email file.
 */
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

/**
 * Uploads file to OpenAI
 * 
 * @returns {integer} - uploaded file id.
 */
const getUploadedFileId = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let fileId = settings.docsFileId;
  let docsFile = DocumentApp.openById(fileId)
  let docBody = docsFile.getBody().getText()

  let blobDoc = Utilities.newBlob(docBody, 'text/plain', `${USERNAME}-emails.txt`);

  sendFileTG(blobDoc)

  try {
    let url = "https://api.openai.com/v1/files";


    let headers = {
      Authorization: `Bearer ${API_KEY}`,
    };

    let payload = {
      purpose: "assistants",
      file: blobDoc,
    };

    let response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payload,
      headers: headers,
    });

    let result = JSON.parse(response);
    let fileId = result.id;

    return fileId;
  } catch (error) {
    console.error("Error in uploading file", error);
  }
}

/**
 * Creates assistant in OpenAI
 * @param {string} fileId - base file for creating assistant.
 * @returns {integer} - create assistant id.
 */
const getCreatedAssistantId = (fileId) => {
  try {
    let url = "https://api.openai.com/v1/assistants";

    let headers = {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v1",
    };

    let payload = {
      name: `${USERNAME}-assistant`,
      description: `Support bot of ${USERNAME}`,
      instructions: "You are a support bot of a company, you need to answer and help people with their questions via email. Your email style, structure and manner always must be the same as in the uploaded file.",
      tools: [{ "type": "retrieval" }],
      model: "gpt-4-1106-preview",
      file_ids: [`${fileId}`],
    };

    let payloadJson = JSON.stringify(payload);

    let response = UrlFetchApp.fetch(url, {
      method: "post",
      payload: payloadJson,
      headers: headers,
    });

    let result = JSON.parse(response);
    assistantId = result.id;

    return assistantId;
  } catch (error) {
    console.error("Error in creating assistant", error);
  }
}

/**
 * Refreshes card
 */
const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
}

/**
 * Installs time driven trigger to answer emails automatically every hour
 */
const installTimeDrivenTrigger = () => {
  const triggers = ScriptApp.getProjectTriggers();
  let timeDrivenTriggerExists = false;

  for (let i = 0; i < triggers.length; i++) {
    if (triggers[i].getEventType() === ScriptApp.EventType.CLOCK) {
      timeDrivenTriggerExists = true;
      break;
    }
  }

  if (!timeDrivenTriggerExists) {
    ScriptApp.newTrigger("replyUnredMessages")
      .timeBased()
      .everyHours(1)
      .create();
  }

  return timeDrivenTriggerExists
};

/**
 * Runs two functions getUploadedFileId and getCreatedAssistantId, then creates assistant and saves all stuff in properties.
 */
const createAssistant = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  try {
    let fileId = getUploadedFileId();
    let assistantId = getCreatedAssistantId(fileId);

    let updatedSettings = {
      ...settings,
      fileId: fileId,
      assistantId: assistantId,
    }
    saveSettings(updatedSettings)

    refreshCard();
  } catch (error) {
    console.error("Error in creating assistant and file:", error);
  }
};

/**
 * Deletes assistant and file
 */
const deleteAssistantAndFile = () => {
  // getting user properties:
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const fileId = settings.fileId
  const assistantId = settings.assistantId

  // url's to use
  let fileUrl = `https://api.openai.com/v1/files/${fileId}`
  let assistantUrl = `https://api.openai.com/v1/assistants/${assistantId}`

  // headers and options for assistant:
  const assistantHeaders = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v1"
  };

  const assistantOptions = {
    "method": "delete",
    "headers": assistantHeaders
  };

  // deleting assistant:
  try {
    UrlFetchApp.fetch(assistantUrl, assistantOptions)
    console.log(`Assistant: ${assistantId} was deleted`)
  } catch (error) {
    console.error("Error in deleting assistant: ", error);
  }

  // headers and options for file:
  const fileHeaders = {
    "Authorization": `Bearer ${API_KEY}`
  };

  const fileOptions = {
    "method": "delete",
    "headers": fileHeaders
  };

  // deleting file:
  try {
    UrlFetchApp.fetch(fileUrl, fileOptions)
    console.log(`File: ${fileId} was deleted`)
  } catch (error) {
    console.error("Error in deleting file: ", error);
  }

  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false
  };

  saveSettings(updatedSettings);
  refreshCard();
}

const setScrappingLimit = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let inputValue = e.formInput.emails_limit_input

  let updatedSettings = {
    ...settings,
    emailsLimit: inputValue
  }

  saveSettings(updatedSettings)
};

const createSettings = () => {
  let pastTimestamp = getPastTimeStamp();

  let userProperties = PropertiesService.getUserProperties();
  let settings = userProperties.getProperty("settingsAPB");
  let isUserPropsExist = settings !== null && settings !== undefined;

  let updatedSettings = {}

  if (!isUserPropsExist) {
    updatedSettings = {
      isSummaryCreated: false,
      fileId: "",
      assistantId: "",
      isAssistantCreated: false,
      threadIds: [],
      emailsLimit: 2,
      isFileCreated: false,
      docsFileId: "",
      docsFileLink: "",
      lastUpdatedDate: "",
      isFileUpdated: false,
      checkTimeStamp: pastTimestamp
    }
    saveSettings(updatedSettings);
  }
}

/**
 * Creates sidebar in Gmail
 */

const installMinuteDrivenTrigger = () => {
  ScriptApp.newTrigger("createInboxSummary")
    .timeBased()
    .everyMinutes(5)
    .create();

  createInboxSummary()
};

const deleteTriggers = () => {
  const allTriggers = ScriptApp.getProjectTriggers();
  allTriggers.forEach(trigger => ScriptApp.deleteTrigger(trigger));
};

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

const updateInboxSummaryAction = () => {
  let isFileChanged = compareUpdatedDates()

  if (isFileChanged) {
    const confirmAction = CardService.newAction().setFunctionName('confirmAction');
    const denyAction = CardService.newAction().setFunctionName('denyAction');

    const confirmButton = CardService.newTextButton()
      .setText("Yes")
      .setOnClickAction(confirmAction);

    const denyButton = CardService.newTextButton()
      .setText("No")
      .setOnClickAction(denyAction);

    const secondCardSection = CardService.newCardSection()
      .addWidget(confirmButton)
      .addWidget(denyButton);

    var secondCard = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle('Another Card'))
      .addSection(secondCardSection)
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('This is another card.')))
      .build();

    var nav = CardService.newNavigation().pushCard(secondCard);

    return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
  } else {
    const userProperties = PropertiesService.getUserProperties();
    const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

    let fileId = settings.docsFileId;
    let docsFile = DocumentApp.openById(fileId);

    let docBody = docsFile.getBody();

    docBody.clear()

    let inboxEmails = getAllMessages();
    let summirizedEmails = summarization(inboxEmails)

    docBody.insertParagraph(0, summirizedEmails);
  }
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

const confirmAction = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let fileId = settings.docsFileId;
  let docsFile = DocumentApp.openById(fileId);

  let docBody = docsFile.getBody();

  docBody.clear()

  let inboxEmails = getAllMessages();
  let summirizedEmails = summarization(inboxEmails)

  docBody.insertParagraph(0, summirizedEmails);

  var nav = CardService.newNavigation().popToRoot();

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

const denyAction = () => {
  var nav = CardService.newNavigation().popToRoot();

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}

const runAddon = () => {
  createSettings();
  installMinuteDrivenTrigger();
  const divider = CardService.newDivider();

  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const cardSection = CardService.newCardSection();

  const isFileCreated = settings.isFileCreated;
  const setScrappingLimitAction = CardService.newAction().setFunctionName('setScrappingLimit');
  const updateInboxSummaryAction = CardService.newAction().setFunctionName("updateInboxSummaryAction")
  const createAssistantAction = CardService.newAction().setFunctionName("createAssistant")
  const startAssistantAction = CardService.newAction().setFunctionName("installTimeDrivenTrigger")
  const stopAssistantAction = CardService.newAction().setFunctionName("deleteTimeDrivenTrigger")

  if (!isFileCreated) {

  } else {
    const emailsLimit = settings.emailsLimit;
    const fileLink = settings.docsFileLink;

    const fileUrlText = CardService.newTextParagraph()
      .setText(`Your file was created`);
    cardSection.addWidget(fileUrlText);

    const viewFileButton = CardService.newTextButton()
      .setText("View File")
      .setOpenLink(CardService.newOpenLink()
        .setUrl(`${fileLink}`)
        .setOpenAs(CardService.OpenAs.FULL_SIZE));
    cardSection.addWidget(viewFileButton);

    cardSection.addWidget(divider);

    const limitInput = CardService.newTextInput()
      .setFieldName("emails_limit_input")
      .setTitle("Enter emails limit")
      .setHint("by default it is 1000")
      .setValue(`${emailsLimit}`);
    cardSection.addWidget(limitInput);

    const setLimitButton = CardService.newTextButton()
      .setText("Set limit")
      .setOnClickAction(setScrappingLimitAction);
    cardSection.addWidget(setLimitButton);

    cardSection.addWidget(divider);

    const updateSummaryFileBtn = CardService.newTextButton()
      .setText("Update summary file")
      .setOnClickAction(updateInboxSummaryAction);
    cardSection.addWidget(updateSummaryFileBtn);

    cardSection.addWidget(divider);

    const assistantId = settings.assistantId;
    if (assistantId === "") {
      const createAssistantButton = CardService.newTextButton()
        .setText("Create Assistant")
        .setOnClickAction(createAssistantAction);
      cardSection.addWidget(createAssistantButton);
    } else {
      const isAssistantStarted = installTimeDrivenTrigger()
      if (isAssistantStarted) {
        const stopAssistantButton = CardService.newTextButton()
          .setText("Stop assistant")
          .setOnClickAction(stopAssistantAction);
        cardSection.addWidget(stopAssistantButton);
      } else {
        const startAssistantButton = CardService.newTextButton()
          .setText("Start assistant")
          .setOnClickAction(startAssistantAction);
        cardSection.addWidget(startAssistantButton);
      }

    }
  }

  const card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle("Actions:"))
    .addSection(cardSection)
    .build();

  return card;
}