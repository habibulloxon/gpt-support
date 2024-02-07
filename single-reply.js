const insertReply = () => {
  let textToInsert = "Your text to insert goes here";

  let response = CardService.newUpdateDraftActionResponseBuilder()
    .setUpdateDraftBodyAction(CardService.newUpdateDraftBodyAction()
      .addUpdateContent(textToInsert, CardService.ContentType.TEXT)
      .setUpdateType(CardService.UpdateDraftBodyType.IN_PLACE_INSERT))
    .build();

  return response;
}

const onGmailMessageOpen = () => {
  const userProperties = PropertiesService.getUserProperties();
  const booleanSettings = JSON.parse(
    userProperties.getProperty("booleanSettings")
  );
  const isAssistantCreated = booleanSettings.isAssistantCreated;
  const cardSection = CardService.newCardSection();
  var action = CardService.newAction().setFunctionName('insertReply');

  if (isAssistantCreated) {
    const replyBtn = CardService.newTextButton()
      .setText("Generate reply to this email")
      .setOnClickAction(action);
    cardSection.addWidget(replyBtn);
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