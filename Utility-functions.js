const deleteUserProperties = () => {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();

  console.log("All properties were deleted")
}

function sendEmail() {
  const userProperties = PropertiesService.getUserProperties();
  const settings = JSON.parse(userProperties.getProperty("settingsAPB"));

  let fileLink = settings.docsFileLink

  const email = Session.getActiveUser().getEmail();
  const subject = `${ADDON_TITLE} - summary created`;
  const template = HtmlService.createTemplateFromFile("notification");

  let htmlOutput = template.evaluate().getContent();

  let resultHTML = `<a href=${fileLink}>Click here to view file</a>`

  htmlOutput = htmlOutput.replace("{{link}}", resultHTML);

  MailApp.sendEmail({
    to: email,
    subject: subject,
    name: ADDON_TITLE,
    htmlBody: htmlOutput,
  });

  console.log("Sent!")
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

  installSummaryCreationTriggers()

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
  const loadingCardSection = CardService.newCardSection();

  const loadingText = CardService.newTextParagraph()
    .setText("Your inbox summary is creating. It might take a few minutes, we will notify you when it is ready. You can close addon");
  loadingCardSection.addWidget(loadingText);

  const loadingCard = CardService.newCardBuilder()
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