const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmAction = () => {
  var nav = CardService.newNavigation().popToRoot();
  return CardService.newActionResponseBuilder().setNavigation(nav).build();
};

const denyAction = () => {
  var nav = CardService.newNavigation().popToRoot();
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

    var secondCard = CardService.newCardBuilder()
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

    var nav = CardService.newNavigation().pushCard(secondCard);

    return CardService.newActionResponseBuilder().setNavigation(nav).build();
  } else {
  }
};

const main = () => {
  // installSummaryCreationTriggers();
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  console.log("main function finished")

  let updatedSettings = {
    ...settings,
    isFileCreated: true,
    mainFunctionStatus: "finished",
  };
  saveSettings(updatedSettings);
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

  let progressSettings = {
    ...settings,
    mainFunctionStatus: "running",
    companyName: companyName,
    assistantName: assistantName,
    emailsLimit: emailsLimit,
    openAiApiKey: apiKey,
    autoReply: autoReply,
  };
  saveSettings(progressSettings);

  ScriptApp.newTrigger("main")
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();

  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const handleSettingsUpdateClick = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const previosCompanyName = settings.companyName;
  const previosAssistantName = settings.assistantName;
  const previosApiKey = settings.openAiApiKey;
  const previosEmailsLimit = settings.emailsLimit;
  const previosAutoReply = settings.autoReply;

  let currentSelectedAutoReplyValue = e.commonEventObject.formInputs.radio_field;

  let currentCompanyName = e.formInput.company_name_input;
  let currentAssistantName = e.formInput.assistant_name_input;
  let currentApiKey = e.formInput.api_key_input;
  let currentEmailsLimit = e.formInput.emails_limit_input;
  let currentAutoReply = currentSelectedAutoReplyValue.stringInputs.value[0];

  if(
    previosCompanyName !== currentCompanyName ||
    previosAssistantName !== currentAssistantName ||
    previosApiKey !== currentApiKey || 
    previosEmailsLimit !== currentEmailsLimit ||
    previosAutoReply !== currentAutoReply
  ) {
    let updatedSettings = {
      ...settings,
      companyName: currentCompanyName,
      assistantName: currentAssistantName, 
      openAiApiKey: currentApiKey,
      emailsLimit: currentEmailsLimit,
      autoReply: currentAutoReply
    }

    saveSettings(updatedSettings);
  } else {
    Logger.log("There is nothing to change")
  }
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

  // card rendering based on several conditions
  if (mainFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      "Your settings are saving"
    );
    cardSection.addWidget(loadingText);
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
        .setTitle("Enter company name");
      cardSection.addWidget(companyNameInput);

      const assistantNameInput = CardService.newTextInput()
        .setFieldName("assistant_name_input")
        .setTitle("Enter assistant name");
      cardSection.addWidget(assistantNameInput);

      const emailsLimitInput = CardService.newTextInput()
        .setFieldName("emails_limit_input")
        .setTitle("Enter emails limit");
      cardSection.addWidget(emailsLimitInput);

      const apiKeyInput = CardService.newTextInput()
        .setFieldName("api_key_input")
        .setTitle("Enter api key");
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
