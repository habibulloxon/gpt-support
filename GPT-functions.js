/**
 * Summirizes all emails and create template email
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
 * Uploads file to OpenAI
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
  let url = "https://api.openai.com/v1/assistants";
  try {
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
 * Creates assistant with file in OpenAI
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
    installTimeDrivenTrigger()
    refreshCard();
  } catch (error) {
    console.error("Error in creating assistant and file:", error);
  }
};

/**
 * Creates new assistant thread
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
 * Checks is there connection of email thread and assistant thread in properties
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
 * Adds message to particullar thread
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
    console.error(`Error in running thread ID: ${threadId}:`, error);
  }
}

/**
 * Retrieves thread run status
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
    console.error(`Error in retrieving run status ID: ${runId} of thread ID: ${threadId}:`, error);
  }
}

/**
 * Gets assistant messages
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
    console.error(`Error in getting messages in thread ID: ${threadId}:`, error);
  }
}

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
  deleteTriggers()
  refreshCard();
}
