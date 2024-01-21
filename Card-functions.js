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

const confirmAction = () => {
  installSummaryUpdateTriggers()
}

const denyAction = () => {
  var nav = CardService.newNavigation().popToRoot();

  return CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();
}


const updateInboxSummaryAction = () => {
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
    installSummaryUpdateTriggers()
  }
}

const runAddon = () => {
  createSettings();
  const divider = CardService.newDivider();

  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  const cardSection = CardService.newCardSection();

  const isFileCreated = settings.isFileCreated;

  const setScrappingLimitAction = CardService.newAction().setFunctionName('setScrappingLimit');
  const createInboxSummaryAction = CardService.newAction().setFunctionName('handleClick');
  const updateInboxSummaryAction = CardService.newAction().setFunctionName("updateInboxSummaryAction")
  const createAssistantAction = CardService.newAction().setFunctionName("createAssistant")
  const stopAssistantAction = CardService.newAction().setFunctionName("deleteAssistantAndFile")

  if (isFileCreated === false) {
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