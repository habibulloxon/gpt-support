/**
 * Saves settings to user properties
 * @param {object} settings - settings object.
 */
const saveSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("settingsAPB", JSON.stringify(settings));
      console.log(`Settings in ${ADDON_TITLE} were saved successfully.`);
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }
    let temp = userProperties.getProperty("settingsAPB");
    let parsedSettings = JSON.parse(temp);
    console.log("Settings: ", parsedSettings);
    refreshCard()
  } catch (error) {
    console.error("Error saving or retrieving settings:", error);
  }
};

const createSettings = () => {
  let pastTimestamp = getPastTimeStamp();

  let userProperties = PropertiesService.getUserProperties();
  let settings = userProperties.getProperty("settingsAPB");
  let isUserPropsExist = settings !== null && settings !== undefined;

  let updatedSettings = {}

  if (!isUserPropsExist) {
    updatedSettings = {
      assistantName: "Zeva",
      openAiApiKey: "",
      companyName: "",
      emailsLimit: 100,
      autoReply: "true",
      mainFunctionStatus: "idle",
      isApiKeyValid: false,
      updateFunctionStatus: "idle",
      fileId: "",
      assistantId: "",
      docsFileId: "",
      docsFileLink: "",
      lastUpdatedDate: "",
      isFileCreated: false,
      isFileUpdated: false,
      isAssistantCreated: false,
      threadIds: [],
      checkTimeStamp: pastTimestamp
    }
    saveSettings(updatedSettings);

    console.log("Settings were created")
  }
}