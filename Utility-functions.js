const deleteUserProperties = () => {
  var userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();

  console.log("All properties were deleted")
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

function goToRootCard() {
  let runStatus;
  while ((runStatus = retrieveSummaryCreationStatus()) !== "finished") {
    if (runStatus === "running") {
      Utilities.sleep(2000)
    }
  }

  deleteTriggers()
}

function handleRadioChange(e) {
  let selectedValue = e.commonEventObject.formInputs.radio_field;
  // {"stringInputs":{"value":["true"]}}
  let value = selectedValue.stringInputs.value[0];
  Logger.log("Selected radio button value: " + value);
}

const setUserSettings = (e) => {
  let selectedAutoReplyValue = e.commonEventObject.formInputs.radio_field;

  let companyName = e.formInput.company_name_input;
  let assistantName = e.formInput.assistant_name_input;
  let emailsLimit = e.formInput.emails_limit_input;
  let apiKey = e.formInput.api_key_input;
  let autoReply = selectedAutoReplyValue.stringInputs.value[0];

  let userSettings = {
    companyName: companyName,
    assistantName: assistantName,
    emailsLimit: emailsLimit, 
    apiKey: apiKey, 
    autoReply: autoReply
  }

  console.log("user settings: " + JSON.stringify(userSettings));
}

function testCard() {
  const cardSection = CardService.newCardSection();

  const handleClickAction = CardService.newAction().setFunctionName("setUserSettings");

  const companyNameInput = CardService.newTextInput()
    .setFieldName("company_name_input")
    .setTitle("Enter company name")
  cardSection.addWidget(companyNameInput);

  const assistantNameInput = CardService.newTextInput()
    .setFieldName("assistant_name_input")
    .setTitle("Enter assistant name")
  cardSection.addWidget(assistantNameInput);

  const emailsLimitInput = CardService.newTextInput()
    .setFieldName("emails_limit_input")
    .setTitle("Enter emails limit")
  cardSection.addWidget(emailsLimitInput);

  const apiKeyInput = CardService.newTextInput()
    .setFieldName("api_key_input")
    .setTitle("Enter api key")
  cardSection.addWidget(apiKeyInput);

  let radioGroup = CardService.newSelectionInput()
    .setType(CardService.SelectionInputType.RADIO_BUTTON)
    .setTitle("Autoreply:")
    .setFieldName("radio_field")
    .addItem("Enabled", "true", true)
    .addItem("Disabled", "false", false)
  cardSection.addWidget(radioGroup)

  const button = CardService.newTextButton()
    .setText("Save")
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