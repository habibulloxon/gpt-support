const deleteAllProperties = () => {
  let userProperties = PropertiesService.getUserProperties();
  userProperties.deleteAllProperties();
  console.log("All properties were deleted")
}

const consoleAllProperties = () => {
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = JSON.parse(userProperties.getProperty("booleanSettings"));
  const userSettings = JSON.parse(userProperties.getProperty("userSettings"));
  const addonSettings = JSON.parse(userProperties.getProperty("addonSettings"));

  console.log("booleanSettings: ", booleanSettings);
  console.log("userSettings: ", userSettings);
  console.log("addonSettings: ", addonSettings);
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