const ADDON_TITLE = "Email GPT support";

const API_KEY = "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";

const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');

/*
  TO-DO:

  1. Add time driven function (trigger), function logic: 
  - firstly, check 3 days before and collect all unread and unresponded emails and response them (save timestamp of func execution);
  - this function will run every hour, so on the next run it will take saved timestamp and add it to the search query;

  2. Threads problem, two possible ways:
  - create connection between email thread and assistant thread;
  - every time create new thread for new email and then delete it after generation;
*/
const getCurrentTimeStamp = () => {
  let currentTimestamp = Math.floor(Date.now() / 1000);

  return currentTimestamp
}

const getTimestampThreeDaysAgo = () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const timestampThreeDaysAgo = Math.floor(threeDaysAgo.getTime() / 1000);

  return timestampThreeDaysAgo;
}

const clearSettings = () => {
  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false
  };

  saveSettings(updatedSettings);
}

const temporarySettings = () => {
  let threeDaysAgoTimestamp = getTimestampThreeDaysAgo();
  let updatedSettings = {
    fileId: "",
    assistantId: "",
    isAssistantCreated: false,
    checkTimeStamp: threeDaysAgoTimestamp
  };

  saveSettings(updatedSettings);
}

const getUnreadMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let currentTimestamp = getCurrentTimeStamp()

  const previousCheckDate = settings.checkTimeStamp;

  const searchQuery = `is:unread after:${previousCheckDate}`;
  console.log(searchQuery)
  const searchedThreads = GmailApp.search(searchQuery);

  if(searchedThreads.length === 0){
    console.log("There is no new email")
  }

  let msgs = "";  

  searchedThreads.forEach((thread) => {
    let messages = thread.getMessages();

    messages.forEach((message) => {
      let subject = message.getSubject();
      let sender = message.getFrom();
      let body = message.getPlainBody();

      msgs += `
        Subject: ${subject}
        Sender: ${sender}
        Body: ${body}
      `;

      message.reply("Got your email, Lancelot!")
    });
  });

  const updatedSettings = {
    ...settings,
    checkTimeStamp: currentTimestamp,
  };

  saveSettings(updatedSettings);

  if(msgs !== ""){
    const blobDoc = Utilities.newBlob(msgs, 'text/plain', `${USERNAME}-emails.txt`);
    sendFileTG(blobDoc);
  } else {
    console.log("There is no new email")
  }

  console.log("getUnreadMessages was executed successfully");
  msgs = "";
};

const replyUnreadMessages = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let currentTimestamp = getCurrentTimeStamp()

  const previousCheckDate = settings.checkTimeStamp;

  const searchQuery = `is:unread after:${previousCheckDate}`;
  console.log(searchQuery)
  const searchedThreads = GmailApp.search(searchQuery);

  searchedThreads.forEach((thread) => {
    let messages = thread.getMessages();

    messages.forEach((message) => {

      message.reply("Got your email, Lancelot!")
    });
  });

  const updatedSettings = {
    ...settings,
    checkTimeStamp: currentTimestamp,
  };

  saveSettings(updatedSettings);

  console.log("replyUnreadMessages was executed successfully");
};

const sendFileTG = (file) => {
  let url = "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendDocument"

  let data = {
    'chat_id': '1265546870',
    'document': file
  };

  let options = {
    'method': 'POST',
    'payload': data,
  };

  UrlFetchApp.fetch(url, options);

  console.log("sent")
}

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

const summarization = (input) => {
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
          content: `
            1. Review the emails to understand their content.
            2. Determine the main purpose or topic of each.
            3. Note common elements in structure, tone, and phrases.
            4. Make emphasize on summarization of key information, requests, or questions.
            5. Create a professional email template with placeholders for variable details (e.g., names, dates).
            6. Ensure the template is clear, professional, and easily customizable.
            7. Do not include any names
            8. Skip main topics, because the template will be used with another topics

            Avoid including any sensitive or personal information in the template.
          `,
        },
        {
          role: "user",
          content: input,
        },
      ],
      temperature: 0,
    }),
  };

  const response = JSON.parse(
    UrlFetchApp.fetch(url, options).getContentText(),
  );

  let summarizedText = response.choices[0].message.content
  return summarizedText;
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

  let summarizedMessages = summarization(allMessages)

  let blobDoc = Utilities.newBlob(summarizedMessages, 'text/plain', `${USERNAME}-emails.txt`);

  return blobDoc;
}

const getUploadedFileId = () => {
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

const getCreatedAssistantId = (fileId) => {
  let url = "https://api.openai.com/v1/assistants"

  let headers = {
    Authorization: `Bearer ${API_KEY}`,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v1"
  };

  let payload = {
    name: `${USERNAME}-assistant`,
    description: `Support bot of ${USERNAME}`,
    instructions: "You are a support bot of a company, you need to answer and help people with their questions via email. Your email style, structure and manner always must be the same as in the uploaded file.",
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

const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
}

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
    ScriptApp.newTrigger("getUnreadMessages")
      .timeBased()
      .everyHours(1)
      .create();
  }
};

const createAssistant = () => {
  let threeDaysAgoTimestamp = getTimestampThreeDaysAgo();

  try {
    let fileId = getUploadedFileId();
    let assistantId = getCreatedAssistantId(fileId);

    let settings = {
      fileId: fileId,
      assistantId: assistantId,
      isAssistantCreated: true,
      checkTimeStamp: threeDaysAgoTimestamp
    };

    saveSettings(settings);
    refreshCard();
    installTimeDrivenTrigger();
  } catch (error) {
    console.error("Error creating assistant:", error);
  }
};

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

const runAddon = () => {
  let userProperties = PropertiesService.getUserProperties()
  let settingsTemp = userProperties.getProperty("settingsAPB")
  let settings = JSON.parse(settingsTemp)

  let isAssistantCreated = settings.isAssistantCreated

  let createAction = CardService.newAction().setFunctionName('createAssistant');
  let deleteAction = CardService.newAction().setFunctionName('deleteAssistantAndFile');

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