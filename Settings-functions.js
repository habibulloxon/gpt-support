const saveBooleanSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("booleanSettings", JSON.stringify(settings));
      console.log("Settings were successfully saved in booleanSettings");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }
  } catch {
    console.error(
      "Error saving or retrieving settings in booleanSettings:",
      error
    );
  }
};

const saveUserSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("userSettings", JSON.stringify(settings));
      console.log("Settings were successfully saved in userSettings");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }
  } catch {
    console.error(
      "Error saving or retrieving settings in userSettings:",
      error
    );
  }
};

const saveAddonSettings = (settings) => {
  try {
    let userProperties = PropertiesService.getUserProperties();
    if (settings) {
      userProperties.setProperty("addonSettings", JSON.stringify(settings));
      console.log("Settings were successfully saved in addonSettings");
    } else {
      console.error("Error: 'settings' is null or undefined.");
    }
  } catch {
    console.error(
      "Error saving or retrieving settings in addonSettings:",
      error
    );
  }
};

const isPropertyExist = (property) =>
  property !== null && property !== undefined;

const createSettings = () => {
  const pastTimestamp = getPastTimeStamp();
  const userProperties = PropertiesService.getUserProperties();

  const booleanSettings = userProperties.getProperty("booleanSettings");
  const userSettings = userProperties.getProperty("userSettings");
  const addonSettings = userProperties.getProperty("addonSettings");

  const isBooleanSettingsExist = isPropertyExist(booleanSettings);
  const isUserSettingsExist = isPropertyExist(userSettings);
  const isAddonSettingsExist = isPropertyExist(addonSettings);

  let newBooleanSettings = {};
  let newUserSettings = {};
  let newAddonSettings = {};

  if (!isBooleanSettingsExist) {
    newBooleanSettings = {
      isFileUpdated: false,
      isAssistantCreated: false,
      isApiKeyValid: null,
    };

    saveBooleanSettings(newBooleanSettings);
  }

  if (!isUserSettingsExist) {
    newUserSettings = {
      assistantName: "Zeva",
      openAiApiKey: "",
      companyName: "",
      emailsLimit: 100,
      autoReply: "true",
    };

    saveUserSettings(newUserSettings);
  }

  if (!isAddonSettingsExist) {
    newAddonSettings = {
      fileId: "",
      assistantId: "",
      docsFileId: "",
      docsFileLink: "",
      lastUpdatedDate: "",
      mainFunctionStatus: "idle",
      updateFunctionStatus: "idle",
      responseCreationStatus: "idle",
      messageId: "",
      threadIds: [],
      checkTimeStamp: pastTimestamp,
      summaryCreationTime: null
    };

    saveAddonSettings(newAddonSettings);
  }
};
