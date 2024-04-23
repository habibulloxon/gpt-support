const createVectorStore = (fileId) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  const apiKey = userSettings.openAiApiKey;
  const companyName = userSettings.companyName;

  try {
    let url = "https://api.openai.com/v1/vector_stores";

    let headers = {
      "Content-Type": "application/json",
      Authorization: "Bearer " + apiKey,
      "OpenAI-Beta": "assistants=v2",
    }

    let payload = {
      name: `${companyName}-vector-store`,
      file_ids: [fileId],
    }

    let options = {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(payload)
    }

    let response = JSON.parse(UrlFetchApp.fetch(url, options));
    let vectorStoreId = response.id;
    return vectorStoreId;
  } catch {
    console.error("error in creating vector store")
  }
}

const updateAssistantFile = (apiKey, vectoreStoreId, assistantId) => {
  let url = `https://api.openai.com/v1/assistants/${assistantId}`;

  let headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + apiKey,
    "OpenAI-Beta": "assistants=v2",
  };

  let payload = {
    tool_resources: {
      file_search: {
        vector_store_ids: [`${vectoreStoreId}`]
      }
    },
  };

  let options = {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(payload),
  };

  UrlFetchApp.fetch(url, options);
};

const deleteVectorStore = (vectorStoreId, apiKey) => {
  let url = `https://api.openai.com/v1/vector_stores/${apiKey}`;

  let headers = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  }; 

  let options = {
    method: "DELETE", 
    headers: headers
  };

  UrlFetchApp.fetch(url, options);
}

const deleteFile = (fileId, apiKey) => {
  let url = `https://api.openai.com/v1/files/${fileId}`;
  let headers = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };

  let options = {
    method: "DELETE",
    headers: headers,
  };

  UrlFetchApp.fetch(url, options);
};

const deleteAssistantFile = (assistantId, fileId, apiKey) => {
  let url = `https://api.openai.com/v1/assistants/${assistantId}/files/${fileId}`;
  let headers = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v2",
  };

  let options = {
    method: "DELETE",
    headers: headers,
  };

  UrlFetchApp.fetch(url, options);
};

const updateAssistantInstructions = () => {
  const userProperties = PropertiesService.getUserProperties();

  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  const apiKey = userSettings.openAiApiKey;
  const assistantId = addonSettings.assistantId;
  const companyName = userSettings.companyName;
  const name = userSettings.assistantName;
  const fileId = addonSettings.fileId;

  let url = `https://api.openai.com/v1/assistants/${assistantId}`;

  let headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v2",
  };

  let payload = {
    instructions: `You are a Support Agent in ${companyName} and your name is ${name}, you need to answer and help people with their questions via email. Your email style, structure and manner always must be the same as in the uploaded file.`,
    tools: [{ type: "retrieval" }],
    model: "gpt-4-turbo",
    file_ids: [`${fileId}`],
  };

  let options = {
    method: "post",
    contentType: "application/json",
    headers: headers,
    payload: JSON.stringify(payload),
  };

  let response = UrlFetchApp.fetch(url, options);
  console.log(JSON.stringify(response));
};

/**
 * Checks is API_KEY proper or not.
 *
 * @param {string} a - api key.
 * @returns {boolean} true - valid | false - invalid.
 */
const checkIsApiKeyProper = (apiKey) => {
  const url = "https://api.openai.com/v1/chat/completions";

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
  };

  const options = {
    headers,
    method: "GET",
    muteHttpExceptions: true,
    payload: JSON.stringify({
      model: "gpt-4-turbo",
      messages: [
        {
          role: "system",
          content: `Answer very shortly`,
        },
        {
          role: "user",
          content: "2+2=?",
        },
      ],
      temperature: 0,
    }),
  };

  const response = JSON.parse(UrlFetchApp.fetch(url, options));
  const isValid = response.hasOwnProperty("error");

  return !isValid;
};

const summarization = (input) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let apiKey = userSettings.openAiApiKey;

  try {
    const url = "https://api.openai.com/v1/chat/completions";
    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    };
    const options = {
      headers,
      method: "GET",
      muteHttpExceptions: true,
      payload: JSON.stringify({
        model: "gpt-4-turbo", // gpt-4-turbo
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
    const response = JSON.parse(UrlFetchApp.fetch(url, options));

    console.log("responses", response);

    let summarizedText = response["choices"][0]["message"]["content"];
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

  let addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  let userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let fileId = addonSettings.docsFileId;
  let apiKey = userSettings.openAiApiKey;

  let docsFile = DocumentApp.openById(fileId);
  let docBody = docsFile.getBody().getText();
  let blobDoc = Utilities.newBlob(
    docBody,
    "text/plain",
    `${USERNAME}-emails.txt`
  );
  sendFileTG(blobDoc);

  try {
    let url = "https://api.openai.com/v1/files";
    let headers = {
      Authorization: `Bearer ${apiKey}`,
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
};

/**
 * Creates assistant in OpenAI
 * @param {string} fileId - base file for creating assistant.
 * @returns {integer} - create assistant id.
 */
const getCreatedAssistantId = (vectoreStoreId) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let companyName = userSettings.companyName;
  let apiKey = userSettings.openAiApiKey;
  let name = userSettings.assistantName;

  let url = "https://api.openai.com/v1/assistants";
  try {
    let headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    };
    let payload = {
      name: `${USERNAME}-assistant`,
      description: `Support bot of ${USERNAME}`,
      instructions: `You are a Support Agent in ${companyName} and your name is ${name}, you need to answer and help people with their questions via email. Your email style, structure and manner always must be the same as in the uploaded file.`,
      model: "gpt-4-turbo",
      tools: [{ type: "file_search" }],
      tool_resources: {
        file_search: {
          vector_store_ids: [`${vectoreStoreId}`]
        }
      },
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
};

/**
 * Creates assistant with file in OpenAI
 */
const createAssistant = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  try {
    let fileId = getUploadedFileId();
    let vectorStoreId = createVectorStore(fileId);
    let assistantId = getCreatedAssistantId(vectorStoreId);

    let updatedAddonSettings = {
      ...addonSettings,
      mainFunctionStatus: "finished",
      fileId: fileId,
      vectorStoreId: vectorStoreId,
      assistantId: assistantId,
    };
    saveAddonSettings(updatedAddonSettings);

    let updatedBooleanSettings = {
      ...booleanSettings,
      isAssistantCreated: true,
    };
    saveBooleanSettings(updatedBooleanSettings);

    // installTimeDrivenTrigger();
  } catch (error) {
    console.error("Error in creating assistant and file:", error);
  }
};

/**
 * Creates new assistant thread
 * @returns {integer} - created thread id.
 */
const createNewThread = () => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let apiKey = userSettings.openAiApiKey;
  let maxRetries = 10; // Set the maximum number of retries
  let attempt = 0;

  while (attempt < maxRetries) {
    try {
      let url = "https://api.openai.com/v1/threads";
      let headers = {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      };
      let options = {
        method: "post",
        headers: headers,
        payload: JSON.stringify({}),
      };
      let response = UrlFetchApp.fetch(url, options);
      let result = JSON.parse(response);
      let status = result.hasOwnProperty("error")
      if (!status) {
        let threadId = result.id;
        return threadId; // Return the thread ID if creation was successful
      } else {
        console.error(`Error in creating new thread: ${response.getContentText()}`);
      }
    } catch (error) {
      console.error(`Error in creating new thread: ${error}`);
    }

    attempt++;
    Utilities.sleep(2000);
  }

  throw new Error("Failed to create a new thread after several attempts.");
};

/**
 * Checks is there connection of email thread and assistant thread in properties
 * @param {string} emailThreadId - email thread id.
 * @returns {string} - assistant thread id.
 */
const getAssistantThreadId = (emailThreadId) => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const settingsThreadIds = addonSettings.threadIds;
  let assistantThread = null;
  for (let object of settingsThreadIds) {
    let key = Object.keys(object)[0];
    if (key === emailThreadId) {
      assistantThread = object[key];
      break;
    }
  }
  if (assistantThread === null) {
    let newAssistantThreadId = createNewThread();
    let newThreadIds = { [emailThreadId]: newAssistantThreadId };
    settingsThreadIds.push(newThreadIds);
    let updatedAddonSettings = {
      ...addonSettings,
      threadIds: settingsThreadIds,
    };
    saveAddonSettings(updatedAddonSettings);
    return newAssistantThreadId;
  } else {
    return assistantThread;
  }
};

/**
 * Adds message to particullar thread
 * @param {string} assistantThreadId - assistant thread id.
 * @param {string} message - message from user.
 * @returns {integer} - added message thread id.
 */
const addMessageToAssistantThread = (assistantThreadId, message) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  let apiKey = userSettings.openAiApiKey;
  try {
    let url = `https://api.openai.com/v1/threads/${assistantThreadId}/messages`;
    let headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    };
    let payload = {
      role: "user",
      content: message,
    };
    let options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
    };
    let response = UrlFetchApp.fetch(url, options);
    let result = JSON.parse(response);
    let messageId = result.id;
    return messageId;
  } catch (error) {
    console.error(
      `Error in adding message to thread ID: ${assistantThreadId}:`,
      error
    );
  }
};

/**
 * Runs thread under specific id
 *
 * @param {string} threadId - assistant thread id
 * @returns {integer} - run id.
 */
const runAssistantThread = (threadId, user) => {
  const userProperties = PropertiesService.getUserProperties();

  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  const assistantId = addonSettings.assistantId;
  const apiKey = userSettings.openAiApiKey;

  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/runs`;
    let headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    };
    let payload = {
      assistant_id: assistantId,
      additional_instructions: `Please address the user as ${user}.`,
    };
    let options = {
      method: "post",
      headers: headers,
      payload: JSON.stringify(payload),
    };
    let response = UrlFetchApp.fetch(url, options);
    let result = JSON.parse(response);
    let runId = result.id;
    return runId;
  } catch (error) {
    console.error(`Error in running thread ID: ${threadId}:`, error);
  }
};

/**
 * Retrieves thread run status
 * @param {string} threadId - assistant thread id
 * @param {string} runId - run id
 * @returns {string} - run status.
 */
const retrieveRunStatus = (threadId, runId) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  const apiKey = userSettings.openAiApiKey;
  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/runs/${runId}`;
    let headers = {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "OpenAI-Beta": "assistants=v2",
    };
    let options = {
      method: "get",
      headers: headers,
    };
    let response = UrlFetchApp.fetch(url, options);
    let result = JSON.parse(response);
    let runStatus = result.status;
    return runStatus;
  } catch (error) {
    console.error(
      `Error in retrieving run status ID: ${runId} of thread ID: ${threadId}:`,
      error
    );
  }
};

/**
 * Gets assistant messages
 * @param {string} threadId - assistant thread id
 * @returns {string} - response from assistant.
 */
const getAssistantMessages = (threadId) => {
  const userProperties = PropertiesService.getUserProperties();
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));

  const apiKey = userSettings.openAiApiKey;

  try {
    let url = `https://api.openai.com/v1/threads/${threadId}/messages`;
    let headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "OpenAI-Beta": "assistants=v2",
    };
    let options = {
      method: "get",
      headers: headers,
    };
    let response = UrlFetchApp.fetch(url, options);
    let result = JSON.parse(response);
    let output = result.data[0].content[0].text.value;
    return output;
  } catch (error) {
    console.error(
      `Error in getting messages in thread ID: ${threadId}:`,
      error
    );
  }
};

/**
 * Deletes assistant and file
 */
const deleteAssistantAndFile = () => {
  // getting user properties:
  const userProperties = PropertiesService.getUserProperties();

  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  const fileId = addonSettings.fileId;
  const assistantId = addonSettings.assistantId;
  const apiKey = userSettings.openAiApiKey;

  // url's to use
  let fileUrl = `https://api.openai.com/v1/files/${fileId}`;
  let assistantUrl = `https://api.openai.com/v1/assistants/${assistantId}`;

  // headers and options for assistant:
  const assistantHeaders = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${apiKey}`,
    "OpenAI-Beta": "assistants=v2",
  };

  const assistantOptions = {
    method: "delete",
    headers: assistantHeaders,
  };

  // deleting assistant:
  try {
    UrlFetchApp.fetch(assistantUrl, assistantOptions);
    console.log(`Assistant: ${assistantId} was deleted`);
  } catch (error) {
    console.error("Error in deleting assistant: ", error);
  }

  // headers and options for file:
  const fileHeaders = {
    Authorization: `Bearer ${apiKey}`,
  };

  const fileOptions = {
    method: "delete",
    headers: fileHeaders,
  };

  // deleting file:
  try {
    UrlFetchApp.fetch(fileUrl, fileOptions);
    console.log(`File: ${fileId} was deleted`);
  } catch (error) {
    console.error("Error in deleting file: ", error);
  }

  let updatedAddonSettings = {
    ...addonSettings,
    fileId: "",
    assistantId: "",
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isAssistantCreated: false,
  };
  saveBooleanSettings(updatedBooleanSettings);

  deleteTriggers();
  refreshCard();
};