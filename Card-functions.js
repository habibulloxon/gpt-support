const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmSummaryRegenerateHandler = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let progressAddonSettings = {
    ...addonSettings,
    updateBaseFunctionStatus: "running",
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
    updateBaseFunctionStatus: "idle",
  };

  saveAddonSettings(updatedAddonSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
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
  let docsFileLinkInputValue = e.formInput.knowledge_link_input;
  let autoReply = selectedAutoReplyValue.stringInputs.value[0];

  let apiKeyStatus = checkIsApiKeyProper(apiKey);

  let keyStatus;
  let openAiApiKey;
  let mainFuncStatus;

  let docsFileLink;

  if (apiKeyStatus) {
    openAiApiKey = apiKey;
    mainFuncStatus = "running";
    keyStatus = true;
  } else {
    openAiApiKey = "";
    mainFuncStatus = "error";
    keyStatus = false;
  }

  if (docsFileLinkInputValue !== undefined) {
    docsFileLink = docsFileLinkInputValue;
  } else {
    docsFileLink = "";
  }

  let updatedAddonSettings = {
    ...addonSettings,
    docsFileLink: docsFileLink,
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
    currentApiKey = "";
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

  let apiKey;

  const settingsChanged =
    prevCompanyName !== currentCompanyName ||
    prevAssistantName !== currentAssistantName ||
    prevApiKey !== currentApiKey ||
    prevEmailsLimit !== currentEmailsLimit ||
    prevAutoReply !== currentAutoReply;

  if (currentApiKey !== "") {
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
    } else {
      apiKey = currentApiKey
    }
  } else {
    apiKey = ""
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

const confirmAssistantUpdateHandler = () => {
  const userProperties = PropertiesService.getUserProperties();
  let addonSettings, userSettings, booleanSettings, newFileId;

  try {
    addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
    userSettings = JSON.parse(userProperties.getProperty("userSettings"));
    booleanSettings = JSON.parse(userProperties.getProperty("booleanSettings"));

    let progressAddonSettings = {
      ...addonSettings,
      updateBaseFunctionStatus: "running",
    };
    saveAddonSettings(progressAddonSettings);

    const assistantId = addonSettings.assistantId;
    const apiKey = userSettings.openAiApiKey;
    const oldFileId = addonSettings.fileId;

    // Attempt to delete the assistant file and the file itself
    deleteAssistantFile(assistantId, oldFileId, apiKey);
    deleteFile(oldFileId, apiKey);

    // Get the new file ID and update the assistant file
    newFileId = getUploadedFileId();
    updateAssistantFile(apiKey, newFileId, assistantId);

    // Save boolean settings without changes (this step seems redundant as per your code)
    saveBooleanSettings(booleanSettings);

    // Send an email notification about the update
    sendAssistantFileUpdatedEmail();

    let updatedAddonSettings = {
      ...addonSettings,
      fileId: newFileId, // Ensure this is defined outside the try block to be accessible here
    };
    saveAddonSettings(updatedAddonSettings);

    // Run the addon and return the updated card
    const card = runAddon();
    return CardService.newNavigation().updateCard(card);
  } catch (error) {
    // Handle any errors that occur during the process
    sendErrorMessage(ERR_MSG);
  } finally {
    // Ensure the addon settings are updated to reflect the process has finished
    // This block executes regardless of whether the try block succeeds or an error is caught
    addonSettings = JSON.parse(userProperties.getProperty("addonSettings")); // Re-fetch in case it was updated
    let updatedAddonSettings = {
      ...addonSettings,
      updateBaseFunctionStatus: "finished",
      fileId: newFileId, // Ensure this is defined outside the try block to be accessible here
    };
    saveAddonSettings(updatedAddonSettings);
  }
};

const regenerateInboxSummaryHandle = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let progressAddonSettings = {
    ...addonSettings,
    updateBaseFunctionStatus: "pending",
  };

  saveAddonSettings(progressAddonSettings);

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const handleRadioGroupChange = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  let currentSelectedAutoReplyValue =
    e.commonEventObject.formInputs.knowledge_file_field.stringInputs.value[0];

  let updatedBooleanSettings = {
    ...booleanSettings,
    createSummary: currentSelectedAutoReplyValue,
  };
  saveBooleanSettings(updatedBooleanSettings);

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
  const updateBaseFunctionStatus = addonSettings.updateBaseFunctionStatus;
  const createSummary = booleanSettings.createSummary;

  // user settings from properties
  const companyName = userSettings.companyName;
  const assistantName = userSettings.assistantName;
  const apiKey = userSettings.openAiApiKey;
  const emailsLimit = userSettings.emailsLimit;
  const autoReply = userSettings.autoReply;
  const fileLink = addonSettings.docsFileLink;
  const isApiKeyValid = booleanSettings.isApiKeyValid;
  const creationTime = addonSettings.summaryCreationTime;

  // actions === functions
  const handleRadioGroupChangeAction = CardService.newAction().setFunctionName(
    "handleRadioGroupChange"
  );
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
      `Great news! Your personal assistant and knowledge base file are now being set up. This process usually takes just a few minutes. As soon as it's ready, we'll send you a confirmation to your email address <b>${USER_EMAIL}</b>. If you need to step away, no worries—you won't miss a thing.`
    );
    cardSection.addWidget(loadingText);
  } else if (updateBaseFunctionStatus === "pending") {
    const notificationText = CardService.newTextParagraph().setText(
      "Are you ready to update your assistant's knowledge? This will replace your current knowledge base with the latest information from your emails. This action is irreversible."
    );
    cardSection.addWidget(notificationText);

    cardSection.addWidget(divider)

    const confirmButton = CardService.newTextButton()
      .setText("Update Knowledge Base")
      .setBackgroundColor("#057BCD")
      .setOnClickAction(confirmSummaryRegenerateAction);
    cardSection.addWidget(confirmButton);

    const denyButton = CardService.newTextButton()
      .setText("Keep Current Version")
      .setBackgroundColor("#6C757D")
      .setOnClickAction(denySummaryRegenerateAction);
    cardSection.addWidget(denyButton);
  } else if (isApiKeyValid === false) {
    const errorText = CardService.newTextParagraph().setText(
      `Oops! It looks like there was an issue with the API key provided. Please double-check your key and enter it again. If you continue to face any difficulties, we're here to help! Feel free to reach out to us at: <a href="mailto:zeva.slt@gmail.com">zeva.slt@gmail.com</a>`
    );
    cardSection.addWidget(errorText);

    const button = CardService.newTextButton()
      .setText("Re-enter settings")
      .setBackgroundColor("#057BCD")
      .setOnClickAction(reEnterApiKeyAction);
    cardSection.addWidget(button);
  } else if (updateBaseFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      `We are currently updating your knowledge base. This process typically takes a few minutes. Once the update is complete, we'll send a notification to your email address <b>${USER_EMAIL}</b> to confirm the changes. <b>After this please refresh APP</b> Thank you for your patience!`
    );
    cardSection.addWidget(loadingText);
  } else {
    const welcomeText = CardService.newTextParagraph().setText(
      `<b>Welcome to ZevaAI - your Gmail™ assistant<b/>`
    );
    cardSection.addWidget(welcomeText);
    cardSection.addWidget(divider);
    const docFile = addonSettings.docsFileLink;
    if (docFile === "") {
      const leadingText = CardService.newTextParagraph()
        .setText("Need help? Read our step-by-step guide")
      cardSection.addWidget(leadingText);
      const instructionsButton = CardService.newTextButton()
        .setAltText("Step-by-step guide")
        .setText("ℹ️ Step-by-step guide")
        .setBackgroundColor("#F57C00")
        .setOpenLink(CardService.newOpenLink().setUrl(INSTRUCTIONS_URL))
      cardSection.addWidget(instructionsButton)
      cardSection.addWidget(divider)
      if (createSummary === "default") {
        let knowledgeBaseGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Select a knowledge base source:")
          .setFieldName("knowledge_file_field")
          .addItem("Use Inbox as knowledge base", "default", true)
          .addItem("Provide a custom knowledge base", "own_base", false)
          .setOnChangeAction(handleRadioGroupChangeAction);
        cardSection.addWidget(knowledgeBaseGroup);
      } else {
        let knowledgeBaseGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("Select a knowledge base source:")
          .setFieldName("knowledge_file_field")
          .addItem("Use Inbox as knowledge base", "default", false)
          .addItem("Provide a custom knowledge base", "own_base", true)
          .setOnChangeAction(handleRadioGroupChangeAction);
        cardSection.addWidget(knowledgeBaseGroup);
      }
      if (createSummary === "own_base") {
        const knowledgeLinkInput = CardService.newTextInput()
          .setFieldName("knowledge_link_input")
          .setTitle("Custom Knowledge Base Link")
          .setValue(`${fileLink}`);
        cardSection.addWidget(knowledgeLinkInput);

        const infoText = CardService.newTextParagraph().setText(
          `Please use a <b>Google Docs file link</b> created by the account <b>${USER_EMAIL}</b>\n\n<a href ="https://docs.google.com/document/d/1wvIjjj1tfE99LkW3MlcTYLQTmtSQv-g1hu5R2i8z6X8/edit?usp=sharing">Example of Custom Knowledge Base</a>`
        );
        cardSection.addWidget(infoText);

      }
      cardSection.addWidget(divider);
      const settingsText = CardService.newTextParagraph().setText(
        `<b>Set up your Assistant:<b/>`
      );
      cardSection.addWidget(settingsText);
      const companyNameInput = CardService.newTextInput()
        .setFieldName("company_name_input")
        .setTitle("Your Company name")
        .setValue(`${companyName}`);
      cardSection.addWidget(companyNameInput);

      const assistantNameInput = CardService.newTextInput()
        .setFieldName("assistant_name_input")
        .setTitle("Choose an Assistant name")
        .setValue(`${assistantName}`);
      cardSection.addWidget(assistantNameInput);

      const emailsLimitInput = CardService.newTextInput()
        .setFieldName("emails_limit_input")
        .setTitle("Max Emails for knowledge base")
        .setValue(`${emailsLimit}`);
      cardSection.addWidget(emailsLimitInput);

      const apiKeyInput = CardService.newTextInput()
        .setFieldName("api_key_input")
        .setTitle("Paste your API key here")
        .setValue(`${apiKey}`);
      cardSection.addWidget(apiKeyInput);

      let radioGroup = CardService.newSelectionInput()
        .setType(CardService.SelectionInputType.RADIO_BUTTON)
        .setTitle("GPT Assistant mode:")
        .setFieldName("radio_field")
        .addItem("Automatically reply to Emails", "autoreply", true)
        .addItem("Create Draft Responses only", "drafts", false)
        .addItem("Disable all Automated actions", "disabled", false);
      cardSection.addWidget(radioGroup);

      const button = CardService.newTextButton()
        .setText("Confirm Settings")
        .setBackgroundColor("#198F51")
        .setOnClickAction(saveSettingsAction);
      cardSection.addWidget(button);
    } else {
      const fileUrlText = CardService.newTextParagraph().setText(
        `<b>Your assistant's knowledge was last updated on:</b> ${creationTime}<br><a href ="${fileLink}">View Knowledge Base</a>`
      );
      cardSection.addWidget(fileUrlText);

      cardSection.addWidget(divider);

      const assistantSettingsText = CardService.newTextParagraph().setText(
        `<b>Assistant settings:</b>`
      );
      cardSection.addWidget(assistantSettingsText);

      const regenerateSummaryFileBtn = CardService.newTextButton()
        .setText("Generate new knowledge base")
        .setBackgroundColor("#057BCD")
        .setOnClickAction(regenerateInboxSummaryAction);
      cardSection.addWidget(regenerateSummaryFileBtn);

      const updateAssistantButtonConfirm = CardService.newTextButton()
        .setText("Apply knowledge base to assistant")
        .setBackgroundColor("#F57C00")
        .setOnClickAction(confirmUpdateAssistantFileAction);
      cardSection.addWidget(updateAssistantButtonConfirm);

      cardSection.addWidget(divider);

      const userSettingsText = CardService.newTextParagraph().setText(
        `<b>Addon settings:</b>`
      );
      cardSection.addWidget(userSettingsText);

      const companyNameInput = CardService.newTextInput()
        .setFieldName("company_name_input")
        .setTitle("Your Company Name:")
        .setValue(`${companyName}`);
      cardSection.addWidget(companyNameInput);

      const assistantNameInput = CardService.newTextInput()
        .setFieldName("assistant_name_input")
        .setTitle("Your Assistant name:")
        .setValue(`${assistantName}`);
      cardSection.addWidget(assistantNameInput);

      const emailsLimitInput = CardService.newTextInput()
        .setFieldName("emails_limit_input")
        .setTitle("Emails to Use for Knowledge Update:")
        .setValue(`${emailsLimit}`);
      cardSection.addWidget(emailsLimitInput);

      const apiKeyInput = CardService.newTextInput()
        .setFieldName("api_key_input")
        .setTitle("OpenAI api key:")
        .setValue(`${apiKey}`);
      cardSection.addWidget(apiKeyInput);

      if (autoReply === "autoreply") {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("GPT Assistant mode:")
          .setFieldName("radio_field")
          .addItem("Automatically reply to Emails", "autoreply", true)
          .addItem("Create Draft Responses only", "drafts", false)
          .addItem("Disable all Automated actions", "disabled", false);
        cardSection.addWidget(radioGroup);
      } else if (autoReply === "drafts") {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("GPT Assistant mode:")
          .setFieldName("radio_field")
          .addItem("Automatically reply to Emails", "autoreply", false)
          .addItem("Create Draft Responses only", "drafts", true)
          .addItem("Disable all Automated actions", "disabled", false);
        cardSection.addWidget(radioGroup);
      } else {
        let radioGroup = CardService.newSelectionInput()
          .setType(CardService.SelectionInputType.RADIO_BUTTON)
          .setTitle("GPT Assistant mode:")
          .setFieldName("radio_field")
          .addItem("Automatically reply to Emails", "autoreply", false)
          .addItem("Create Draft Responses only", "drafts", false)
          .addItem("Disable all Automated actions", "disabled", true);
        cardSection.addWidget(radioGroup);
      }
      const updateSettingsButton = CardService.newTextButton()
        .setText("Save Settings")
        .setBackgroundColor("#198F51")
        .setOnClickAction(updateUserSettingsAction);
      cardSection.addWidget(updateSettingsButton);

      cardSection.addWidget(divider)

      const leadingText = CardService.newTextParagraph()
        .setText("Need help? Read our step-by-step guide")
      cardSection.addWidget(leadingText);
      const instructionsButton = CardService.newTextButton()
        .setAltText("Step-by-step guide")
        .setText("ℹ️ Step-by-step guide")
        .setBackgroundColor("#F57C00")
        .setOpenLink(CardService.newOpenLink().setUrl(INSTRUCTIONS_URL))
      cardSection.addWidget(instructionsButton)
    }
  }

  var fixedFooter = CardService.newFixedFooter().setPrimaryButton(
    CardService.newTextButton()
      .setText("Need Support? Contact Us")
      .setOpenLink(
        CardService.newOpenLink().setUrl("https://zeva.vercel.app/contact-us")
      )
  );

  const card = CardService.newCardBuilder()
    .setName("main_card")
    .setFixedFooter(fixedFooter)
    .addSection(cardSection)
    .build();
  return card;
};
