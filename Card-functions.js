const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmSummaryRegenerateHandler = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let progressAddonSettings = {
    ...addonSettings,
    updateFunctionStatus: "running",
  };
  saveAddonSettings(progressAddonSettings);

  installSummaryUpdateTriggers();

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const denySummaryRegenerateHandler = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let updatedAddonSettings = {
    ...addonSettings,
    updateFunctionStatus: "idle",
  };

  saveAddonSettings(updatedAddonSettings);

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
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let selectedAutoReplyValue = e.commonEventObject.formInputs.radio_field;

  let companyName = e.formInput.company_name_input;
  let assistantName = e.formInput.assistant_name_input;
  let emailsLimit = e.formInput.emails_limit_input;
  let apiKey = e.formInput.api_key_input;
  let autoReply = selectedAutoReplyValue.stringInputs.value[0];

  let apiKeyStatus = checkIsApiKeyProper(apiKey);

  let keyStatus;
  let openAiApiKey;
  let mainFuncStatus;

  if (apiKeyStatus) {
    openAiApiKey = apiKey;
    mainFuncStatus = "running";
    keyStatus = true;
  } else {
    openAiApiKey = "";
    mainFuncStatus = "error";
    keyStatus = false;
  }

  let updatedAddonSettings = {
    ...addonSettings,
    mainFunctionStatus: mainFuncStatus,
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isApiKeyValid: keyStatus,
  };
  saveBooleanSettings(updatedBooleanSettings);

  let updatedUserSettings = {
    ...userSettings,
    companyName: companyName,
    assistantName: assistantName,
    emailsLimit: emailsLimit,
    openAiApiKey: openAiApiKey,
    autoReply: autoReply,
  };
  saveUserSettings(updatedUserSettings);

  Utilities.sleep(2500);

  if (apiKeyStatus) {
    installSummaryCreationTriggers();
  } else {
    console.log("Can not add trigger");
  }

  let card = runAddon();
  return CardService.newNavigation().updateCard(card);
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
  const userProperties = PropertiesService.getUserProperties();

  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let prevCompanyName = userSettings.companyName;
  let prevAssistantName = userSettings.assistantName;
  let prevApiKey = userSettings.openAiApiKey;
  let prevEmailsLimit = userSettings.emailsLimit;
  let prevAutoReply = userSettings.autoReply;

  let currentSelectedAutoReplyValue =
    e.commonEventObject.formInputs.radio_field.stringInputs.value[0];

  let currentCompanyName;
  let currentAssistantName;
  let currentApiKey;
  let currentEmailsLimit;
  let currentAutoReply;

  if (e.formInput.company_name_input === undefined) {
    currentCompanyName = prevCompanyName;
  } else {
    currentCompanyName = e.formInput.company_name_input;
  }

  if (e.formInput.assistant_name_input === undefined) {
    currentAssistantName = prevAssistantName;
  } else {
    currentAssistantName = e.formInput.assistant_name_input;
  }

  if (e.formInput.api_key_input === undefined) {
    currentApiKey = prevApiKey;
  } else {
    currentApiKey = e.formInput.api_key_input;
  }

  if (e.formInput.emails_limit_input === undefined) {
    currentEmailsLimit = prevEmailsLimit;
  } else {
    currentEmailsLimit = e.formInput.emails_limit_input;
  }

  if (currentSelectedAutoReplyValue === undefined) {
    currentAutoReply = prevAutoReply;
  } else {
    currentAutoReply = currentSelectedAutoReplyValue;
  }

  let apiKey = prevApiKey;

  const settingsChanged =
    prevCompanyName !== currentCompanyName ||
    prevAssistantName !== currentAssistantName ||
    prevApiKey !== currentApiKey ||
    prevEmailsLimit !== currentEmailsLimit ||
    prevAutoReply !== currentAutoReply;

  if (prevApiKey !== currentApiKey) {
    let apiKeyStatus = checkIsApiKeyProper(currentApiKey);
    if (apiKeyStatus) {
      apiKey = currentApiKey;
    } else {
      apiKey = "";
      const updatedSettings = {
        ...booleanSettings,
        isApiKeyValid: false,
      };

      saveBooleanSettings(updatedSettings);
    }
  }

  if (settingsChanged) {
    let updatedUserSettings = {
      ...userSettings,
      companyName: currentCompanyName,
      assistantName: currentAssistantName,
      openAiApiKey: apiKey,
      emailsLimit: currentEmailsLimit,
      autoReply: currentAutoReply,
    };

    saveUserSettings(updatedUserSettings);
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
  const userProperties = PropertiesService.getUserProperties();

  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let updatedAddonSettings = {
    ...addonSettings,
    mainFunctionStatus: "idle",
  };
  saveAddonSettings(updatedAddonSettings);

  let updatedBooleanSettings = {
    ...booleanSettings,
    isApiKeyValid: null,
  };
  saveBooleanSettings(updatedBooleanSettings);

  let updatedUserSettings = {
    ...userSettings,
    openAiApiKey: "",
  };
  saveUserSettings(updatedUserSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const deleteAssistantFile = (assistantId, fileId, apiKey) => {
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

const deleteFile = (fileId, apiKey) => {
  var url = `https://api.openai.com/v1/files/${fileId}`;
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
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let isFileUpdatedStatus = isSummaryFileUpdated();
  let isFileUpdated = booleanSettings.isFileUpdated;

  if (isFileUpdatedStatus || isFileUpdated) {
    let progressAddonSettings = {
      ...addonSettings,
      updateFunctionStatus: "running",
    };

    saveAddonSettings(progressAddonSettings);

    const assistantId = addonSettings.assistantId;
    const apiKey = userSettings.openAiApiKey;
    const oldFileId = addonSettings.fileId;

    deleteAssistantFile(assistantId, oldFileId, apiKey);
    deleteFile(oldFileId, apiKey)

    const newFileId = getUploadedFileId();

    updateAssistantFile(apiKey, newFileId, assistantId);

    let updatedAddonSettings = {
      ...addonSettings,
      updateFunctionStatus: "finished",
      fileId: newFileId,
    };
    saveAddonSettings(updatedAddonSettings);

    let updatedBooleanSettings = {
      ...booleanSettings,
      isFileUpdated: false,
    };
    saveBooleanSettings(updatedBooleanSettings);

    sendAssistantFileUPdatedEmail();
    const card = runAddon();
    return CardService.newNavigation().updateCard(card);
  } else {
    console.log("There is nothing to change");
  }
};

const regenerateInboxSummaryHandle = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let progressAddonSettings = {
    ...addonSettings,
    updateFunctionStatus: "pending",
  };

  saveAddonSettings(progressAddonSettings);

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
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  // conditions
  const mainFunctionStatus = addonSettings.mainFunctionStatus;
  const updateFunctionStatus = addonSettings.updateFunctionStatus;

  // user settings from properties
  const companyName = userSettings.companyName;
  const assistantName = userSettings.assistantName;
  const apiKey = userSettings.openAiApiKey;
  const emailsLimit = userSettings.emailsLimit;
  const autoReply = userSettings.autoReply;
  const fileLink = addonSettings.docsFileLink;
  const isApiKeyValid = booleanSettings.isApiKeyValid;
  const creationTime = addonSettings.summaryCreationTime

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
  } else if (updateFunctionStatus === "pending") {
    const notificationText = CardService.newTextParagraph().setText(
      "Do you want to regenerate new summary and override current one?"
    );
    cardSection.addWidget(notificationText);

    const notificationAssistantFileText = CardService.newTextParagraph().setText(
      `Assistant file will be <b>automatically updated</b>`
    );
    cardSection.addWidget(notificationAssistantFileText);

    const confirmButton = CardService.newTextButton()
      .setText("Yes")
      .setOnClickAction(confirmSummaryRegenerateAction);
    cardSection.addWidget(confirmButton);

    const denyButton = CardService.newTextButton()
      .setText("No")
      .setOnClickAction(denySummaryRegenerateAction);
    cardSection.addWidget(denyButton);
  } else if (isApiKeyValid === false) {
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
    const docFile = addonSettings.docsFileLink;
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
        .setTitle("Choose option:")
        .setFieldName("radio_field")
        .addItem("Autoreply emails", "autoreply", true)
        .addItem("Only add response drafts", "drafts", false)
        .addItem("Everything is disabled", "disabled", false);
      cardSection.addWidget(radioGroup);

      const button = CardService.newTextButton()
        .setText("Save settings")
        .setOnClickAction(saveSettingsAction);
      cardSection.addWidget(button);
    } else {
      const fileUrlText = CardService.newTextParagraph().setText(
        `<b>Email summary file</b> was created at: ${creationTime}<br><a href ="${fileLink}">Click here to view summary file</a>`
      );
      cardSection.addWidget(fileUrlText);

      cardSection.addWidget(divider);

      const assistantSettingsText =
        CardService.newTextParagraph().setText(`<b>Assistant settings:</b>`);
      cardSection.addWidget(assistantSettingsText);

      const regenerateSummaryFileBtn = CardService.newTextButton()
        .setText("Regenerate summary file")
        .setBackgroundColor("#057BCD")
        .setOnClickAction(regenerateInboxSummaryAction);
      cardSection.addWidget(regenerateSummaryFileBtn);

      const updateAssistantButtonConfirm = CardService.newTextButton()
        .setText("Update assistant file")
        .setBackgroundColor("#057BCD")
        .setOnClickAction(confirmUpdateAssistantFileAction);
      cardSection.addWidget(updateAssistantButtonConfirm);

      cardSection.addWidget(divider);

      const userSettingsText =
        CardService.newTextParagraph().setText(`<b>Addon settings:</b>`);
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

      if (autoReply === "autoreply") {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Choose option:")
          .setFieldName("radio_field")
          .addItem("Autoreply emails", "autoreply", true)
          .addItem("Only add response drafts", "drafts", false)
          .addItem("Everything is disabled", "disabled", false);
        cardSection.addWidget(radioGroup);
      } else if (autoReply === "drafts") {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Choose option:")
          .setFieldName("radio_field")
          .addItem("Autoreply emails", "autoreply", false)
          .addItem("Only add response drafts", "drafts", true)
          .addItem("Everything is disabled", "disabled", false);
        cardSection.addWidget(radioGroup);
      } else {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Choose option:")
          .setFieldName("radio_field")
          .addItem("Autoreply emails", "autoreply", false)
          .addItem("Only add response drafts", "drafts", false)
          .addItem("Everything is disabled", "disabled", true);
        cardSection.addWidget(radioGroup);
      }

      const updateSettingsButton = CardService.newTextButton()
        .setText("Update addon settings")
        .setBackgroundColor("#198F51")
        .setOnClickAction(updateUserSettingsAction);
      cardSection.addWidget(updateSettingsButton);
    }
  }

  var fixedFooter =
    CardService
      .newFixedFooter()
      .setPrimaryButton(
        CardService
          .newTextButton()
          .setText("help")
          .setOpenLink(CardService.newOpenLink().setUrl("https://zeva.vercel.app/contact-us")));


  const card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle(`Welcome to Zeva assistant!`))
    .setFixedFooter(fixedFooter)
    .addSection(cardSection)
    .build();
  return card;
};
