const refreshCard = () => {
  const card = runAddon();
  return CardService.newNavigation().updateCard(card);
}


const setScrappingLimit = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let inputValue = e.formInput.emails_limit_input

  let updatedSettings = {
    ...settings,
    emailsLimit: inputValue
  }

  saveSettings(updatedSettings)
};

const setCompanyName = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let inputValue = e.formInput.company_name_input

  let updatedSettings = {
    ...settings,
    companyName: inputValue
  }

  saveSettings(updatedSettings)
};

const confirmAction = () => {
  updateInboxSummaryRedirect()
}

const denyAction = () => {
  var nav = CardService.newNavigation().popToRoot();

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}


const updateInboxSummaryRedirect = () => {
  var actionResponse = summaryUpdateCard();

  installSummaryUpdateTriggers()

  return actionResponse;
}

const handleSummaryCreationClick = () => {
  var actionResponse = summaryCreatingCard();

  installSummaryCreationTriggers()

  return actionResponse;
}

const summaryCreatingCard = () => {
  let loadingCardSection = CardService.newCardSection();

  let loadingText = CardService.newTextParagraph()
    .setText("Your inbox summary is creating. It might take a few minutes, we will notify you when it is ready. You can close addon");
  loadingCardSection.addWidget(loadingText);

  let loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Creation is in progress'))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  let notification = CardService.newNotification()
    .setText("Your inbox summary is creating...");

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .setNotification(notification)
    .build();

  return actionResponse;
}

const handleAssistantCreationClick = () => {
  var actionResponse = assistantCreatingCard();

  createAssistant()

  return actionResponse;
}

const assistantCreatingCard = () => {
  let loadingCardSection = CardService.newCardSection();

  let loadingText = CardService.newTextParagraph()
    .setText("Your assistant is creating. It might take a few minutes, we will notify you when it is ready. You can close addon");
  loadingCardSection.addWidget(loadingText);

  let loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Creation is in progress'))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  let notification = CardService.newNotification()
    .setText("Your assistant summary is creating...");

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .setNotification(notification)
    .build();

  return actionResponse;
}

const handleSummaryUpdateClick = () => {
  let isFileChanged = compareUpdatedDates()

  if (isFileChanged) {
    const confirmAction = CardService.newAction().setFunctionName('confirmAction');
    const denyAction = CardService.newAction().setFunctionName('denyAction');

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
      .setHeader(CardService.newCardHeader().setTitle('Please confirm action'))
      .addSection(secondCardSection)
      .addSection(CardService.newCardSection()
        .addWidget(CardService.newTextParagraph().setText('You have changed original summary, do you want to override it?')))
      .build();

    var nav = CardService.newNavigation().pushCard(secondCard);

    return CardService.newActionResponseBuilder()
      .setNavigation(nav)
      .build();
  } else {
    updateInboxSummaryRedirect()
  }
}

const summaryUpdateCard = () => {
  let loadingCardSection = CardService.newCardSection();

  let loadingText = CardService.newTextParagraph()
    .setText("Your inbox summary is updating. It might take a few minutes, we will notify you when it is ready. You can close addon");
  loadingCardSection.addWidget(loadingText);

  let loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Update is in progress'))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  let notification = CardService.newNotification()
    .setText("Your inbox summary is updating...");

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .setNotification(notification)
    .build();

  return actionResponse;
}

const runAddon = () => {
  createSettings();
  const divider = CardService.newDivider();

  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const cardSection = CardService.newCardSection();

  const isFileCreated = settings.isFileCreated;
  const companyName = settings.companyName;

  const setScrappingLimitAction = CardService.newAction().setFunctionName('setScrappingLimit');
  const setCompanyNameAction = CardService.newAction().setFunctionName('setCompanyName');

  const createInboxSummaryAction = CardService.newAction().setFunctionName('handleSummaryCreationClick');
  const updateInboxSummaryAction = CardService.newAction().setFunctionName("handleSummaryUpdateClick")
  const createAssistantAction = CardService.newAction().setFunctionName("handleAssistantCreationClick")
  const stopAssistantAction = CardService.newAction().setFunctionName("deleteAssistantAndFile")

  if (isFileCreated === false) {
    const companyNameInput = CardService.newTextInput()
      .setFieldName("company_name_input")
      .setTitle("Enter company name")
      .setValue(`${companyName}`);
    cardSection.addWidget(companyNameInput);

    const setCompanyNameButton = CardService.newTextButton()
      .setText("Set company name")
      .setOnClickAction(setCompanyNameAction);
    cardSection.addWidget(setCompanyNameButton);

    cardSection.addWidget(divider);

    const createFileButton = CardService.newTextButton()
      .setText("Create summary")
      .setOnClickAction(createInboxSummaryAction)
    cardSection.addWidget(createFileButton)
  } else {
    const emailsLimit = settings.emailsLimit;
    const fileLink = settings.docsFileLink;

    const fileUrlText = CardService.newTextParagraph()
      .setText(`Your file was created`);
    cardSection.addWidget(fileUrlText);

    const viewFileButton = CardService.newTextButton()
      .setText("View File")
      .setOpenLink(CardService.newOpenLink()
        .setUrl(`${fileLink}`)
        .setOpenAs(CardService.OpenAs.FULL_SIZE));
    cardSection.addWidget(viewFileButton);

    cardSection.addWidget(divider);

    const limitInput = CardService.newTextInput()
      .setFieldName("emails_limit_input")
      .setTitle("Enter emails limit")
      .setHint("by default it is 1000")
      .setValue(`${emailsLimit}`);
    cardSection.addWidget(limitInput);

    const setLimitButton = CardService.newTextButton()
      .setText("Set limit")
      .setOnClickAction(setScrappingLimitAction);
    cardSection.addWidget(setLimitButton);

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
  const card = CardService.newCardBuilder()
    .setName("Beta gmail support")
    .setHeader(CardService.newCardHeader().setTitle("Actions:"))
    .addSection(cardSection)
    .build();
  return card;
}