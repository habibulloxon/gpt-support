const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmAction = () => {
  let nav = CardService.newNavigation().popToRoot();
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
};

const denyAction = () => {
  let nav = CardService.newNavigation().popToRoot();
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
};

const handleSummaryUpdateClick = () => {
  let isFileChanged = compareUpdatedDates();

  if (isFileChanged) {
    const confirmAction =
      CardService.newAction().setFunctionName("confirmAction");
    const denyAction = CardService.newAction().setFunctionName("denyAction");

    const confirmButton = CardService.newTextButton()
      .setText("Yes")
      .setOnClickAction(confirmAction);

    const denyButton = CardService.newTextButton()
      .setText("No")
      .setOnClickAction(denyAction);

    const secondCardSection = CardService.newCardSection()
      .addWidget(confirmButton)
      .addWidget(denyButton);

    let secondCard = CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("Please confirm action"))
      .addSection(secondCardSection)
      .addSection(
        CardService.newCardSection().addWidget(
          CardService.newTextParagraph().setText(
            "You have changed original summary, do you want to override it?"
          )
        )
      )
      .build();

    let nav = CardService.newNavigation().pushCard(secondCard);

    return CardService.newActionResponseBuilder().setNavigation(nav).build();
  } else {
  }
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
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let selectedAutoReplyValue = e.commonEventObject.formInputs.radio_field;

  let companyName = e.formInput.company_name_input;
  let assistantName = e.formInput.assistant_name_input;
  let emailsLimit = e.formInput.emails_limit_input;
  let apiKey = e.formInput.api_key_input;
  let autoReply = selectedAutoReplyValue.stringInputs.value[0];

  let apiKeyStatus = checkIsApiKeyProper(apiKey);
  let functionStatus;
  let openAiApiKey;

  if (apiKeyStatus) {
    functionStatus = "running";
    openAiApiKey = apiKey
  } else {
    functionStatus = "error";
    openAiApiKey = ""
  }

  let progressSettings = {
    ...settings,
    mainFunctionStatus: functionStatus,
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
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

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
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

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
      openAiApiKey: currentApiKey,
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
};

const reEnterApiKeyHandler = () => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let updatedSettings = {
    ...settings,
    mainFunctionStatus: "idle",
    openAiApiKey: "",
  };
  saveSettings(updatedSettings);

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
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

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

  // actions === functions
  const saveSettingsAction =
    CardService.newAction().setFunctionName("handleSaveClick");
  const updateInboxSummaryAction = CardService.newAction().setFunctionName(
    "handleSummaryUpdateClick"
  );
  const updateUserSettingsAction = CardService.newAction().setFunctionName(
    "handleSettingsUpdateClick"
  );
  const reEnterApiKeyAction = CardService.newAction().setFunctionName(
    "reEnterApiKeyHandler"
  );

  // card rendering based on several conditions
  if (mainFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      "Your settings are saving"
    );
    cardSection.addWidget(loadingText);
  } else if (mainFunctionStatus === "error") {
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
    const isFileCreated = settings.isFileCreated;
    if (isFileCreated === false) {
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

      const updateSummaryFileBtn = CardService.newTextButton()
        .setText("Update summary file")
        .setOnClickAction(updateInboxSummaryAction);
      cardSection.addWidget(updateSummaryFileBtn);

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
    .setHeader(CardService.newCardHeader().setTitle("Enter information:"))
    .addSection(cardSection)
    .build();
  return card;
};
