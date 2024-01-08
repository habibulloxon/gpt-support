const ADDON_TITLE = "Email GPT support";

const API_KEY = "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";

const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');

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
  } catch (error) {
    console.error("Error saving or retrieving settings:", error);
  }
};

const getAllMessagesFile = () => {
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
  }

  let blobDoc = Utilities.newBlob(allMessages, 'text/plain', `${USERNAME}-emails.txt`);

  return blobDoc;
}

const uploadAllMessagesFile = () => {
  let url = "https://api.openai.com/v1/files"
  let messagesFile = getAllMessagesFile()

  let headers = {
    Authorization: `Bearer ${API_KEY}`
  }

  let payload = {
    purpose: "assistants",
    file: messagesFile
  }

  let response = UrlFetchApp.fetch(url, {
    method: "post",
    payload: payload,
    headers: headers
  });

  let result = JSON.parse(response)
  let fileId = result.id

  return fileId;
}

const createOpenAiAssistant = (fileId) => {
  let url = "https://api.openai.com/v1/assistants"

  let headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v1"
  };

  let payload = {
    name: `${USERNAME}-assistant`,
    description: `Support bot of ${USERNAME}`,
    instructions: "You are support bot. Your responses style, structure and manner have to be the same as in uploaded file",
    tools: [{ "type": "retrieval" }],
    model: "gpt-4-1106-preview",
    file_ids: [`${fileId}`]
  };

  let payloadJson = JSON.stringify(payload);

  let response = UrlFetchApp.fetch(url, {
    method: "post",
    payload: payloadJson,
    headers: headers
  });

  let result = JSON.parse(response)
  assistantId = result.id

  return assistantId
}

const createAssistant = () => {
  try {
    let fileId = uploadAllMessagesFile();
    let assistantId = createOpenAiAssistant(fileId);

    let settings = {
      fileId: fileId,
      assistantId: assistantId,
      isAssistantCreated: true
    };

    saveSettings(settings);
  } catch (error) {
    console.error("Error creating assistant:", error);
  }
};

function deleteFile() {
  const userProperties = PropertiesService.getUserProperties();
  const settingsTemp = userProperties.getProperty("settingsAPB");
  const settings = JSON.parse(settingsTemp);

  let url = `https://api.openai.com/v1/assistants/${settings.assistantId}/files/${settings.fileId}`;

  let headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v1"
  };

  let options = {
    "method": "delete",
    "headers": headers
  };

  UrlFetchApp.fetch(url, options);

  console.log(`File: ${settings.fileId} was deleted`);
  deleteAssistant(settings.assistantId)
}

function deleteAssistant(assistantId) {
  const url = `https://api.openai.com/v1/assistants/${assistantId}`;

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v1"
  };

  const options = {
    "method": "delete",
    "headers": headers
  };

  if (isFileDeleted) {
    const response = UrlFetchApp.fetch(url, options);

    let result = JSON.parse(response)

    if (result.deleted === true) {
      console.log(`Assistant: ${settings.assistantId} was deleted`);
    } else {
      console.error(`Error deleting assistant: ${settings.assistantId}, Status Code: ${response.getResponseCode()}`);
    }
  }

  const updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false
  };

  saveSettings(updatedSettings);

  console.log("Settings updated");
}

const deleteOpenAiAssistant = () => {
  // getting user properties:
  const userProperties = PropertiesService.getUserProperties();
  const settingsTemp = userProperties.getProperty("settingsAPB");
  const settings = JSON.parse(settingsTemp);

  const fileId = settings.fileId
  const assistantId = settings.assistantId

  // url's to use
  let fileUrl = `https://api.openai.com/v1/assistants/${assistantId}/files/${fileId}`
  let assistantUrl = `https://api.openai.com/v1/assistants/${assistantId}`

  // headers and options:
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${API_KEY}`,
    "OpenAI-Beta": "assistants=v1"
  };

  const options = {
    "method": "delete",
    "headers": headers
  };

  // deleting file:
  try {
    UrlFetchApp.fetch(fileUrl, options)
  } catch (error) {
    console.error("Error in deleting file: ", error);
  }

  // deleting assistant:
  try {
    UrlFetchApp.fetch(assistantUrl, options)
  } catch (error) {
    console.error("Error in deleting assistant: ", error);
  }
}

const getEmailsAfterTimestamp = () => {
  let unixTimestamp = 1704631140;

  let searchQuery = `is:unread after:${unixTimestamp}`;

  let searchedThreads = GmailApp.search(searchQuery);

  searchedThreads.forEach((thread) => {
    let messages = thread.getMessages();

    messages.forEach((message) => {
      let subject = message.getSubject();
      let sender = message.getFrom();
      let body = message.getPlainBody();

      Logger.log('Subject: ' + subject);
      Logger.log('Sender: ' + sender);
      Logger.log('Body: ' + body);
      Logger.log('--------------');
    });
  });
};


const myGmailFunction = () => {
  let userProperties = PropertiesService.getUserProperties()
  let settingsTemp = userProperties.getProperty("settingsAPB")
  let settings = JSON.parse(settingsTemp)

  let isAssistantCreated = settings.isAssistantCreated

  let createAction = CardService.newAction().setFunctionName('createAssistant');
  let deleteAction = CardService.newAction().setFunctionName('deleteAssistant');

  let cardSection = CardService.newCardSection()
    .setHeader("Section header");

  if (!isAssistantCreated) {
    let createButton = CardService.newTextButton()
      .setText("Create assistant")
      .setOnClickAction(createAction);

    cardSection.addWidget(createButton);
  } else {
    let deleteButton = CardService.newTextButton()
      .setText("Delete assistant")
      .setOnClickAction(deleteAction);

    cardSection.addWidget(deleteButton);
  }

  let textParagraph = CardService.newTextParagraph()
    .setText("This is some informative text.");

  cardSection.addWidget(textParagraph);

  let card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle("Buttons:"))
    .addSection(cardSection)
    .build();

  return card;
}