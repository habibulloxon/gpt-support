const insertReply = () => {
  const userProperties = PropertiesService.getUserProperties();
  const addonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );

  let messageId = addonSettings.singleMessageId

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

  let textToInsert = formattedAssistantResponse;

  let response = CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
      .addUpdateContent(textToInsert, CardService.ContentType.TEXT)
      .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
    .build();

  let updatedAddonSettings = {
    ...addonSettings,
    singleMessageId: ""
  }
  saveAddonSettings(updatedAddonSettings)

  return response;
}

const onGmailMessageOpen = () => {
  const userProperties = PropertiesService.getUserProperties();
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );
  const addonSettings = JSON.parse(
    userProperties.getProperty("addonSettings")
  );
  const isAssistantCreated = booleanSettings.isAssistantCreated;
  const singleMessageId = addonSettings.singleMessageId;
  const cardSection = CardService.newCardSection();
  var action = CardService.newAction().setFunctionName('insertReply');

  if (!isAssistantCreated) {
    const errorText = CardService.newTextParagraph().setText(
      "Error, firstly create assistant"
    );
    cardSection.addWidget(errorText);
  } else if (singleMessageId === "") {
    const errorText = CardService.newTextParagraph().setText(
      "Error, firstly open our addon"
    );
    cardSection.addWidget(errorText);

    const image = CardService.newImage()
      .setImageUrl("")
      .setAltText("Error image")
    cardSection.addWidget(image)
  } else {
    const replyBtn = CardService.newTextButton()
      .setText("Generate reply to this email")
      .setOnClickAction(action);
    cardSection.addWidget(replyBtn);
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