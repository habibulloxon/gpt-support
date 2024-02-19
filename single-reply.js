const getThreadIdFunction = (e) => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let messageId = e.gmail.messageId;

  let updatedAddonSettings = {
    ...addonSettings,
    singleMessageId: messageId,
  };

  saveAddonSettings(updatedAddonSettings);

  console.log(updatedAddonSettings);

  const card = runAddon();
  return card;
};

const insertReply = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let messageId = addonSettings.singleMessageId;

  let message = GmailApp.getMessageById(messageId);
  let thread = message.getThread();
  let threadId = thread.getId();

  let messageSender = message.getFrom();
  let formattedMessageSender = formatMessageSender(messageSender);
  let messageContent = message.getPlainBody();

  let assistantResponse = null;

  let assistantThreadId = getAssistantThreadId(threadId);
  addMessageToAssistantThread(assistantThreadId, messageContent);
  let runId = runAssistantThread(assistantThreadId, formattedMessageSender);

  let runStatus;
  while (
    (runStatus = retrieveRunStatus(assistantThreadId, runId)) !== "completed"
  ) {
    if (runStatus === "queued") {
      Utilities.sleep(5000);
    }
  }
  assistantResponse = getAssistantMessages(assistantThreadId);
  let formattedAssistantResponse = formatAssistantResponse(assistantResponse);

  let textToInsert = formattedAssistantResponse;

  let response = CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(
      CardService.newUpdateDraftBodyAction()
        .addUpdateContent(textToInsert, CardService.ContentType.TEXT)
        .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT)
    )
    .build();

  let newAddonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  let updatedAddonSettings = {
    ...newAddonSettings,
    singleMessageId: "",
  };
  saveAddonSettings(updatedAddonSettings);

  return response;
};

const onGmailMessageOpen = () => {
  const divider = CardService.newDivider();

  const userProperties = PropertiesService.getUserProperties();
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));
  const isAssistantCreated = booleanSettings.isAssistantCreated;
  const singleMessageId = addonSettings.singleMessageId;
  const cardSection = CardService.newCardSection();
  var action = CardService.newAction().setFunctionName("insertReply");

  if (!isAssistantCreated || isAssistantCreated === null) {
    const errorText = CardService.newTextParagraph().setText(
      `<b>Error:</b> An assistant has not been created yet. Please set up your ${ADDON_TITLE} first to use this feature.`
    );
    cardSection.addWidget(errorText);
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
  } else if (singleMessageId === "") {
    const errorText = CardService.newTextParagraph().setText(
      `<b>Error:</b> The add-on is currently closed. Please open the ${ADDON_TITLE} add-on to proceed with generating a response.`
    );
    cardSection.addWidget(errorText);

    let imageBytes = DriveApp.getFileById("1TSWI4qU6QASq5eeuR8w7cWrlb6g-B9ls").getBlob().getBytes();
    let encodedImageURL = "data:image/jpeg;base64," + Utilities.base64Encode(imageBytes);

    const image = CardService.newImage()
      .setImageUrl(encodedImageURL)
      .setAltText("Error image");
    cardSection.addWidget(image);

    const infoText = CardService.newTextParagraph().setText(
      "Please ensure that the add-on remains open while generating a response for an email. This is necessary for the assistant to function correctly and provide you with a timely reply."
    );
    cardSection.addWidget(infoText);

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
  } else {
    const replyBtn = CardService.newTextButton()
      .setText("Generate Quick Response")
      .setBackgroundColor("#057BCD")
      .setOnClickAction(action);
    cardSection.addWidget(replyBtn);

    cardSection.addWidget(divider)

    const infoText = CardService.newTextParagraph().setText(
      "Clicking the 'Generate Quick Response' button will prompt the assistant to create a reply for the last email in your conversation thread. This will be done swiftly and shouldn't take long."
    );
    cardSection.addWidget(infoText);
  }

  const card = CardService.newCardBuilder()
    .setName("Single reply")
    .setHeader(
      CardService.newCardHeader().setTitle("Quick Reply Assistant")
    )
    .addSection(cardSection)
    .build();
  return card;
};