const ADDON_TITLE = "Email GPT support";
const API_KEY = "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";
const USER_EMAIL = Session.getActiveUser().getEmail();
const USERNAME = USER_EMAIL.split("@")[0].toLowerCase().replace(/\./g, '-');

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
const getTimestampThreeDaysAgo = () => {
  const threeDaysAgo = new Date();
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const timestampThreeDaysAgo = Math.floor(threeDaysAgo.getTime() / 1000);

  return timestampThreeDaysAgo;
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
    let message = lastMessage.getRawContent();

    let assistantResponse = null;

    let assistantThreadId = getAssistantThreadId(threadId);
    addMessageToAssistantThread(assistantThreadId, message);
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

/**
 * Gets all emails, summirize them and creates file
 * 
 * @returns {string} - summarized template email file.
 */
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

/**
 * Uploads file to OpenAI
 * 
 * @returns {integer} - uploaded file id.
 */
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

/**
 * Creates assistant in OpenAI
 * @param {string} fileId - base file for creating assistant.
 * @returns {integer} - create assistant id.
 */
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
};

/**
 * Runs two functions getUploadedFileId and getCreatedAssistantId, then creates assistant and saves all stuff in properties.
 */
const createAssistant = () => {
  let threeDaysAgoTimestamp = getTimestampThreeDaysAgo();

  try {
    let fileId = getUploadedFileId();
    let assistantId = getCreatedAssistantId(fileId);

    let settings = {
      fileId: fileId,
      assistantId: assistantId,
      isAssistantCreated: true,
      threadIds: [],
      checkTimeStamp: threeDaysAgoTimestamp
    };

    saveSettings(settings);
    refreshCard();
    // installTimeDrivenTrigger();
  } catch (error) {
    console.error("Error creating assistant:", error);
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

/**
 * Creates sidebar in Gmail
 */
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