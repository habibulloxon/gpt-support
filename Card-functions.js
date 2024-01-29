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
  installSummaryCreationTriggers();
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

  // actions === functions
  const saveSettingsAction = CardService.newAction().setFunctionName(
    "handleSaveClick",
  );
  const updateInboxSummaryAction = CardService.newAction().setFunctionName(
    "handleSummaryUpdateClick"
  );
  const createAssistantAction = CardService.newAction().setFunctionName(
    "handleAssistantCreationClick"
  );
  const stopAssistantAction = CardService.newAction().setFunctionName(
    "deleteAssistantAndFile"
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
      const fileLink = settings.docsFileLink;

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

      const assistantId = settings.assistantId;
      if (assistantId === "") {
        const createAssistantButton = CardService.newTextButton()
          .setText("Create and Start Assistant")
          .setOnClickAction(createAssistantAction);
        cardSection.addWidget(createAssistantButton);
      } else {
        const stopAssistantButton = CardService.newTextButton()
          .setText("Delete and stop assistant")
          .setOnClickAction(stopAssistantAction);
        cardSection.addWidget(stopAssistantButton);
      }
    }
  }

  const card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle("Actions:"))
    .addSection(cardSection)
    .build();
  return card;
};
