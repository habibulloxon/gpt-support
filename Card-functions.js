const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmSummaryRegenerateHandler = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let progressSettings = {
    ...settings,
    updateFunctionStatus: "running",
  };

  saveSettings(progressSettings);

  installSummaryUpdateTriggers()

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const denySummaryRegenerateHandler = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let progressSettings = {
    ...settings,
    updateFunctionStatus: "idle",
  };

  saveSettings(progressSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
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
      model: "gpt-4-1106-preview",
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

  const response = JSON.parse(UrlFetchApp.fetch(url, options).getContentText());
  const isValid = response.hasOwnProperty("error");

  return !isValid;
};

const handleSaveClick = (e) => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let selectedAutoReplyValue = e.commonEventObject.formInputs.radio_field;

  let companyName = e.formInput.company_name_input;
  let assistantName = e.formInput.assistant_name_input;
  let emailsLimit = e.formInput.emails_limit_input;
  let apiKey = e.formInput.api_key_input;
  let autoReply = selectedAutoReplyValue.stringInputs.value[0];

  let apiKeyStatus = checkIsApiKeyProper(apiKey);
  let openAiApiKey;

  if (apiKeyStatus) {
    openAiApiKey = apiKey;
  } else {
    openAiApiKey = "";
  }

  let progressSettings = {
    ...settings,
    mainFunctionStatus: "running",
    isApiKeyValid: apiKeyStatus,
    companyName: companyName,
    assistantName: assistantName,
    emailsLimit: emailsLimit,
    openAiApiKey: openAiApiKey,
    autoReply: autoReply,
  };
  saveSettings(progressSettings);

  if (apiKeyStatus) {
    installSummaryCreationTriggers();
  }

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const updateAssistantInstructions = () => {
//  const userProperties = PropertiesService.getUserProperties();
// const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const OPENAI_API_KEY = settings.openAiApiKey;
  const assistantId = settings.assistantId;
  const companyName = settings.companyName;
  const name = settings.assistantName;
  const fileId = settings.fileId;

  let url = `https://api.openai.com/v1/assistants/${assistantId}`;

  let headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + OPENAI_API_KEY,
    "OpenAI-Beta": "assistants=v1",
  };

  let payload = {
    instructions: `You are a Support Agent in ${companyName} and your name is ${name}, you need to answer and help people with their questions via email. Your email style, structure and manner always must be the same as in the uploaded file.`,
    tools: [{ type: "retrieval" }],
    model: "gpt-4-1106-preview",
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

const handleSettingsUpdateClick = (e) => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const {
    companyName: prevCompanyName,
    assistantName: prevAssistantName,
    openAiApiKey: prevApiKey,
    emailsLimit: prevEmailsLimit,
    autoReply: prevAutoReply,
  } = settings;

  const currentSelectedAutoReplyValue =
    e.commonEventObject.formInputs.radio_field.stringInputs.value[0];

  const {
    company_name_input: currentCompanyName,
    assistant_name_input: currentAssistantName,
    api_key_input: currentApiKey,
    emails_limit_input: currentEmailsLimit,
  } = e.formInput;

  const currentAutoReply = currentSelectedAutoReplyValue;

  let apiKey;

  if (prevApiKey !== currentApiKey) {
    let apiKeyStatus = checkIsApiKeyProper(currentApiKey);
    if (apiKeyStatus) {
      apiKey = currentApiKey;
    } else {
      apiKey = "";
      const updatedSettings = {
        ...settings,
        isApiKeyValid: false,
      };

      saveSettings(updatedSettings);
    }
  }

  const settingsChanged =
    prevCompanyName !== currentCompanyName ||
    prevAssistantName !== currentAssistantName ||
    prevApiKey !== currentApiKey ||
    prevEmailsLimit !== currentEmailsLimit ||
    prevAutoReply !== currentAutoReply;

  if (settingsChanged) {
    const updatedSettings = {
      ...settings,
      companyName: currentCompanyName,
      assistantName: currentAssistantName,
      openAiApiKey: apiKey,
      emailsLimit: currentEmailsLimit,
      autoReply: currentAutoReply,
    };

    saveSettings(updatedSettings);
  } else {
    Logger.log("There is nothing to change");
  }

  const assistantChanged =
    prevCompanyName !== currentCompanyName ||
    prevAssistantName !== currentAssistantName;

  if (assistantChanged) {
    updateAssistantInstructions();
  } else {
    Logger.log("There is nothing to change in assistant");
  }

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const reEnterApiKeyHandler = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let updatedSettings = {
    ...settings,
    mainFunctionStatus: "idle",
    openAiApiKey: "",
  };
  saveSettings(updatedSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const deleteFile = (assistantId, fileId, apiKey) => {
  var url = `https://api.openai.com/v1/assistants/${assistantId}/files/${fileId}`;
  var headers = {
    Authorization: "Bearer " + apiKey,
    "Content-Type": "application/json",
    "OpenAI-Beta": "assistants=v1",
  };

  var options = {
    method: "DELETE",
    headers: headers,
  };

  UrlFetchApp.fetch(url, options);
};

const updateAssistantFile = (apiKey, fileId, assistantId) => {
  let url = `https://api.openai.com/v1/assistants/${assistantId}`;

  var headers = {
    "Content-Type": "application/json",
    Authorization: "Bearer " + apiKey,
    "OpenAI-Beta": "assistants=v1",
  };

  var payload = {
    file_ids: [`${fileId}`],
  };

  var options = {
    method: "POST",
    headers: headers,
    payload: JSON.stringify(payload),
  };

  UrlFetchApp.fetch(url, options);
};

const confirmAssistantUpdateHandler = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let progressSettings = {
    ...settings,
    updateFunctionStatus: "running",
  };

  saveSettings(progressSettings);

  const assistantId = settings.assistantId;
  const apiKey = settings.openAiApiKey;

  const oldFileId = settings.fileId;
  deleteFile(assistantId, oldFileId, apiKey);

  const newFileId = getUploadedFileId();

  updateAssistantFile(apiKey, newFileId, assistantId);

  let updatedSettings = {
    ...settings,
    updateFunctionStatus: "finished",
    fileId: newFileId,
    isFileUpdated: false,
  };

  saveSettings(updatedSettings);
  sendSummaryUpdateEmail();
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const denyAssistantUpdateHandler = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let updatedSettings = {
    ...settings,
    isFileUpdated: false,
  };

  saveSettings(updatedSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const regenerateInboxSummaryHandle = () => {
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let progressSettings = {
    ...settings,
    updateFunctionStatus: "pending",
  };

  saveSettings(progressSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const runAddon = () => {
  // creating initial settings
  createSettings();

  // card utilities
  const divider = CardService.newDivider();
  const cardSection = CardService.newCardSection();

  // user properties === settings
//  const userProperties = PropertiesService.getUserProperties();
//  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  // conditions
  const mainFunctionStatus = settings.mainFunctionStatus;
  const updateFunctionStatus = settings.updateFunctionStatus;

  // user settings from properties
  const companyName = settings.companyName;
  const assistantName = settings.assistantName;
  const apiKey = settings.openAiApiKey;
  const emailsLimit = settings.emailsLimit;
  const autoReply = settings.autoReply;
  const fileLink = settings.docsFileLink;
  const isApiKeyValid = settings.isApiKeyValid;
  const isFileUpdated = settings.isFileUpdated

  // actions === functions
  const saveSettingsAction =
    CardService.newAction().setFunctionName("handleSaveClick");
  const regenerateInboxSummaryAction = CardService.newAction().setFunctionName(
    "regenerateInboxSummaryHandle"
  );
  const updateUserSettingsAction = CardService.newAction().setFunctionName(
    "handleSettingsUpdateClick"
  );
  const reEnterApiKeyAction = CardService.newAction().setFunctionName(
    "reEnterApiKeyHandler"
  );
  const denyUpdateAssistantFileAction = CardService.newAction().setFunctionName(
    "denyAssistantUpdateHandler"
  );
  const confirmUpdateAssistantFileAction =
    CardService.newAction().setFunctionName("confirmAssistantUpdateHandler");
  const confirmSummaryRegenerateAction =
    CardService.newAction().setFunctionName("confirmSummaryRegenerateHandler");
  const denySummaryRegenerateAction = CardService.newAction().setFunctionName(
    "denySummaryRegenerateHandler"
  );

  // card rendering based on several conditions
  if (mainFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      "Your settings are saving"
    );
    cardSection.addWidget(loadingText);
  } else if (isFileUpdated) {
    const notificationText = CardService.newTextParagraph().setText(
      "You have changed your summary file do you want to update assistant file?"
    );
    cardSection.addWidget(notificationText);

    const updateAssistantButtonConfirm = CardService.newTextButton()
      .setText("Yes, update assistant")
      .setOnClickAction(confirmUpdateAssistantFileAction);
    cardSection.addWidget(updateAssistantButtonConfirm);

    const updateAssistantButtonDeny = CardService.newTextButton()
      .setText("No, do not update assistant")
      .setOnClickAction(denyUpdateAssistantFileAction);
    cardSection.addWidget(updateAssistantButtonDeny);
  } else if (updateFunctionStatus === "pending") {
    const notificationText = CardService.newTextParagraph().setText(
      "Do you want to regenerate new summary and override current one?"
    );
    cardSection.addWidget(notificationText);

    const confirmButton = CardService.newTextButton()
      .setText("Yes")
      .setOnClickAction(confirmSummaryRegenerateAction);
    cardSection.addWidget(confirmButton);

    const denyButton = CardService.newTextButton()
      .setText("No")
      .setOnClickAction(denySummaryRegenerateAction);
    cardSection.addWidget(denyButton);
  } else if (!isApiKeyValid) {
    const errorText = CardService.newTextParagraph().setText(
      "Entered API key is not meeting requirements, please re-enter your API key"
    );
    cardSection.addWidget(errorText);

    const button = CardService.newTextButton()
      .setText("Re-enter settings")
      .setOnClickAction(reEnterApiKeyAction);
    cardSection.addWidget(button);
  } else if (updateFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      "Your summary is updating"
    );
    cardSection.addWidget(loadingText);
  } else {
    const docFile = settings.docsFileLink;
    if (docFile === "") {
      const companyNameInput = CardService.newTextInput()
        .setFieldName("company_name_input")
        .setTitle("Enter company name")
        .setValue(`${companyName}`);
      cardSection.addWidget(companyNameInput);

      const assistantNameInput = CardService.newTextInput()
        .setFieldName("assistant_name_input")
        .setTitle("Enter assistant name")
        .setValue(`${assistantName}`);
      cardSection.addWidget(assistantNameInput);

      const emailsLimitInput = CardService.newTextInput()
        .setFieldName("emails_limit_input")
        .setTitle("Enter emails limit")
        .setValue(`${emailsLimit}`);
      cardSection.addWidget(emailsLimitInput);

      const apiKeyInput = CardService.newTextInput()
        .setFieldName("api_key_input")
        .setTitle("Enter api key")
        .setValue(`${apiKey}`);
      cardSection.addWidget(apiKeyInput);

      let radioGroup = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("Autoreply:")
        .setFieldName("radio_field")
        .addItem("Enabled", "true", true)
        .addItem("Disabled", "false", false);
      cardSection.addWidget(radioGroup);

      const button = CardService.newTextButton()
        .setText("Save settings")
        .setOnClickAction(saveSettingsAction);
      cardSection.addWidget(button);
    } else {
      const fileUrlText = CardService.newTextParagraph().setText(
        `Your file was created`
      );
      cardSection.addWidget(fileUrlText);

      const viewFileButton = CardService.newTextButton()
        .setText("View File")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(`${fileLink}`)
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        );
      cardSection.addWidget(viewFileButton);

      cardSection.addWidget(divider);

      const regenerateSummaryFileBtn = CardService.newTextButton()
        .setText("Regenerate summary file")
        .setOnClickAction(regenerateInboxSummaryAction);
      cardSection.addWidget(regenerateSummaryFileBtn);

      cardSection.addWidget(divider);

      const userSettingsText =
        CardService.newTextParagraph().setText(`Addon settings:`);
      cardSection.addWidget(userSettingsText);

      const companyNameInput = CardService.newTextInput()
        .setFieldName("company_name_input")
        .setTitle("Company name:")
        .setValue(`${companyName}`);
      cardSection.addWidget(companyNameInput);

      const assistantNameInput = CardService.newTextInput()
        .setFieldName("assistant_name_input")
        .setTitle("Assistant name:")
        .setValue(`${assistantName}`);
      cardSection.addWidget(assistantNameInput);

      const emailsLimitInput = CardService.newTextInput()
        .setFieldName("emails_limit_input")
        .setTitle("Emails limit:")
        .setValue(`${emailsLimit}`);
      cardSection.addWidget(emailsLimitInput);

      const apiKeyInput = CardService.newTextInput()
        .setFieldName("api_key_input")
        .setTitle("Api key:")
        .setValue(`${apiKey}`);
      cardSection.addWidget(apiKeyInput);

      if (autoReply === "true") {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Autoreply:")
          .setFieldName("radio_field")
          .addItem("Enabled", "true", true)
          .addItem("Disabled", "false", false);
        cardSection.addWidget(radioGroup);
      } else {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Autoreply:")
          .setFieldName("radio_field")
          .addItem("Enabled", "true", false)
          .addItem("Disabled", "false", true);
        cardSection.addWidget(radioGroup);
      }

      const updateSettingsButton = CardService.newTextButton()
        .setText("Update settings")
        .setOnClickAction(updateUserSettingsAction);
      cardSection.addWidget(updateSettingsButton);
    }
  }

  const card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle("Configure addon"))
    .addSection(cardSection)
    .build();
  return card;
};
