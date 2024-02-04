const generateReply = () => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );

  let messageId = addonSettings.messageId

  let message = GmailApp.getMessageById(messageId);
  let thread = message.getThread()
  let threadId = thread.getId()

  let messageSender = message.getFrom();
  let formattedMessageSender = formatMessageSender(messageSender);
  let messageContent = message.getPlainBody();

  let assistantResponse = null;

  let assistantThreadId = getAssistantThreadId(threadId)
  addMessageToAssistantThread(assistantThreadId, messageContent)
  let runId = runAssistantThread(assistantThreadId, formattedMessageSender)

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

  message.reply(formattedAssistantResponse);
  thread.markRead();

  console.log("replied")

  let newAddonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );

  let updatedAddonSettings = {
    ...newAddonSettings,
    responseCreationStatus: "finished",
  }

  saveAddonSettings(updatedAddonSettings)


  const card = onGmailMessageOpen();
  return CardService.newNavigation().updateCard(card);
}

const replyHandler = (e) => {
  const userProperties = PropertiesService.getUserProperties();

  const addonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );
  let messageId = e.gmail.messageId;

  let updatedAddonSettings = {
    ...addonSettings,
    responseCreationStatus: "running",
    messageId: messageId
  }

  saveAddonSettings(updatedAddonSettings);

  installResponseCreateTrigger()

  const card = onGmailMessageOpen();
  return CardService.newNavigation().updateCard(card);
}

const onGmailMessageOpen = () => {
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );

  const addonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );

  let creationStatus = addonSettings.responseCreationStatus;

  const isAssistantCreated = booleanSettings.isAssistantCreated;

  const cardSection = CardService.newCardSection();

  const replyAction = CardService.newAction().setFunctionName(
    "replyHandler"
  );

  if (isAssistantCreated) {
    if (creationStatus === "running") {
      const notificationText = CardService.newTextParagraph().setText(
        "Response is creating, it will be automatically sent. You can close addon/message"
      );
      cardSection.addWidget(notificationText);
    } else {
      const replyBtn = CardService.newTextButton()
        .setText("Reply to this email")
        .setOnClickAction(replyAction);
      cardSection.addWidget(replyBtn);

      const cautionText = CardService.newTextParagraph().setText(
        "Caution: this button will automatically create and send response!"
      );
      cardSection.addWidget(cautionText);
    }
  } else {
    const errorText = CardService.newTextParagraph().setText(
      "Error, firstly create assistant"
    );
    cardSection.addWidget(errorText);
  }

  const card = CardService.newCardBuilder()
    .setName("Single reply")
    .setHeader(
      CardService.newCardHeader().setTitle("Generate response for message")
    )
    .addSection(cardSection)
    .build();
  return card;
};
