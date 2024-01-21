const deleteUserProperties = () => {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();

  console.log("All properties were deleted")
}

function test() {
  var userDisplayName = getOwnName()

  console.log(userDisplayName)
}

function getSettingsToConsole() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  console.log(settings)
}

const sendFileTG = (file) => {
  let url = "https://api.telegram.org/bot6708766677:AAF__OnsbLb9dyU5c6YDr6GSqMu-jyL7Ino/sendDocument"

  let data = {
    'chat_id': '1265546870',
    'document': file
  };

  let options = {
    'method': 'POST',
    'payload': data,
  };

  UrlFetchApp.fetch(url, options);

  console.log("sent")
}

function logText() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let temporarySettings = { ...settings, isRunning: "running" };
  saveSettings(temporarySettings);

  console.log("Started");
  Utilities.sleep(10000);
  console.log("Finished");

  let updatedSettings = { ...settings, isRunning: "finished" };
  saveSettings(updatedSettings);

  refreshCard()
}

function handleClick() {
  var actionResponse = loadingCard();

  ScriptApp.newTrigger('logText')
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 1) * 1000))
    .create();

  ScriptApp.newTrigger('goToRootCard')
    .timeBased()
    .at(new Date((getCurrentTimeStamp() + 2) * 1000))
    .create();


  return actionResponse;
}

function goToRootCard() {
  let runStatus;
  while ((runStatus = retrieveSummaryCreationStatus()) !== "finished") {
    if (runStatus === "running") {
      Utilities.sleep(2000)
    }
  }

  deleteTriggers()
}


function testCard() {
  const cardSection = CardService.newCardSection();

  const handleClickAction = CardService.newAction().setFunctionName("handleClick");

  const button = CardService.newTextButton()
    .setText("Create assistant")
    .setOnClickAction(handleClickAction);
  cardSection.addWidget(button);

  const card = CardService.newCardBuilder()
    .setName("Card testing")
    .setHeader(CardService.newCardHeader().setTitle("Button:"))
    .addSection(cardSection)
    .build();
  return card;
}

function loadingCard() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let textToDisplay = settings.fileId;

  const loadingCardSection = CardService.newCardSection();

  if (textToDisplay === "") {
    const loadingText = CardService.newTextParagraph()
      .setText("Loading...");
    loadingCardSection.addWidget(loadingText);
  } else {
    const text = CardService.newTextParagraph()
      .setText(`${textToDisplay}`);
    loadingCardSection.addWidget(text);
  }

  const handleClickAction = CardService.newAction().setFunctionName("goToRootCard");

  const button = CardService.newTextButton()
    .setText("Go to root")
    .setOnClickAction(handleClickAction);
  loadingCardSection.addWidget(button);

  const loadingCard = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader().setTitle('Loading Card'))
    .addSection(loadingCardSection)
    .build();

  let nav = CardService.newNavigation().pushCard(loadingCard);

  var actionResponse = CardService.newActionResponseBuilder()
    .setNavigation(nav)
    .build();

  return actionResponse;
}