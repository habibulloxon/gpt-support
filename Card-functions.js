const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
};

const confirmAction = () => {
  updateInboxSummaryRedirect();
};

const denyAction = () => {
  var nav = CardService.newNavigation().popToRoot();

  return CardService.newActionResponseBuilder().setNavigation(nav).build();
};

const updateInboxSummaryRedirect = () => {
  var actionResponse = summaryUpdateCard();

  installSummaryUpdateTriggers();

  return actionResponse;
};

const handleAssistantCreationClick = () => {
  var actionResponse = assistantCreatingCard();

  createAssistant();

  return actionResponse;
};

const assistantCreatingCard = () => {
  let loadingCardSection = CardService.newCardSection();

  let loadingText = CardService.newTextParagraph().setText(
    "Your assistant is creating. It might take a few minutes, we will notify you when it is ready. You can close addon",
  );
  loadingCardSection.addWidget(loadingText);

  let loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Creation is in progress"))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  let notification = CardService.newNotification().setText(
    "Your assistant summary is creating...",
  );

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .setNotification(notification)
    .build();

  return actionResponse;
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
            "You have changed original summary, do you want to override it?",
          ),
        ),
      )
      .build();

    var nav = CardService.newNavigation().pushCard(secondCard);

    return CardService.newActionResponseBuilder().setNavigation(nav).build();
  } else {
    updateInboxSummaryRedirect();
  }
};

const summaryUpdateCard = () => {
  let loadingCardSection = CardService.newCardSection();

  let loadingText = CardService.newTextParagraph().setText(
    "Your inbox summary is updating. It might take a few minutes, we will notify you when it is ready. You can close addon",
  );
  loadingCardSection.addWidget(loadingText);

  let loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle("Update is in progress"))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  let notification = CardService.newNotification().setText(
    "Your inbox summary is updating...",
  );

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .setNotification(notification)
    .build();

  return actionResponse;
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
  createSettings();
  const divider = CardService.newDivider();
  const cardSection = CardService.newCardSection();

  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const mainFunctionStatus = settings.mainFunctionStatus;

  const saveSettingsAction =
    CardService.newAction().setFunctionName("handleSaveClick");

  const updateInboxSummaryAction = CardService.newAction().setFunctionName(
    "handleSummaryUpdateClick",
  );
  const createAssistantAction = CardService.newAction().setFunctionName(
    "handleAssistantCreationClick",
  );
  const stopAssistantAction = CardService.newAction().setFunctionName(
    "deleteAssistantAndFile",
  );

  if (mainFunctionStatus === "running") {
    const loadingText = CardService.newTextParagraph().setText(
      "Your settings are saving",
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
        `Your file was created`,
      );
      cardSection.addWidget(fileUrlText);

      const viewFileButton = CardService.newTextButton()
        .setText("View File")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(`${fileLink}`)
            .setOpenAs(CardService.OpenAs.FULL_SIZE),
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
